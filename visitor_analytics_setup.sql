-- =================================================================
-- VISITOR ANALYTICS SETUP
-- Adds page_views table + get_visitor_stats RPC for PowerDesk
-- Run this once in Supabase SQL Editor
-- =================================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. PAGE VIEWS TABLE
--    Lightweight. One row per page navigation. Anonymous-friendly.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id            BIGSERIAL PRIMARY KEY,
  session_id    TEXT        NOT NULL,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  path          TEXT        NOT NULL,
  referrer      TEXT,
  device_type   TEXT        CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  country       TEXT,
  city          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for date-range queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_pv_created_at  ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_session_id  ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_pv_user_id     ON public.page_views (user_id);
CREATE INDEX IF NOT EXISTS idx_pv_path        ON public.page_views (path);
-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_pv_created_session ON public.page_views (created_at DESC, session_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can INSERT page views
DROP POLICY IF EXISTS "anyone can insert page_views" ON public.page_views;
CREATE POLICY "anyone can insert page_views"
  ON public.page_views FOR INSERT WITH CHECK (true);

-- Only service_role can SELECT (analytics queries go through RPC)
DROP POLICY IF EXISTS "service role can read page_views" ON public.page_views;
CREATE POLICY "service role can read page_views"
  ON public.page_views FOR SELECT
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- 2. RPC: get_visitor_stats(from, to)
--    Returns aggregated stats as a single JSONB blob.
--    Uses SECURITY DEFINER so dashboard can bypass RLS safely.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_visitor_stats(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_page_views',
      (SELECT COUNT(*)::BIGINT FROM public.page_views
       WHERE created_at BETWEEN p_from AND p_to),

    'unique_visitors',
      (SELECT COUNT(DISTINCT session_id)::BIGINT FROM public.page_views
       WHERE created_at BETWEEN p_from AND p_to),

    'logged_in_visitors',
      (SELECT COUNT(DISTINCT user_id)::BIGINT FROM public.page_views
       WHERE created_at BETWEEN p_from AND p_to AND user_id IS NOT NULL),

    'mobile_pct',
      (SELECT COALESCE(ROUND(
        100.0 * SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(*), 0), 1), 0)
       FROM public.page_views
       WHERE created_at BETWEEN p_from AND p_to),

    'desktop_pct',
      (SELECT COALESCE(ROUND(
        100.0 * SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(*), 0), 1), 0)
       FROM public.page_views
       WHERE created_at BETWEEN p_from AND p_to),

    'top_pages',
      (SELECT COALESCE(jsonb_agg(r ORDER BY r.views DESC), '[]'::jsonb)
       FROM (
         SELECT path, COUNT(*) AS views
         FROM public.page_views
         WHERE created_at BETWEEN p_from AND p_to
         GROUP BY path
         ORDER BY views DESC
         LIMIT 10
       ) r),

    'daily_series',
      (SELECT COALESCE(jsonb_agg(d ORDER BY d.day), '[]'::jsonb)
       FROM (
         SELECT
           DATE(created_at AT TIME ZONE 'UTC')::TEXT AS day,
           COUNT(DISTINCT session_id)::BIGINT         AS visitors,
           COUNT(*)::BIGINT                           AS page_views
         FROM public.page_views
         WHERE created_at BETWEEN p_from AND p_to
         GROUP BY DATE(created_at AT TIME ZONE 'UTC')
         ORDER BY day
       ) d),

    'prev_unique_visitors',
      (SELECT COUNT(DISTINCT session_id)::BIGINT FROM public.page_views
       WHERE created_at BETWEEN
         (p_from - (p_to - p_from)) AND p_from),

    'prev_page_views',
      (SELECT COUNT(*)::BIGINT FROM public.page_views
       WHERE created_at BETWEEN
         (p_from - (p_to - p_from)) AND p_from)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execution to all roles (dashboard calls this)
GRANT EXECUTE ON FUNCTION public.get_visitor_stats(TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- 3. GRANT TABLE PERMISSIONS
-- ---------------------------------------------------------------
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO service_role;
-- Sequence for BIGSERIAL
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------
SELECT 'page_views table ready' AS status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'page_views';

SELECT 'get_visitor_stats RPC ready' AS status
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_visitor_stats';
