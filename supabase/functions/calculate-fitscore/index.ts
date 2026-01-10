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
    const { userId, carListings, userLocation } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get user events for behavior analysis
    const { data: events } = await supabase
      .from("user_events")
      .select("*")
      .eq("user_id", userId)
      .order("at", { ascending: false })
      .limit(100);

    // Calculate FitScore for each car
    const scores: Record<string, number> = {};

    for (const car of carListings) {
      let score = 0;

      // W1: IntentBoost (12 points)
      const intentScore = profile?.intent_score || 0;
      if (intentScore > 70) score += 12;
      else if (intentScore > 40) score += 8;
      else score += 4;

      // W2: BudgetFit (18 points) - bell curve
      if (profile?.budget_band) {
        const [min, max] = profile.budget_band.split("-").map((v: string) => 
          parseFloat(v.replace(/[^0-9.]/g, "")) * 100000
        );
        const carPrice = car.expected_price || car.price;
        const budgetMid = (min + max) / 2;
        const distance = Math.abs(carPrice - budgetMid);
        const range = (max - min) / 2;
        const fitPercent = Math.max(0, 1 - (distance / (range * 2)));
        score += fitPercent * 18;
      } else {
        score += 9; // neutral if no budget set
      }

      // W3: BrandAffinity (12 points)
      const brandAffinity = profile?.brand_affinity || {};
      const carBrand = car.brand || car.brands?.name;
      if (brandAffinity[carBrand]) {
        score += Math.min(12, brandAffinity[carBrand] * 0.12);
      } else {
        score += 3; // small boost for discovery
      }

      // W4: BodyTypeMatch (10 points)
      const bodyTypeAffinity = profile?.body_type_affinity || {};
      const carBodyType = car.bodyType || car.body_types?.name;
      if (bodyTypeAffinity[carBodyType]) {
        score += Math.min(10, bodyTypeAffinity[carBodyType] * 0.1);
      }

      // W5: PriceDropAttractiveness (10 points)
      const priceSensitivity = profile?.price_sensitivity || 50;
      if (car.originalPrice && car.originalPrice > car.price) {
        const dropPercent = ((car.originalPrice - car.price) / car.originalPrice) * 100;
        score += (dropPercent / 100) * (priceSensitivity / 100) * 10;
      }

      // W6: DistanceFactor (6 points)
      if (userLocation && car.city) {
        // Simple distance calculation - in production use proper geocoding
        // For now, boost if same city mentioned
        score += 6; // Simplified - would need proper distance calc
      } else {
        score += 3; // neutral
      }

      // W7: QualitySignals (16 points)
      let qualityScore = 0;
      if (car.kms_driven < 30000) qualityScore += 5;
      else if (car.kms_driven < 50000) qualityScore += 3;
      
      if (car.owner_type?.includes("1st")) qualityScore += 5;
      else if (car.owner_type?.includes("2nd")) qualityScore += 3;
      
      if (car.category?.includes("Warranty")) qualityScore += 6;
      
      score += Math.min(16, qualityScore);

      // W8: FinanceMatch (16 points)
      const financeInterest = profile?.finance_interest || 0;
      if (financeInterest > 50 && car.emiPerMonth) {
        // Estimate EMI comfort based on budget
        score += 10;
      } else if (financeInterest > 0) {
        score += 5;
      }

      // Normalize to 0-100
      scores[car.id] = Math.min(100, Math.round(score));
    }

    return new Response(
      JSON.stringify({ scores }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("FitScore calculation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
