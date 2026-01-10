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
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting market signals detection...");

    // Analyze user events from past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEvents } = await supabase
      .from("user_events")
      .select("event, car_id, meta, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .in("event", ["car_view", "contact_click", "test_drive_request"]);

    if (!recentEvents || recentEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recent events to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze by brand
    const brandCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const demandGaps: Record<string, any> = {};

    for (const event of recentEvents) {
      // Count brand interactions
      if (event.meta?.brand) {
        brandCounts[event.meta.brand] = (brandCounts[event.meta.brand] || 0) + 1;
      }

      // Count location interests
      if (event.meta?.city) {
        locationCounts[event.meta.city] = (locationCounts[event.meta.city] || 0) + 1;
      }
    }

    // Detect trending brands (> 10 interactions)
    const trendingBrands = Object.entries(brandCounts)
      .filter(([_, count]) => count > 10)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);

    // Detect hot locations
    const hotLocations = Object.entries(locationCounts)
      .filter(([_, count]) => count > 15)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);

    // Check for inventory gaps (high demand, low supply)
    const { data: unmetExpectations } = await supabase
      .from("unmet_expectations")
      .select("*")
      .gte("created_at", sevenDaysAgo.toISOString());

    const inventoryGaps: any[] = [];
    if (unmetExpectations && unmetExpectations.length > 5) {
      // Group by brand/model
      const gapCounts: Record<string, number> = {};
      for (const gap of unmetExpectations) {
        const key = gap.expected_features?.brand || "Unknown";
        gapCounts[key] = (gapCounts[key] || 0) + 1;
      }

      inventoryGaps.push(...Object.entries(gapCounts)
        .filter(([_, count]) => count >= 3)
        .map(([brand, count]) => ({ brand, count }))
        .slice(0, 5)
      );
    }

    const signals: any[] = [];

    // Insert trending brand signals
    for (const [brand, count] of trendingBrands) {
      const previous = Math.floor(count * 0.7); // Mock previous value
      const changePercent = ((count - previous) / previous) * 100;

      signals.push({
        signal_type: "trending_brand",
        entity_type: "brand",
        entity_name: brand,
        metric_value: count,
        previous_value: previous,
        change_percentage: changePercent,
        trend_direction: "up",
        confidence_score: Math.min(95, 60 + (count - 10) * 3),
        priority: count > 30 ? 90 : count > 20 ? 70 : 50,
        metadata: { period: "last_7_days", event_count: count }
      });
    }

    // Insert hot location signals
    for (const [location, count] of hotLocations) {
      const previous = Math.floor(count * 0.8);
      const changePercent = ((count - previous) / previous) * 100;

      signals.push({
        signal_type: "hot_location",
        entity_type: "location",
        entity_name: location,
        metric_value: count,
        previous_value: previous,
        change_percentage: changePercent,
        trend_direction: "up",
        confidence_score: Math.min(90, 50 + (count - 15) * 2),
        priority: count > 40 ? 85 : count > 25 ? 65 : 50,
        metadata: { period: "last_7_days", interest_count: count }
      });
    }

    // Insert inventory gap signals
    for (const gap of inventoryGaps) {
      signals.push({
        signal_type: "inventory_gap",
        entity_type: "brand",
        entity_name: gap.brand,
        metric_value: gap.count,
        previous_value: 0,
        change_percentage: 100,
        trend_direction: "up",
        confidence_score: 75,
        priority: gap.count > 5 ? 95 : 70,
        metadata: { unmet_requests: gap.count, period: "last_7_days" }
      });
    }

    // Bulk insert signals
    if (signals.length > 0) {
      const { error } = await supabase
        .from("market_signals")
        .insert(signals);

      if (error) {
        console.error("Error inserting signals:", error);
        throw error;
      }
    }

    console.log(`Detected ${signals.length} market signals`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        signals_detected: signals.length,
        trending_brands: trendingBrands.length,
        hot_locations: hotLocations.length,
        inventory_gaps: inventoryGaps.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error detecting market signals:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
