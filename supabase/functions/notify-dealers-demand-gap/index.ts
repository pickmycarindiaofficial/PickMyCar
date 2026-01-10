import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemandGapRecord {
  id: string;
  user_id?: string;
  budget_min?: number;
  budget_max?: number;
  city?: string;
  must_haves?: any;
  note?: string;
  urgency?: string;
  brand_preference?: string[];
  model_preference?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { record } = await req.json();
    console.log('Processing demand gap:', record.id);

    // Calculate priority score
    const priorityScore = calculatePriorityScore(record);
    console.log('Calculated priority score:', priorityScore);

    // Update priority score
    await supabase
      .from('unmet_expectations')
      .update({ priority_score: priorityScore })
      .eq('id', record.id);

    // Find matching dealers
    const matchedDealers = await findMatchingDealers(supabase, record);
    console.log('Found matching dealers:', matchedDealers.length);

    // Create notifications for each dealer
    const notifications = matchedDealers.map((dealer: any) => ({
      demand_gap_id: record.id,
      dealer_id: dealer.id,
      notification_type: 'new_demand',
      metadata: {
        priority_score: priorityScore,
        match_reason: dealer.match_reason,
        customer_location: record.city,
        budget_max: record.budget_max,
        urgency: record.urgency || 'warm',
      },
    }));

    if (notifications.length > 0) {
      await supabase.from('demand_gap_notifications').insert(notifications);
      console.log('Created notifications for dealers');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        priority_score: priorityScore,
        dealers_notified: matchedDealers.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-dealers-demand-gap:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculatePriorityScore(record: DemandGapRecord): number {
  let score = 50; // Base score

  // Urgency factor
  if (record.urgency === 'hot') score += 30;
  else if (record.urgency === 'warm') score += 15;

  // Budget factor (high-value leads)
  if (record.budget_max) {
    if (record.budget_max > 1000000) score += 25;
    else if (record.budget_max > 500000) score += 15;
    else if (record.budget_max > 300000) score += 10;
  }

  // User profile factor
  if (record.user_id) score += 10;

  // Specificity factor
  const specificityScore = getSpecificityScore(record);
  score += specificityScore;

  return Math.min(100, Math.max(0, score));
}

function getSpecificityScore(record: DemandGapRecord): number {
  let score = 0;

  if (record.must_haves) {
    if (record.must_haves.body_types?.length) score += 5;
    if (record.must_haves.fuel_types?.length) score += 5;
    if (record.must_haves.transmissions?.length) score += 3;
  }

  if (record.brand_preference?.length) score += 8;
  if (record.model_preference?.length) score += 10;
  if (record.note && record.note.length > 20) score += 10;

  return score;
}

async function findMatchingDealers(supabase: any, record: DemandGapRecord) {
  // Get all active dealers
  const { data: dealers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      dealer_profiles (
        dealership_name,
        city_id,
        cities (name)
      )
    `)
    .in('id', 
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'dealer')
    );

  if (error || !dealers) {
    console.error('Error fetching dealers:', error);
    return [];
  }

  // Filter and score dealers based on match criteria
  const scoredDealers = dealers
    .filter((dealer: any) => dealer.dealer_profiles)
    .map((dealer: any) => {
      let matchScore = 0;
      let matchReason = [];

      // Location match (highest priority)
      if (dealer.dealer_profiles.cities?.name === record.city) {
        matchScore += 50;
        matchReason.push('Same city');
      }

      // All dealers get notified, but prioritized by match score
      matchScore += 10; // Base notification score

      return {
        id: dealer.id,
        dealership_name: dealer.dealer_profiles.dealership_name,
        match_score: matchScore,
        match_reason: matchReason.join(', ') || 'General opportunity',
      };
    })
    .filter((dealer: any) => dealer.match_score > 0)
    .sort((a: any, b: any) => b.match_score - a.match_score);

  return scoredDealers;
}
