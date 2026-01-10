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

    const { target_id, target_type } = await req.json();

    if (!target_id || !target_type) {
      throw new Error("target_id and target_type are required");
    }

    console.log(`Generating AI suggestions for ${target_type}: ${target_id}`);

    // Fetch relevant data based on target type
    let contextData: any = {};

    if (target_type === "dealer") {
      // Fetch dealer metrics and performance
      const { data: metrics } = await supabase
        .from("dealer_behavior_metrics")
        .select("*")
        .eq("dealer_id", target_id)
        .is("period_end", null)
        .single();

      const { data: leads } = await supabase
        .from("car_enquiries")
        .select("*")
        .eq("dealer_id", target_id)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: listings } = await supabase
        .from("car_listings")
        .select("*")
        .eq("seller_id", target_id)
        .eq("seller_type", "dealer")
        .limit(10);

      contextData = { metrics, leads, listings };
    } else if (target_type === "powerdesk") {
      // Fetch system-wide insights
      const { data: dealers } = await supabase
        .from("dealer_behavior_metrics")
        .select("*")
        .is("period_end", null)
        .order("quality_score", { ascending: true })
        .limit(5);

      const { data: demandGaps } = await supabase
        .from("unmet_expectations")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      contextData = { dealers, demandGaps };
    }

    // Call Lovable AI to generate suggestions
    const systemPrompt = `You are an AI business advisor for an automotive marketplace platform. 
Generate 3-5 actionable, specific suggestions to improve business performance.
Focus on: response times, lead conversion, inventory management, pricing strategy, and market opportunities.
Be specific with numbers and timeframes. Keep suggestions practical and measurable.`;

    const userPrompt = `Based on this data for a ${target_type}, generate business improvement suggestions:
${JSON.stringify(contextData, null, 2)}`;

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
              name: "create_suggestions",
              description: "Create actionable business suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["pricing", "inventory", "marketing", "lead_followup", "performance"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        reasoning: { type: "string" },
                        expected_impact: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        action_label: { type: "string" }
                      },
                      required: ["type", "title", "description", "priority"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_suggestions" } }
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
      throw new Error("No suggestions generated");
    }

    const suggestions = JSON.parse(toolCall.function.arguments).suggestions;

    // Insert suggestions into database
    const insertPromises = suggestions.map((suggestion: any) =>
      supabase.from("ai_suggestions").insert({
        target_id,
        target_type,
        suggestion_type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        reasoning: suggestion.reasoning || "",
        expected_impact: suggestion.expected_impact || "",
        priority: suggestion.priority,
        action_label: suggestion.action_label || "Take Action",
        status: "pending"
      })
    );

    await Promise.all(insertPromises);

    console.log(`Created ${suggestions.length} AI suggestions`);

    return new Response(
      JSON.stringify({ success: true, count: suggestions.length, suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
