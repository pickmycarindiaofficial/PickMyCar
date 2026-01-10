import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather user behavior data
    const { data: savedCars } = await supabase
      .from('user_saved_cars')
      .select(`
        car_listings (
          id, brand_id, model_id, body_type_id, fuel_type_id, 
          expected_price, year_of_make, kms_driven,
          brands (name),
          models (name),
          body_types (name),
          fuel_types (name)
        )
      `)
      .eq('user_id', userId)
      .limit(10);

    const { data: recentViews } = await supabase
      .from('user_car_views')
      .select(`
        car_listing_id,
        car_listings (
          id, brand_id, model_id, expected_price, year_of_make
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    // Get user interactions for pattern analysis
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('interaction_type, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Build user profile for AI
    const userProfile = {
      savedCars: savedCars?.map((sc: any) => ({
        brand: sc.car_listings?.brands?.name,
        model: sc.car_listings?.models?.name,
        bodyType: sc.car_listings?.body_types?.name,
        fuelType: sc.car_listings?.fuel_types?.name,
        price: sc.car_listings?.expected_price,
        year: sc.car_listings?.year_of_make,
      })) || [],
      viewedCars: recentViews?.length || 0,
      interactions: interactions || [],
    };

    // Get available cars (excluding already viewed)
    const viewedIds = recentViews?.map((v: any) => v.car_listing_id) || [];
    const { data: availableCars } = await supabase
      .from('car_listings')
      .select(`
        id, listing_id, expected_price, year_of_make, kms_driven,
        brands (name),
        models (name),
        body_types (name),
        fuel_types (name),
        cities (name)
      `)
      .eq('status', 'live')
      .not('id', 'in', `(${viewedIds.join(',') || 'null'})`)
      .limit(100);

    if (!LOVABLE_API_KEY || !availableCars || availableCars.length === 0) {
      // Fallback to simple recommendation
      return new Response(
        JSON.stringify({ recommendations: availableCars?.slice(0, 12) || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to analyze and recommend
    const prompt = `Analyze this user's car browsing behavior and recommend the 12 best cars from the available inventory.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Available Cars (first 100 shown):
${JSON.stringify(availableCars.slice(0, 50), null, 2)}

Instructions:
1. Identify patterns in the user's preferences (price range, brands, body types, fuel types)
2. Consider their budget consistency
3. Look for similar cars to what they've saved
4. Recommend cars that match their preferences
5. Include some variety (don't recommend only one brand)
6. Return ONLY a JSON array of car IDs in order of relevance

Response format:
{
  "recommendedIds": ["id1", "id2", "id3", ...],
  "reasoning": "Brief explanation of recommendation strategy"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a car recommendation expert. Analyze user behavior and return JSON recommendations.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI recommendation error:', await aiResponse.text());
      // Fallback to simple recommendation
      return new Response(
        JSON.stringify({ recommendations: availableCars.slice(0, 12) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content || '{}';
    
    // Parse AI response
    let recommendedIds: string[] = [];
    try {
      const parsed = JSON.parse(aiContent);
      recommendedIds = parsed.recommendedIds || [];
    } catch {
      // Fallback if AI doesn't return valid JSON
      recommendedIds = availableCars.slice(0, 12).map((c: any) => c.id);
    }

    // Get full car details for recommended IDs
    const recommendations = recommendedIds
      .map(id => availableCars.find((c: any) => c.id === id))
      .filter(Boolean)
      .slice(0, 12);

    // If AI recommendations are insufficient, fill with popular cars
    if (recommendations.length < 12) {
      const remaining = availableCars
        .filter((c: any) => !recommendedIds.includes(c.id))
        .slice(0, 12 - recommendations.length);
      recommendations.push(...remaining);
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
