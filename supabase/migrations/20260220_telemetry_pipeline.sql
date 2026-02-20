-- 20260220_telemetry_pipeline.sql
-- Enables live tracking of User Behavior and Market Intelligence signals

-- 1. Create the user_events table for market intelligence parsing (searches, views, filters)
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event TEXT NOT NULL,
    car_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Allow completely anonymous traffic to dump events into the table (Essential for tracking external traffic)
CREATE POLICY "Enable insert for all users (including anon) on user_events" 
    ON public.user_events FOR INSERT WITH CHECK (true);

-- Allow authenticated dealers/powerdesk to view events
CREATE POLICY "Enable select for authenticated users on user_events" 
    ON public.user_events FOR SELECT USING (auth.role() = 'authenticated');


-- 2. Create the conversion_funnel table for tracking explicit intent boundaries (leads, test drives)
CREATE TABLE IF NOT EXISTS public.conversion_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    car_listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    dealer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stage TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.conversion_funnel ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and logged in users to push funnel phases
CREATE POLICY "Enable insert for all users (including anon) on conversion_funnel" 
    ON public.conversion_funnel FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view the funnel
CREATE POLICY "Enable select for authenticated users on conversion_funnel" 
    ON public.conversion_funnel FOR SELECT USING (auth.role() = 'authenticated');


-- 3. Create the increment_intent_score RPC exactly as expected by the frontend hook
-- (Even if the retail_users intent_score column isn't actively implemented, this RPC must exist so the React Query mutation does not throw a hard error).
CREATE OR REPLACE FUNCTION increment_intent_score(p_user_id UUID, p_event TEXT)
RETURNS void AS $$
BEGIN
    -- Reserved for dynamically incrementing user intent profiles based on scoring heuristics
    -- Currently a stub to fulfill the `useEventTracking.ts` dependencies and avoid POST 404s.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
