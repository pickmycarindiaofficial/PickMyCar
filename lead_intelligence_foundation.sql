-- ===================================================================
-- PHASE 1: LEAD INTELLIGENCE DATABASE FOUNDATION
-- Creates 5 core tables for AI-powered lead management system
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tfmaotjdfpqtnsghdwnl/sql/new
-- ===================================================================

-- ===================================================================
-- TABLE 1: dealer_behavior_metrics
-- Tracks dealer performance and response patterns
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.dealer_behavior_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Response metrics
  avg_response_time_minutes NUMERIC DEFAULT 0,
  fastest_response_minutes NUMERIC,
  slowest_response_minutes NUMERIC,
  
  -- Volume metrics
  total_leads_received INTEGER DEFAULT 0,
  leads_responded INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  leads_ignored INTEGER DEFAULT 0,
  
  -- Performance rates
  response_rate NUMERIC DEFAULT 0, -- percentage
  conversion_rate NUMERIC DEFAULT 0, -- percentage
  
  -- Behavior patterns
  last_response_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0, -- consecutive days with responses
  best_response_day TEXT, -- Monday, Tuesday, etc.
  best_response_hour INTEGER, -- 0-23
  
  -- Quality scoring
  quality_score NUMERIC DEFAULT 50, -- 0-100
  reliability_score NUMERIC DEFAULT 50, -- 0-100
  customer_satisfaction_score NUMERIC DEFAULT 0,
  
  -- Period tracking
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(dealer_id, period_start)
);

CREATE INDEX idx_dealer_behavior_dealer ON dealer_behavior_metrics(dealer_id);
CREATE INDEX idx_dealer_behavior_quality ON dealer_behavior_metrics(quality_score DESC);
CREATE INDEX idx_dealer_behavior_conversion ON dealer_behavior_metrics(conversion_rate DESC);

