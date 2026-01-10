import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    console.log(`Generating smart recommendations for user: ${user_id}`);

    // Fetch user's behavior and preferences
    const { data: userEvents } = await supabase
      .from("user_events")
      .select("event, car_id, meta, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: userProfile } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const { data: savedCars } = await supabase
      .from("saved_cars")
      .select("car_listing_id")
      .eq("user_id", user_id);

    // Get available cars
    const { data: availableCars } = await supabase
      .from("car_listings")
      .select(`
        *,
        brand:brand_id(name),
        model:model_id(name),
        city:city_id(name)
      `)
      .eq("status", "live")
      .limit(50);

    if (!availableCars || availableCars.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI for intelligent recommendations
    const systemPrompt = `You are an AI car recommendation engine for an automotive marketplace.
Analyze user behavior and preferences to recommend the most suitable cars.
Consider: budget, brand preferences, location, body type, fuel type, and user intent.
Return car IDs ranked by relevance with reasoning.`;

    const userPrompt = `User Profile:
- Intent: ${userProfile?.intent || 'exploring'}
- Budget Range: ${userProfile?.budget_min || 0} - ${userProfile?.budget_max || 0}
- Preferred Location: ${userProfile?.preferred_location || 'any'}
- Recent Activity: ${userEvents?.length || 0} events
- Saved Cars: ${savedCars?.length || 0}

Available Cars (${availableCars.length} total):
${availableCars.slice(0, 30).map(car => 
  `ID: ${car.id}, Brand: ${car.brand?.name}, Model: ${car.model?.name}, Price: ${car.expected_price}, City: ${car.city?.name}`
).join('\n')}

Recommend top 5-10 cars with match scores and reasoning.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_cars",
              description: "Recommend cars with match scores",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        car_id: { type: "string" },
                        match_score: { type: "number", minimum: 0, maximum: 100 },
                        reasoning: { type: "string" },
                        why_good_fit: { type: "string" }
                      },
                      required: ["car_id", "match_score", "reasoning"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_cars" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No recommendations generated");
    }

    const recommendations = JSON.parse(toolCall.function.arguments).recommendations;

    // Enrich recommendations with full car data
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const car = availableCars.find(c => c.id === rec.car_id);
      return {
        ...rec,
        car: car || null
      };
    }).filter((rec: any) => rec.car !== null);

    console.log(`Generated ${enrichedRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({ recommendations: enrichedRecommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
