-- ============================================================
-- Migration 003: Seed test company, office, and roles (Epic 1)
-- ============================================================
-- Creates one company, one office, and three roles (admin, closer,
-- office_manager) for local/testing. Run after 002 and kinos-migration-v1.
-- Test users (Auth + users table) are created via script or manual steps;
-- see docs/SEED-TEST-USERS.md.
-- ============================================================

-- Test company (KIN Home)
INSERT INTO companies (id, name, slug)
VALUES (
  'a0000001-0001-4000-8000-000000000001',
  'KIN Home Test',
  'kin-home-test'
)
ON CONFLICT (id) DO NOTHING;

-- Test office
INSERT INTO offices (id, company_id, name, office_type, is_active)
VALUES (
  'a0000002-0002-4000-8000-000000000002',
  'a0000001-0001-4000-8000-000000000001',
  'Test Office',
  'office',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Roles for test company (admin, closer, office_manager)
INSERT INTO roles (id, company_id, name, display_name, category, is_system_role)
VALUES
  ('a0000003-0003-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000001', 'admin', 'Administrator', 'admin', true),
  ('a0000004-0004-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000001', 'closer', 'Closer', 'closer', true),
  ('a0000005-0005-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000001', 'office_manager', 'Office Manager', 'office_manager', true)
ON CONFLICT (id) DO NOTHING;
