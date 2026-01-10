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
    const { messages, userId, sessionId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get context: user's recent views, saved cars, search patterns
    let contextInfo = '';
    if (userId) {
      // Get user's saved cars
      const { data: savedCars } = await supabase
        .from('user_saved_cars')
        .select('car_listings(id, listing_id, brands(name), models(name), expected_price, year_of_make)')
        .eq('user_id', userId)
        .limit(5);

      // Get recent views
      const { data: recentViews } = await supabase
        .from('user_car_views')
        .select('car_listing_id')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (savedCars && savedCars.length > 0) {
        contextInfo += `\n\nUser's Saved Cars:\n${savedCars.map((sc: any) => 
          `- ${sc.car_listings?.brands?.name} ${sc.car_listings?.models?.name} (${sc.car_listings?.year_of_make}) - ₹${sc.car_listings?.expected_price?.toLocaleString()}`
        ).join('\n')}`;
      }

      if (recentViews && recentViews.length > 0) {
        contextInfo += `\n\nUser has viewed ${recentViews.length} cars recently.`;
      }
    }

    // Get available inventory summary
    const { count: totalCars } = await supabase
      .from('car_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live');

    const systemPrompt = `You are an expert car shopping assistant for India's leading used car marketplace. Your goal is to help buyers find their perfect car and connect them with trusted dealers.

Your capabilities:
- Search and recommend cars based on budget, brand, model, city, fuel type, body type
- Calculate EMI and explain financing options
- Compare cars and explain pros/cons
- Provide market insights and fair pricing information
- Schedule test drives and connect buyers to dealers
- Answer questions about car features, maintenance, and ownership

Current marketplace inventory: ${totalCars || 'Many'} verified used cars available across India.
${contextInfo}

Guidelines:
- Be conversational, friendly, and helpful
- Ask clarifying questions to understand user needs
- Provide specific recommendations with reasoning
- Always end responses with a clear call-to-action (view cars, contact dealer, calculate EMI)
- Use Indian Rupees (₹) for all prices
- Mention that all cars are verified and dealers are trusted
- For specific car recommendations, guide users to filter or search the listings

When users ask about specific cars or want to search:
- Ask about their budget range
- Ask about preferred city/location
- Ask about car type preference (Sedan, SUV, Hatchback, etc.)
- Ask about must-have features
- Then guide them to use the search/filter on the platform

Remember: You're here to assist and guide, not to make the final decision for them.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Log chat session for analytics
    if (userId && sessionId) {
      await supabase.from('ai_chat_sessions').upsert({
        id: sessionId,
        user_id: userId,
        messages: messages,
        last_message_at: new Date().toISOString(),
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in car-shopping-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
