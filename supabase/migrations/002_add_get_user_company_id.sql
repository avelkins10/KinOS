-- ============================================================
-- Migration 002: RLS helper get_user_company_id() (Epic 1, Task 6)
-- ============================================================
-- Returns the current user's company_id from public.users
-- using auth.uid(). Use in RLS policies as an alternative to
-- JWT app_metadata when table-based lookup is preferred.
--
-- Run in Supabase SQL Editor after kinos-migration-v1.sql.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
AS $$
  SELECT company_id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
