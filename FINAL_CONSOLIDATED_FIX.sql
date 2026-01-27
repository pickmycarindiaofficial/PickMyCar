-- ============================================================
-- CONSOLIDATED FIX: ALLOW OTP DEALERS TO CREATE LISTINGS
-- Includes: RLS Policies, seller_id FK, and activity_logs FK
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- 1. FIX RLS POLICIES FOR CAR_LISTINGS
-- ============================================================
DROP POLICY IF EXISTS "Users can create their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can create listings" ON car_listings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to insert listings" ON car_listings;
DROP POLICY IF EXISTS "Allow listing creation" ON car_listings;

CREATE POLICY "Allow listing creation" ON car_listings
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND seller_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
);

DROP POLICY IF EXISTS "Public can view live listings" ON car_listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can view their listings" ON car_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can update their listings" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to view listings" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to update listings" ON car_listings;
DROP POLICY IF EXISTS "View live listings" ON car_listings;
DROP POLICY IF EXISTS "Update own listings" ON car_listings;
DROP POLICY IF EXISTS "Delete own listings" ON car_listings;

CREATE POLICY "View live listings" ON car_listings FOR SELECT
USING (
  status = 'live' OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
);

CREATE POLICY "Update own listings" ON car_listings FOR UPDATE
USING (
  seller_id = auth.uid() OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
)
WITH CHECK (
  seller_id = auth.uid() OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
);

CREATE POLICY "Delete own listings" ON car_listings FOR DELETE
USING (
  seller_id = auth.uid() OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
);


-- 2. FIX FOREIGN KEY CONSTRAINT ON CAR_LISTINGS (seller_id)
-- ============================================================
ALTER TABLE car_listings DROP CONSTRAINT IF EXISTS car_listings_seller_id_fkey;

CREATE OR REPLACE FUNCTION validate_seller_id() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.seller_id) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM dealer_accounts WHERE id = NEW.seller_id AND is_active = true) THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Invalid seller_id: must exist in profiles or dealer_accounts';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_seller_id_trigger ON car_listings;
CREATE TRIGGER validate_seller_id_trigger BEFORE INSERT OR UPDATE ON car_listings
FOR EACH ROW EXECUTE FUNCTION validate_seller_id();


-- 3. FIX FOREIGN KEY CONSTRAINT ON ACTIVITY_LOGS (user_id)
-- ============================================================
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

CREATE OR REPLACE FUNCTION validate_activity_user_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM dealer_accounts WHERE id = NEW.user_id) THEN RETURN NEW; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_activity_user_id_trigger ON activity_logs;
CREATE TRIGGER validate_activity_user_id_trigger BEFORE INSERT OR UPDATE ON activity_logs
FOR EACH ROW EXECUTE FUNCTION validate_activity_user_id();

-- 4. FIX RLS POLICIES FOR CAR_LISTING_FEATURES
-- ============================================================
-- Ensure policy is dropped before recreation
DROP POLICY IF EXISTS "Users can manage features for their listings" ON car_listing_features;
DROP POLICY IF EXISTS "Allow OTP dealers to manage features" ON car_listing_features;
DROP POLICY IF EXISTS "Allow managing listing features" ON car_listing_features;

-- Helper function to check if a listing belongs to an OTP dealer or authenticated user
CREATE OR REPLACE FUNCTION is_listing_owner(check_listing_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM car_listings
    WHERE id = check_listing_id
    AND (
      seller_id = auth.uid()
      OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id)
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow managing listing features" ON car_listing_features
FOR ALL
USING (is_listing_owner(car_listing_id))
WITH CHECK (is_listing_owner(car_listing_id));


SELECT 'All OTP Dealer listing creation fixes (including features) applied successfully!' as status;