-- ===================================================================
-- TABLE 2: market_signals
-- Auto-detected market trends and patterns
-- ===================================================================
DO $$ BEGIN
  CREATE TYPE signal_type AS ENUM (
    'trending_brand',
    'trending_model',
    'hot_location',
    'demand_spike',
    'price_opportunity',
    'inventory_gap',
    'seasonal_trend',
    'competitor_activity',
    'user_behavior_shift'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable', 'volatile');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Signal classification
  signal_type signal_type NOT NULL,
  entity_type TEXT NOT NULL, -- brand, model, city, category, fuel_type
  entity_id UUID,
  entity_name TEXT NOT NULL,
  
  -- Metrics
  metric_value NUMERIC NOT NULL,
  previous_value NUMERIC,
  trend_direction trend_direction DEFAULT 'stable',
  change_percentage NUMERIC,
  
  -- Confidence and priority
  confidence_score NUMERIC DEFAULT 0, -- 0-100
  priority INTEGER DEFAULT 50, -- 0-100
  
  -- Time context
  time_period TEXT DEFAULT 'last_7_days',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  affected_dealers UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_signals_type ON market_signals(signal_type);
CREATE INDEX idx_market_signals_entity ON market_signals(entity_type, entity_id);
CREATE INDEX idx_market_signals_confidence ON market_signals(confidence_score DESC);
CREATE INDEX idx_market_signals_active ON market_signals(expires_at) WHERE expires_at > NOW();
CREATE INDEX idx_market_signals_dealer ON market_signals USING GIN(affected_dealers);

-- ===================================================================
-- TABLE 3: ai_suggestions
-- AI-generated actionable recommendations
-- ===================================================================
DO $$ BEGIN
  CREATE TYPE suggestion_type AS ENUM (
    'follow_up_lead',
    'price_adjustment',
    'inventory_opportunity',
    'competitor_alert',
    'engagement_strategy',
    'timing_optimization',
    'cross_sell',
    'retention_risk',
    'quick_win'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE suggestion_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('pending', 'acted', 'dismissed', 'expired', 'auto_resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target
  target_type TEXT NOT NULL,
  target_id UUID,
  
  -- Suggestion details
  suggestion_type suggestion_type NOT NULL,
  priority suggestion_priority DEFAULT 'medium',
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT,
  
  -- Action
  action_url TEXT,
  action_label TEXT DEFAULT 'Take Action',
  expected_impact TEXT,
  
  -- Context
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Lifecycle
  status suggestion_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  
  -- Effectiveness tracking
  outcome_recorded BOOLEAN DEFAULT FALSE,
  outcome_success BOOLEAN,
  outcome_notes TEXT
);

CREATE INDEX idx_ai_suggestions_target ON ai_suggestions(target_type, target_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status) WHERE status = 'pending';
CREATE INDEX idx_ai_suggestions_priority ON ai_suggestions(priority, created_at DESC);
CREATE INDEX idx_ai_suggestions_active ON ai_suggestions(expires_at) WHERE expires_at > NOW();

-- ===================================================================
-- TABLE 4: lead_enrichment
-- Enhanced lead intelligence with AI insights
-- ===================================================================
DO $$ BEGIN
  CREATE TYPE intent_level AS ENUM ('hot', 'warm', 'cold', 'frozen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE buying_timeline AS ENUM ('immediate', '1-2_weeks', '1_month', '3_months', 'exploring');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.lead_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead reference
  lead_id UUID NOT NULL REFERENCES car_enquiries(id) ON DELETE CASCADE,
  user_id UUID,
  car_listing_id UUID,
  dealer_id UUID,
  
  -- AI Scoring
  ai_score NUMERIC DEFAULT 50,
  intent_level intent_level DEFAULT 'warm',
  buying_timeline buying_timeline DEFAULT 'exploring',
  budget_confidence confidence_level DEFAULT 'medium',
  
  -- Engagement metrics
  engagement_score NUMERIC DEFAULT 0,
  previous_interactions_count INTEGER DEFAULT 0,
  similar_searches_count INTEGER DEFAULT 0,
  time_on_listing_seconds INTEGER DEFAULT 0,
  
  -- Intelligence
  competitor_activity JSONB DEFAULT '[]'::jsonb,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  behavioral_signals JSONB DEFAULT '{}'::jsonb,
  
  -- Recommendations
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  optimal_contact_time TEXT,
  suggested_messaging TEXT,
  
  -- Prediction
  conversion_probability NUMERIC DEFAULT 0,
  predicted_close_date DATE,
  predicted_deal_value NUMERIC,
  
  -- Lifecycle
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_id)
);

CREATE INDEX idx_lead_enrichment_score ON lead_enrichment(ai_score DESC);
CREATE INDEX idx_lead_enrichment_intent ON lead_enrichment(intent_level);
CREATE INDEX idx_lead_enrichment_dealer ON lead_enrichment(dealer_id);
CREATE INDEX idx_lead_enrichment_user ON lead_enrichment(user_id);
CREATE INDEX idx_lead_enrichment_probability ON lead_enrichment(conversion_probability DESC);

-- ===================================================================
-- TABLE 5: conversion_funnel
-- Tracks user journey through conversion stages
-- ===================================================================
DO $$ BEGIN
  CREATE TYPE funnel_stage AS ENUM (
    'view',
    'engage',
    'favorite',
    'emi_calculation',
    'share',
    'contact_reveal',
    'call_click',
    'whatsapp_click',
    'test_drive_request',
    'negotiation',
    'documentation',
    'closed_won',
    'closed_lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.conversion_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Journey identifiers
  user_id UUID,
  session_id TEXT NOT NULL,
  car_listing_id UUID REFERENCES car_listings(id) ON DELETE CASCADE,
  dealer_id UUID,
  
  -- Stage tracking
  stage funnel_stage NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Context
  previous_stage funnel_stage,
  next_stage funnel_stage,
  
  -- Drop-off analysis
  dropped_off BOOLEAN DEFAULT FALSE,
  drop_off_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Predictions
  conversion_probability NUMERIC DEFAULT 0,
  next_best_action TEXT,
  estimated_time_to_convert INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversion_funnel_user ON conversion_funnel(user_id);
CREATE INDEX idx_conversion_funnel_session ON conversion_funnel(session_id);
CREATE INDEX idx_conversion_funnel_car ON conversion_funnel(car_listing_id);
CREATE INDEX idx_conversion_funnel_dealer ON conversion_funnel(dealer_id);
CREATE INDEX idx_conversion_funnel_stage ON conversion_funnel(stage, entered_at DESC);
CREATE INDEX idx_conversion_funnel_dropoff ON conversion_funnel(dropped_off) WHERE dropped_off = TRUE;

-- ===================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================================

ALTER TABLE dealer_behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;

-- dealer_behavior_metrics policies
CREATE POLICY "PowerDesk can view all dealer metrics"
ON dealer_behavior_metrics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Dealers can view own metrics"
ON dealer_behavior_metrics FOR SELECT
TO authenticated
USING (dealer_id = auth.uid());

CREATE POLICY "System can manage dealer metrics"
ON dealer_behavior_metrics FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'))
WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- market_signals policies
CREATE POLICY "PowerDesk can view all market signals"
ON market_signals FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Dealers can view relevant market signals"
ON market_signals FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'dealer') 
  AND (
    affected_dealers IS NULL 
    OR auth.uid() = ANY(affected_dealers)
  )
);

