import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enquiry_id } = await req.json();

    if (!enquiry_id) {
      return new Response(
        JSON.stringify({ error: 'enquiry_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🤖 Enriching lead: ${enquiry_id}`);

    // Fetch enquiry details
    const { data: enquiry, error: enquiryError } = await supabase
      .from('car_enquiries')
      .select('*')
      .eq('id', enquiry_id)
      .single();

    if (enquiryError || !enquiry) {
      throw new Error('Enquiry not found');
    }

    // Get user interaction history
    const { data: userEvents } = await supabase
      .from('user_events')
      .select('event, created_at')
      .eq('user_id', enquiry.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: funnelHistory } = await supabase
      .from('conversion_funnel')
      .select('stage, entered_at, duration_seconds')
      .eq('user_id', enquiry.user_id)
      .order('entered_at', { ascending: false })
      .limit(20);

    // CALCULATE AI SCORE (0-100)
    let aiScore = 50; // baseline

    // Boost for enquiry type
    const enquiryTypeScores: Record<string, number> = {
      'test_drive': 25,
      'loan': 20,
      'call': 15,
      'whatsapp': 10,
      'chat': 8,
    };
    aiScore += enquiryTypeScores[enquiry.enquiry_type] || 5;

    // Boost for multiple interactions
    const interactionCount = userEvents?.length || 0;
    aiScore += Math.min(20, interactionCount * 2);

    // Boost for high-intent events
    const highIntentEvents = userEvents?.filter(e => 
      ['contact_click', 'test_drive_request', 'loan_attempt'].includes(e.event)
    ).length || 0;
    aiScore += highIntentEvents * 5;

    // Boost for funnel progression
    const reachedIntentStage = funnelHistory?.some(f => 
      ['intent', 'convert'].includes(f.stage)
    );
    if (reachedIntentStage) aiScore += 15;

    // Cap at 100
    aiScore = Math.min(100, aiScore);

    // DETERMINE INTENT LEVEL
    let intentLevel: 'cold' | 'warm' | 'hot' = 'cold';
    if (aiScore >= 75) intentLevel = 'hot';
    else if (aiScore >= 50) intentLevel = 'warm';

    // PREDICT BUYING TIMELINE
    let buyingTimeline: 'immediate' | 'days' | 'weeks' | 'months' | 'exploring' = 'exploring';
    if (enquiry.enquiry_type === 'test_drive') buyingTimeline = 'immediate';
    else if (enquiry.enquiry_type === 'loan') buyingTimeline = 'weeks';
    else if (highIntentEvents > 2) buyingTimeline = 'days';
    else if (interactionCount > 5) buyingTimeline = 'weeks';
    else buyingTimeline = 'months';

    // CALCULATE ENGAGEMENT SCORE
    const engagementScore = Math.min(100, 
      (interactionCount * 5) + 
      (highIntentEvents * 10) + 
      (funnelHistory?.length || 0) * 3
    );

    // TIME ON LISTING
    const viewEvents = funnelHistory?.filter(f => f.stage === 'view') || [];
    const avgDuration = viewEvents.reduce((sum, f) => 
      sum + (f.duration_seconds || 0), 0
    ) / (viewEvents.length || 1);

    // OPTIMAL CONTACT TIME
    const createdHour = new Date(enquiry.created_at).getHours();
    let optimalContactTime = 'afternoon';
    if (createdHour >= 9 && createdHour < 12) optimalContactTime = 'morning';
    else if (createdHour >= 12 && createdHour < 17) optimalContactTime = 'afternoon';
    else if (createdHour >= 17 && createdHour < 21) optimalContactTime = 'evening';
    else optimalContactTime = 'night';

    // RISK FACTORS
    const riskFactors = [];
    if (interactionCount < 2) {
      riskFactors.push({ 
        type: 'low_engagement', 
        severity: 'medium',
        description: 'Limited interaction history' 
      });
    }
    if (enquiry.enquiry_source === 'exit_intent') {
      riskFactors.push({ 
        type: 'exit_intent', 
        severity: 'high',
        description: 'User was about to leave' 
      });
    }

    // RECOMMENDED ACTIONS
    const recommendedActions = [];
    if (intentLevel === 'hot') {
      recommendedActions.push({
        action: 'immediate_followup',
        priority: 'high',
        message: 'Contact within 30 minutes for best conversion'
      });
    }
    if (enquiry.enquiry_type === 'loan') {
      recommendedActions.push({
        action: 'send_loan_options',
        priority: 'medium',
        message: 'Share pre-approved loan offers'
      });
    }
    if (interactionCount > 5) {
      recommendedActions.push({
        action: 'schedule_test_drive',
        priority: 'high',
        message: 'User is highly engaged, offer test drive'
      });
    }

    // BEHAVIORAL SIGNALS
    const behavioralSignals = {
      return_visitor: interactionCount > 1,
      high_intent: highIntentEvents > 0,
      price_conscious: userEvents?.some(e => e.event === 'loan_attempt') || false,
      comparison_shopping: userEvents?.some(e => e.event === 'compare') || false,
      mobile_user: /mobile/i.test(enquiry.user_agent || ''),
    };

    // CONVERSION PROBABILITY (0-100)
    const conversionProbability = Math.min(100,
      (aiScore * 0.5) + 
      (engagementScore * 0.3) + 
      (highIntentEvents * 5)
    );

    // Insert or update lead enrichment
    const enrichmentData = {
      lead_id: enquiry_id,
      user_id: enquiry.user_id,
      dealer_id: enquiry.dealer_id,
      car_listing_id: enquiry.car_listing_id,
      intent_level: intentLevel,
      buying_timeline: buyingTimeline,
      ai_score: aiScore,
      engagement_score: engagementScore,
      previous_interactions_count: interactionCount,
      time_on_listing_seconds: Math.round(avgDuration),
      similar_searches_count: userEvents?.filter(e => e.event === 'search').length || 0,
      optimal_contact_time: optimalContactTime,
      conversion_probability: conversionProbability,
      behavioral_signals: behavioralSignals,
      risk_factors: riskFactors,
      recommended_actions: recommendedActions,
      suggested_messaging: intentLevel === 'hot' 
        ? 'Act fast! This buyer is ready to purchase.'
        : intentLevel === 'warm'
        ? 'Follow up with personalized options.'
        : 'Nurture with educational content.',
    };

    const { error: enrichError } = await supabase
      .from('lead_enrichment')
      .upsert(enrichmentData, { onConflict: 'lead_id' });

    if (enrichError) throw enrichError;

    console.log(`✅ Lead enriched successfully! AI Score: ${aiScore}, Intent: ${intentLevel}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrichment: enrichmentData,
        summary: {
          ai_score: aiScore,
          intent_level: intentLevel,
          buying_timeline: buyingTimeline,
          conversion_probability: conversionProbability,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Lead Enrichment Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
