-- ============================================================
-- Migration 010: Aurora Design Integration Fields
-- Epic 6: Add aurora_design_request_id + design_status tracking
-- ============================================================

-- 1. Add missing Aurora tracking field to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS aurora_design_request_id TEXT;

-- 2. Add design status tracking (Aurora design requests go through states)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_status TEXT CHECK (design_status IN (
  'not_started',
  'consumption_entered',
  'project_created',
  'design_requested',
  'design_in_progress',
  'design_completed',
  'design_rejected',
  'design_accepted'
));
ALTER TABLE deals ALTER COLUMN design_status SET DEFAULT 'not_started';

-- 3. Add consumption fields to deals (closer enters these before design request)
-- NOTE: Many consumption fields already exist on contacts table. These on deals
-- capture the per-deal snapshot (customer may have multiple deals / change usage).
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_kwh JSONB;  -- [jan, feb, ..., dec] array of 12 numbers
ALTER TABLE deals ADD COLUMN IF NOT EXISTS annual_kwh NUMERIC(10,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS utility_company TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS utility_tariff TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_bill NUMERIC(10,2);  -- average monthly electric bill

-- 4. Add design request metadata
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_request_type TEXT CHECK (design_request_type IN (
  'design_team',    -- Aurora design team builds it
  'auto_designer',  -- Aurora AutoDesigner
  'sales_mode'      -- Closer builds in Sales Mode
));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_requested_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_completed_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_request_notes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS target_offset NUMERIC(5,2) DEFAULT 105;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS roof_material TEXT;

-- 5. Add Sales Mode deep link (stored after design complete for quick access)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS aurora_sales_mode_url TEXT;

-- 6. Indexes for looking up deals by Aurora IDs (webhook handlers need this)
CREATE INDEX IF NOT EXISTS idx_deals_aurora_design_request ON deals(aurora_design_request_id);
CREATE INDEX IF NOT EXISTS idx_deals_aurora_project ON deals(aurora_project_id);
CREATE INDEX IF NOT EXISTS idx_deals_design_status ON deals(design_status);

-- 7. Update the v_deal_detail view to include new fields (drop and recreate)
DROP VIEW IF EXISTS v_deal_detail;
CREATE VIEW v_deal_detail AS
SELECT
  d.id,
  d.company_id,
  d.contact_id,
  d.deal_number,
  d.setter_id,
  d.closer_id,
  d.office_id,
  d.team_id,
  d.stage,
  d.stage_changed_at,
  d.active_proposal_id,
  d.install_address,
  d.install_address2,
  d.install_city,
  d.install_state,
  d.install_zip,
  d.install_lat,
  d.install_lng,
  d.repcard_appointment_id,
  d.appointment_date,
  d.appointment_end,
  d.appointment_timezone,
  d.appointment_location,
  d.appointment_notes,
  d.appointment_outcome,
  d.appointment_outcome_id,
  d.system_size_kw,
  d.panel_count,
  d.panel_model,
  d.inverter_model,
  d.battery_model,
  d.battery_count,
  d.offset_percentage,
  d.annual_production_kwh,
  d.annual_usage_kwh,
  d.mounting_type,
  d.gross_price,
  d.adders_total,
  d.net_price,
  d.gross_ppw,
  d.net_ppw,
  d.dealer_fee,
  d.dealer_fee_percentage,
  d.commission_base,
  d.lender_id,
  d.loan_product,
  d.loan_amount,
  d.loan_term_months,
  d.interest_rate,
  d.monthly_payment,
  d.financing_status,
  d.financing_application_id,
  d.financing_approved_at,
  d.install_agreement_status,
  d.install_agreement_signed_at,
  d.submission_status,
  d.submitted_at,
  d.submitted_by,
  d.intake_reviewed_at,
  d.intake_reviewed_by,
  d.rejection_reason,
  d.aurora_project_id,
  d.aurora_design_id,
  d.aurora_design_request_id,
  d.design_status,
  d.monthly_kwh,
  d.annual_kwh,
  d.utility_company,
  d.utility_tariff,
  d.monthly_bill,
  d.design_request_type,
  d.design_requested_at,
  d.design_completed_at,
  d.design_request_notes,
  d.target_offset,
  d.roof_material,
  d.aurora_sales_mode_url,
  d.quickbase_deal_id,
  d.enerflo_deal_id,
  d.enerflo_short_code,
  d.source,
  d.both_spouses_present,
  d.is_new_construction,
  d.is_battery_only,
  d.is_commercial,
  d.has_hoa,
  d.deleted_at,
  d.deleted_by,
  d.created_at,
  d.updated_at,
  d.updated_by,
  c.first_name AS contact_first_name,
  c.last_name AS contact_last_name,
  c.email AS contact_email,
  c.phone AS contact_phone,
  c.address AS contact_address,
  c.city AS contact_city,
  c.state AS contact_state,
  c.zip AS contact_zip,
  c.monthly_electric_bill,
  c.annual_usage_kwh AS contact_annual_usage,
  c.utility_company AS contact_utility_company,
  (closer.first_name || ' ' || closer.last_name) AS closer_name,
  closer.email AS closer_email,
  (setter.first_name || ' ' || setter.last_name) AS setter_name,
  o.name AS office_name,
  t.name AS team_name,
  l.name AS lender_name
FROM deals d
JOIN contacts c ON d.contact_id = c.id
LEFT JOIN users closer ON d.closer_id = closer.id
LEFT JOIN users setter ON d.setter_id = setter.id
LEFT JOIN offices o ON d.office_id = o.id
LEFT JOIN teams t ON d.team_id = t.id
LEFT JOIN lenders l ON d.lender_id = l.id
WHERE d.deleted_at IS NULL;