CREATE POLICY "PowerDesk can manage market signals"
ON market_signals FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'))
WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- ai_suggestions policies
CREATE POLICY "PowerDesk can view all suggestions"
ON ai_suggestions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Users can view own suggestions"
ON ai_suggestions FOR SELECT
TO authenticated
USING (target_id = auth.uid());

CREATE POLICY "Users can update own suggestions"
ON ai_suggestions FOR UPDATE
TO authenticated
USING (target_id = auth.uid())
WITH CHECK (target_id = auth.uid());

CREATE POLICY "System can create suggestions"
ON ai_suggestions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- lead_enrichment policies
CREATE POLICY "PowerDesk can view all lead enrichment"
ON lead_enrichment FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Dealers can view own lead enrichment"
ON lead_enrichment FOR SELECT
TO authenticated
USING (dealer_id = auth.uid());

CREATE POLICY "System can manage lead enrichment"
ON lead_enrichment FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'))
WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- conversion_funnel policies
CREATE POLICY "PowerDesk can view all funnel data"
ON conversion_funnel FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Dealers can view own funnel data"
ON conversion_funnel FOR SELECT
TO authenticated
USING (dealer_id = auth.uid());

CREATE POLICY "System can insert funnel events"
ON conversion_funnel FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "PowerDesk can update funnel data"
ON conversion_funnel FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'))
WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- ===================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ===================================================================

CREATE OR REPLACE FUNCTION update_dealer_behavior_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dealer_behavior_timestamp
BEFORE UPDATE ON dealer_behavior_metrics
FOR EACH ROW
EXECUTE FUNCTION update_dealer_behavior_timestamp();

CREATE OR REPLACE FUNCTION update_lead_enrichment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_enrichment_timestamp
BEFORE UPDATE ON lead_enrichment
FOR EACH ROW
EXECUTE FUNCTION update_lead_enrichment_timestamp();

-- ===================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ===================================================================
COMMENT ON TABLE dealer_behavior_metrics IS 'Tracks dealer performance, response times, and behavior patterns for analytics';
COMMENT ON TABLE market_signals IS 'Auto-detected market trends, hot cars, demand spikes, and competitive intelligence';
COMMENT ON TABLE ai_suggestions IS 'AI-generated actionable recommendations for dealers and admins';
COMMENT ON TABLE lead_enrichment IS 'Enhanced lead intelligence with AI scoring, intent analysis, and conversion predictions';
COMMENT ON TABLE conversion_funnel IS 'Tracks user journey through conversion stages from view to closed deal';
