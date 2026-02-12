-- ============================================================
-- Migration 007: Appointments table and RepCard appointment support
-- ============================================================
-- Adds appointments table for appointment history tracking,
-- deal/contact alterations for active_appointment_id and repcard_status,
-- and auth_user_id() helper for RLS.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Helper: resolve current user's id from users table (for RLS)
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),

  repcard_appointment_id INTEGER UNIQUE,

  closer_id UUID REFERENCES users(id),
  setter_id UUID REFERENCES users(id),

  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  duration_minutes INTEGER DEFAULT 60,

  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
  )),
  outcome TEXT,
  outcome_id INTEGER,
  outcome_notes TEXT,

  notes TEXT,
  repcard_attachments JSONB DEFAULT '[]',

  appointment_type TEXT DEFAULT 'in_home' CHECK (appointment_type IN (
    'in_home', 'virtual', 'phone', 'follow_up'
  )),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_appointments_company ON appointments(company_id);
CREATE INDEX idx_appointments_contact ON appointments(contact_id);
CREATE INDEX idx_appointments_deal ON appointments(deal_id);
CREATE INDEX idx_appointments_repcard ON appointments(repcard_appointment_id);
CREATE INDEX idx_appointments_closer ON appointments(closer_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_start);
CREATE INDEX idx_appointments_active_scheduled ON appointments(company_id, scheduled_start) WHERE is_active = true;
CREATE INDEX idx_appointments_closer_date ON appointments(closer_id, scheduled_start) WHERE is_active = true;

-- ============================================================
-- DEALS: add active_appointment_id
-- ============================================================

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS active_appointment_id UUID REFERENCES appointments(id);

CREATE INDEX IF NOT EXISTS idx_deals_active_appointment ON deals(active_appointment_id);

-- ============================================================
-- CONTACTS: add repcard_status (text)
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS repcard_status TEXT;

-- ============================================================
-- RLS: APPOINTMENTS
-- ============================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- SELECT: company isolation + role-based visibility
-- Closers see own; office_manager sees office; admin/regional_manager see all
CREATE POLICY appointments_select_policy ON appointments
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    AND (
      auth_role_category() IN ('admin', 'regional_manager')
      OR (auth_role_category() = 'office_manager' AND closer_id IN (SELECT id FROM users WHERE office_id = (SELECT office_id FROM users WHERE auth_id = auth.uid())))
      OR closer_id = auth_user_id()
    )
  );

-- INSERT: same company, user is admin or closer or setter
CREATE POLICY appointments_insert_policy ON appointments
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    AND (
      auth_role_category() = 'admin'
      OR closer_id = auth_user_id()
      OR setter_id = auth_user_id()
    )
  );

-- UPDATE: same company + role-based
CREATE POLICY appointments_update_policy ON appointments
  FOR UPDATE USING (
    company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    AND (
      auth_role_category() IN ('admin', 'regional_manager')
      OR (auth_role_category() = 'office_manager' AND closer_id IN (SELECT id FROM users WHERE office_id = (SELECT office_id FROM users WHERE auth_id = auth.uid())))
      OR closer_id = auth_user_id()
      OR setter_id = auth_user_id()
    )
  );

-- DELETE: admin or same closer/setter
CREATE POLICY appointments_delete_policy ON appointments
  FOR DELETE USING (
    company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    AND (
      auth_role_category() = 'admin'
      OR closer_id = auth_user_id()
      OR setter_id = auth_user_id()
    )
  );

-- ============================================================
-- TRIGGER: appointments updated_at (uses update_updated_at from v1)
-- ============================================================

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- For existing deployments: apply follow_up and duration default
-- (Skip if running migration from scratch.)
-- ============================================================
-- ALTER TABLE appointments ALTER COLUMN duration_minutes SET DEFAULT 60;
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check;
-- ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check
--   CHECK (appointment_type IN ('in_home', 'virtual', 'phone', 'follow_up'));
