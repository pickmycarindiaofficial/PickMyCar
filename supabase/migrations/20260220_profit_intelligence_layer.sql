-- Phase 1: Profit Intelligence Layer - Economic Backbone
-- Executing production-grade schema for capital optimization

-- 1. car_economic_profile: Tracks the granular unit economics of every vehicle
CREATE TABLE IF NOT EXISTS public.car_economic_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
    dealer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    acquisition_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reconditioning_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    daily_holding_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expected_margin NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(car_id) -- A car can only have one economic profile at a time
);

-- RLS: Dealers can only see and manage their own economic data
ALTER TABLE public.car_economic_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view their own car economic profiles" 
    ON public.car_economic_profile FOR SELECT 
    USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can insert their own car economic profiles" 
    ON public.car_economic_profile FOR INSERT 
    WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Dealers can update their own car economic profiles" 
    ON public.car_economic_profile FOR UPDATE 
    USING (auth.uid() = dealer_id);

CREATE POLICY "PowerDesk can view all car economic profiles" 
    ON public.car_economic_profile FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'powerdesk'));


-- 2. dealer_cost_profile: Baselines the dealer's monthly operational burn
CREATE TABLE IF NOT EXISTS public.dealer_cost_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    average_marketing_cost_per_car NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cost_of_capital_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00, -- e.g., 12.00% APR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(dealer_id) -- One cost profile per dealer
);

-- RLS: Dealers can only manage their own cost formulas
ALTER TABLE public.dealer_cost_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view their own cost profiles" 
    ON public.dealer_cost_profile FOR SELECT 
    USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can insert their own cost profiles" 
    ON public.dealer_cost_profile FOR INSERT 
    WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Dealers can update their own cost profiles" 
    ON public.dealer_cost_profile FOR UPDATE 
    USING (auth.uid() = dealer_id);

CREATE POLICY "PowerDesk can view all cost profiles" 
    ON public.dealer_cost_profile FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'powerdesk'));


-- 3. dealer_profit_timeseries: Rolling daily snapshots of inventory ROI and capital lock
CREATE TABLE IF NOT EXISTS public.dealer_profit_timeseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    projected_monthly_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    capital_locked NUMERIC(12, 2) NOT NULL DEFAULT 0,
    avg_turnover_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(dealer_id, snapshot_date) -- One snapshot per dealer per day
);

-- RLS: Dealers can only view their own rolling timeseries metrics
ALTER TABLE public.dealer_profit_timeseries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view their own profit timeseries" 
    ON public.dealer_profit_timeseries FOR SELECT 
    USING (auth.uid() = dealer_id);

CREATE POLICY "PowerDesk can view all profit timeseries" 
    ON public.dealer_profit_timeseries FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'powerdesk'));

-- Functions to automatically set updated_at
CREATE OR REPLACE FUNCTION update_economic_profile_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_car_economic_profile_modtime
    BEFORE UPDATE ON public.car_economic_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_economic_profile_modtime();

CREATE TRIGGER update_dealer_cost_profile_modtime
    BEFORE UPDATE ON public.dealer_cost_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_economic_profile_modtime();
