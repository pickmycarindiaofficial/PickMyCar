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
    const { userId, interactionType, carListingId, metadata } = await req.json();

    if (!userId || !interactionType) {
      return new Response(
        JSON.stringify({ error: 'userId and interactionType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Track interaction
    const { error: interactionError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        interaction_type: interactionType,
        car_listing_id: carListingId,
        metadata: metadata || {},
      });

    if (interactionError) throw interactionError;

    // Calculate lead score
    const scoreWeights: Record<string, number> = {
      'view': 5,
      'save': 15,
      'emi_calculation': 20,
      'dealer_contact': 25,
      'whatsapp_click': 20,
      'call_click': 25,
      'chat_interaction': 10,
    };

    // Get all interactions for this user (last 30 days)
    const { data: allInteractions } = await supabase
      .from('user_interactions')
      .select('interaction_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    let totalScore = 0;
    const interactionCounts: Record<string, number> = {};

    allInteractions?.forEach((interaction: any) => {
      const type = interaction.interaction_type;
      interactionCounts[type] = (interactionCounts[type] || 0) + 1;
      totalScore += scoreWeights[type] || 0;
    });

    // Bonus points for consistency and recency
    const returnVisits = new Set(
      allInteractions?.map((i: any) => new Date(i.created_at).toDateString())
    ).size;
    totalScore += returnVisits * 10;

    // Cap at 100
    totalScore = Math.min(totalScore, 100);

    // Determine lead quality
    let leadQuality: 'cold' | 'warm' | 'hot';
    if (totalScore >= 80) leadQuality = 'hot';
    else if (totalScore >= 50) leadQuality = 'warm';
    else leadQuality = 'cold';

    // Update or create lead score
    const { error: scoreError } = await supabase
      .from('lead_scores')
      .upsert({
        user_id: userId,
        score: totalScore,
        lead_quality: leadQuality,
        factors: {
          interactions: interactionCounts,
          returnVisits,
          lastInteraction: new Date().toISOString(),
        },
        last_updated: new Date().toISOString(),
      });

    if (scoreError) throw scoreError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadScore: totalScore,
        leadQuality,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-interaction:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
