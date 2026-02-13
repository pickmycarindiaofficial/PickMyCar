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

    // Get available inventory detailed summary
    // 1. Get brand counts
    const { data: brandCounts } = await supabase
      .from('car_listings')
      .select('brand_id, brands(name)')
      .eq('status', 'live');

    // Process brand counts
    const brandMap = new Map();
    if (brandCounts) {
      brandCounts.forEach((item: any) => {
        const name = item.brands?.name;
        if (name) {
          brandMap.set(name, (brandMap.get(name) || 0) + 1);
        }
      });
    }

    // Top 10 brands string
    const topBrands = Array.from(brandMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ');

    // 2. Get specific model counts for popular brands (optional, but good for context)
    // For now, we'll stick to brand counts to keep context size manageable, 
    // but we can add a "check database" tool in the future.

    const { count: totalCars } = await supabase
      .from('car_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live');

    const systemPrompt = `You are the AI Assistant for PickMyCar, India's trusted used car marketplace.
    
Your Goal: Help users find their ideal car efficiently and politely.

**Core Inventory Status:**
- Total Cars Available: ${totalCars || 'Many'} verified cars.
- Top Brands in Stock: ${topBrands}
- We have cars across all major cities in India.

**Response Guidelines:**
1.  **Tone:** Be helpful, professional, and concise. Talk like a knowledgeable human consultant.
    -   ❌ Avoid: "Excellent choice!", "That's a great question!", "I'm happy to help you with that." (Filler phrase)
    -   ✅ Do: "We have 3 BMW 3-Series available via our dealers." or "The Honda City is known for reliability..."
2.  **Links:** When a user asks for a car we likely have, provide a Direct Search Link using this format:
    -   [View {Car Name}s](/search?q={Brand}+{Model})
    -   Example: "We have several options. [View Hyundai Cretas](/search?q=Hyundai+Creta)"
3.  **Inventory Awareness:** Use the "Top Brands" list above to know what we definitely have. If a user asks for a brand not in the top list, say "I can check our full inventory for {Brand}..." and give a search link.
4.  **Pricing:** All prices are in Indian Rupees (₹). 1 Lakh = 100,000. 1 Crore = 10,000,000.
5.  **Safety:** Emphasize that all cars are inspected and dealers are verified.

${contextInfo}

**If the user asks to see cars:**
- Don't just list specs. Give them a link to see the actual cars.
- Ask 1-2 clarifying questions only if necessary (Budget, Fuel Type).

**If the user asks "What do you have?":**
- Mention the top brands we have in stock.
- Ask for their preference (Sedan/SUV/Hatchback).`;

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
