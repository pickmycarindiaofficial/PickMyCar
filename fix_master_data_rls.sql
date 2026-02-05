-- =================================================================
-- FIX: All Master Data RLS Policies (Professional Grade)
-- Description: Applies RLS policies to ALL master data tables to allow
--              staff access via "x-staff-token" header validation.
--              Tables: brands, models, cities, car_categories, features,
--              banners, fuel_types, body_types, transmissions, seat_options, years.
-- =================================================================

-- 1. Helper Function (Ensures it exists)
CREATE OR REPLACE FUNCTION public.check_staff_header()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_valid_staff_session(
    current_setting('request.headers', true)::json->>'x-staff-token'
  );
$$;

-- 2. Define list of tables to secure
-- (We'll do this block by block for standard SQL compatibility)

-- =================================================================
-- MACRO: Apply Policy to Table
-- Note: Replaced with repetitive blocks for safety and clarity
-- =================================================================

--------------------------------------------------------------------
-- TABLE: brands
--------------------------------------------------------------------
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.brands;
DROP POLICY IF EXISTS "Staff can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Staff can update brands" ON public.brands;
DROP POLICY IF EXISTS "Staff can delete brands" ON public.brands;

CREATE POLICY "Public read access" ON public.brands FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert brands" ON public.brands FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update brands" ON public.brands FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete brands" ON public.brands FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: models (Re-applying to be safe)
--------------------------------------------------------------------
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view models" ON public.models;
DROP POLICY IF EXISTS "Staff can insert models" ON public.models;
DROP POLICY IF EXISTS "Staff can update models" ON public.models;
DROP POLICY IF EXISTS "Staff can delete models" ON public.models;
-- Drop old ones just in case
DROP POLICY IF EXISTS "Admins and Powerdesk can insert models" ON public.models;

CREATE POLICY "Public can view models" ON public.models FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert models" ON public.models FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update models" ON public.models FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete models" ON public.models FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: cities
--------------------------------------------------------------------
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.cities;
DROP POLICY IF EXISTS "Staff can insert cities" ON public.cities;
DROP POLICY IF EXISTS "Staff can update cities" ON public.cities;
DROP POLICY IF EXISTS "Staff can delete cities" ON public.cities;

CREATE POLICY "Public read access" ON public.cities FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert cities" ON public.cities FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update cities" ON public.cities FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete cities" ON public.cities FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: car_categories
--------------------------------------------------------------------
ALTER TABLE public.car_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.car_categories;
DROP POLICY IF EXISTS "Staff can insert car_categories" ON public.car_categories;
DROP POLICY IF EXISTS "Staff can update car_categories" ON public.car_categories;
DROP POLICY IF EXISTS "Staff can delete car_categories" ON public.car_categories;

CREATE POLICY "Public read access" ON public.car_categories FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert car_categories" ON public.car_categories FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update car_categories" ON public.car_categories FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete car_categories" ON public.car_categories FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: features
--------------------------------------------------------------------
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.features;
DROP POLICY IF EXISTS "Staff can insert features" ON public.features;
DROP POLICY IF EXISTS "Staff can update features" ON public.features;
DROP POLICY IF EXISTS "Staff can delete features" ON public.features;

CREATE POLICY "Public read access" ON public.features FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert features" ON public.features FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update features" ON public.features FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete features" ON public.features FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: banners
--------------------------------------------------------------------
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.banners;
DROP POLICY IF EXISTS "Staff can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Staff can update banners" ON public.banners;
DROP POLICY IF EXISTS "Staff can delete banners" ON public.banners;

CREATE POLICY "Public read access" ON public.banners FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert banners" ON public.banners FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update banners" ON public.banners FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete banners" ON public.banners FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: fuel_types
--------------------------------------------------------------------
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.fuel_types;
DROP POLICY IF EXISTS "Staff can insert fuel_types" ON public.fuel_types;
DROP POLICY IF EXISTS "Staff can update fuel_types" ON public.fuel_types;
DROP POLICY IF EXISTS "Staff can delete fuel_types" ON public.fuel_types;

CREATE POLICY "Public read access" ON public.fuel_types FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert fuel_types" ON public.fuel_types FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update fuel_types" ON public.fuel_types FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete fuel_types" ON public.fuel_types FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: body_types
--------------------------------------------------------------------
ALTER TABLE public.body_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.body_types;
DROP POLICY IF EXISTS "Staff can insert body_types" ON public.body_types;
DROP POLICY IF EXISTS "Staff can update body_types" ON public.body_types;
DROP POLICY IF EXISTS "Staff can delete body_types" ON public.body_types;

CREATE POLICY "Public read access" ON public.body_types FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert body_types" ON public.body_types FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update body_types" ON public.body_types FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete body_types" ON public.body_types FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: transmissions
--------------------------------------------------------------------
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.transmissions;
DROP POLICY IF EXISTS "Staff can insert transmissions" ON public.transmissions;
DROP POLICY IF EXISTS "Staff can update transmissions" ON public.transmissions;
DROP POLICY IF EXISTS "Staff can delete transmissions" ON public.transmissions;

CREATE POLICY "Public read access" ON public.transmissions FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert transmissions" ON public.transmissions FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update transmissions" ON public.transmissions FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete transmissions" ON public.transmissions FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: seat_options
--------------------------------------------------------------------
ALTER TABLE public.seat_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.seat_options;
DROP POLICY IF EXISTS "Staff can insert seat_options" ON public.seat_options;
DROP POLICY IF EXISTS "Staff can update seat_options" ON public.seat_options;
DROP POLICY IF EXISTS "Staff can delete seat_options" ON public.seat_options;

CREATE POLICY "Public read access" ON public.seat_options FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert seat_options" ON public.seat_options FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update seat_options" ON public.seat_options FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete seat_options" ON public.seat_options FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

--------------------------------------------------------------------
-- TABLE: years
--------------------------------------------------------------------
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.years;
DROP POLICY IF EXISTS "Staff can insert years" ON public.years;
DROP POLICY IF EXISTS "Staff can update years" ON public.years;
DROP POLICY IF EXISTS "Staff can delete years" ON public.years;

CREATE POLICY "Public read access" ON public.years FOR SELECT TO public USING (true);

CREATE POLICY "Staff can insert years" ON public.years FOR INSERT TO anon, authenticated
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can update years" ON public.years FOR UPDATE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'))
WITH CHECK (public.check_staff_header() OR (auth.role() = 'authenticated'));

CREATE POLICY "Staff can delete years" ON public.years FOR DELETE TO anon, authenticated
USING (public.check_staff_header() OR (auth.role() = 'authenticated'));

-- =================================================================
-- Verification
-- =================================================================
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN (
  'brands', 'models', 'cities', 'car_categories', 'features', 
  'banners', 'fuel_types', 'body_types', 'transmissions', 
  'seat_options', 'years'
)
ORDER BY tablename;
