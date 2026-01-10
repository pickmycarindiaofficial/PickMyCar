-- Demand Gaps System Migration

-- 1. Enable RLS on tables (CRITICAL - Must enable before policies work!)
ALTER TABLE unmet_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_gap_notifications ENABLE ROW LEVEL SECURITY;

-- 1.5. Add foreign key constraint for PostgREST joins (CRITICAL for data display!)
-- First, clean any orphaned records if they exist
UPDATE unmet_expectations
SET user_id = NULL
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM profiles);

-- Add foreign key constraint
ALTER TABLE unmet_expectations
ADD CONSTRAINT IF NOT EXISTS fk_unmet_expectations_user_id
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_unmet_expectations_user_id 
ON unmet_expectations(user_id) WHERE user_id IS NOT NULL;

-- 2. Extend unmet_expectations table
ALTER TABLE unmet_expectations
ADD COLUMN IF NOT EXISTS budget_min numeric,
ADD COLUMN IF NOT EXISTS dealer_views jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dealer_responses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS matched_listing_id uuid REFERENCES car_listings(id),
ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'exit_modal',
ADD COLUMN IF NOT EXISTS brand_preference text[],
ADD COLUMN IF NOT EXISTS model_preference text[],
ADD COLUMN IF NOT EXISTS year_min integer,
ADD COLUMN IF NOT EXISTS year_max integer,
ADD COLUMN IF NOT EXISTS kms_max integer,
ADD COLUMN IF NOT EXISTS preferred_colors text[],
ADD COLUMN IF NOT EXISTS dealer_assigned_to uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS first_viewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_viewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS converted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS conversion_value numeric,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS tags text[];

-- 3. Create demand_gap_notifications table
CREATE TABLE IF NOT EXISTS demand_gap_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_gap_id uuid REFERENCES unmet_expectations(id) ON DELETE CASCADE,
  dealer_id uuid REFERENCES profiles(id),
  notification_type text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_demand_notifications_dealer ON demand_gap_notifications(dealer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_demand_notifications_created ON demand_gap_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_gap_priority ON unmet_expectations(priority_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_gap_status ON unmet_expectations(status, priority_score DESC);

-- 4. RLS Policies for unmet_expectations
DROP POLICY IF EXISTS "Anyone can create demand gaps" ON unmet_expectations;
CREATE POLICY "Anyone can create demand gaps"
ON unmet_expectations FOR INSERT
WITH CHECK (true);
DROP POLICY IF EXISTS "Dealers view open demand gaps" ON unmet_expectations;
CREATE POLICY "Dealers view open demand gaps"
ON unmet_expectations FOR SELECT
TO authenticated
USING (
  status IN ('open', 'in_progress') AND
  has_role(auth.uid(), 'dealer'::app_role)
);

DROP POLICY IF EXISTS "PowerDesk view all demand gaps" ON unmet_expectations;
CREATE POLICY "PowerDesk view all demand gaps"
ON unmet_expectations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

DROP POLICY IF EXISTS "Dealers update responses" ON unmet_expectations;
CREATE POLICY "Dealers update responses"
ON unmet_expectations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'dealer'::app_role))
WITH CHECK (has_role(auth.uid(), 'dealer'::app_role));

DROP POLICY IF EXISTS "PowerDesk update all demand gaps" ON unmet_expectations;
CREATE POLICY "PowerDesk update all demand gaps"
ON unmet_expectations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role))
WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

-- 5. RLS Policies for demand_gap_notifications
DROP POLICY IF EXISTS "Dealers view own notifications" ON demand_gap_notifications;
CREATE POLICY "Dealers view own notifications"
ON demand_gap_notifications FOR SELECT
TO authenticated
USING (dealer_id = auth.uid());

DROP POLICY IF EXISTS "Dealers update own notifications" ON demand_gap_notifications;
CREATE POLICY "Dealers update own notifications"
ON demand_gap_notifications FOR UPDATE
TO authenticated
USING (dealer_id = auth.uid())
WITH CHECK (dealer_id = auth.uid());

DROP POLICY IF EXISTS "PowerDesk view all notifications" ON demand_gap_notifications;
CREATE POLICY "PowerDesk view all notifications"
ON demand_gap_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

DROP POLICY IF EXISTS "System insert notifications" ON demand_gap_notifications;
CREATE POLICY "System insert notifications"
ON demand_gap_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Function to add dealer response
CREATE OR REPLACE FUNCTION add_dealer_response(
  p_demand_gap_id uuid,
  p_response jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE unmet_expectations
  SET 
    dealer_responses = dealer_responses || jsonb_build_array(p_response),
    response_count = response_count + 1,
    status = CASE 
      WHEN status = 'open' THEN 'in_progress'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_demand_gap_id;
END;
$$;

-- 7. Function to track dealer view
CREATE OR REPLACE FUNCTION track_dealer_view(
  p_demand_gap_id uuid,
  p_dealer_id uuid,
  p_dealer_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE unmet_expectations
  SET 
    dealer_views = dealer_views || jsonb_build_array(
      jsonb_build_object(
        'dealer_id', p_dealer_id,
        'dealer_name', p_dealer_name,
        'viewed_at', now()
      )
    ),
    view_count = view_count + 1,
    first_viewed_at = COALESCE(first_viewed_at, now()),
    last_viewed_at = now()
  WHERE id = p_demand_gap_id
  AND NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(dealer_views) AS view
    WHERE view->>'dealer_id' = p_dealer_id::text
  );
END;
$$;

-- 8. Function to get unread demand gap notifications count
CREATE OR REPLACE FUNCTION get_unread_demand_gap_count(p_dealer_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM demand_gap_notifications
    WHERE dealer_id = p_dealer_id
    AND is_read = false
  );
END;
$$;
