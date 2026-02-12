-- ============================================================
-- KinOS Database Migration v1.0
-- Complete production-ready schema
-- 
-- Includes: audit trail, history tracking, snapshots,
-- per-array design data, consumption profiles, soft deletes,
-- Postgres triggers, and RLS policies.
--
-- Run in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ORGANIZATION HIERARCHY
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  parent_office_id UUID REFERENCES offices(id),
  name TEXT NOT NULL,
  office_type TEXT DEFAULT 'office' CHECK (office_type IN ('region', 'office')),
  repcard_office_name TEXT,
  state TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_offices_company ON offices(company_id);
CREATE INDEX idx_offices_parent ON offices(parent_office_id);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id),
  name TEXT NOT NULL,
  repcard_team_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_teams_office ON teams(office_id);

-- ============================================================
-- 2. ROLES & USERS
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'admin', 'regional_manager', 'office_manager', 'closer', 'setter', 'viewer'
  )),
  permissions JSONB DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  office_id UUID REFERENCES offices(id),
  team_id UUID REFERENCES teams(id),

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country_code TEXT DEFAULT '+1',
  image_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'America/New_York',

  -- External IDs
  repcard_user_id INTEGER,
  repcard_badge_id TEXT,
  external_id TEXT,

  -- Per-user permission overrides
  can_create_leads BOOLEAN DEFAULT true,
  is_view_only BOOLEAN DEFAULT false,
  allow_design_requests BOOLEAN DEFAULT true,
  allow_manual_installs BOOLEAN DEFAULT true,
  can_create_change_orders BOOLEAN DEFAULT true,
  can_reassign_leads BOOLEAN DEFAULT false,

  -- Compliance
  sales_rep_license_number TEXT,
  license_state TEXT,
  license_expiry DATE,

  -- Status
  status TEXT DEFAULT 'invited' CHECK (status IN (
    'invited', 'active', 'deactivated'
  )),
  last_login_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE UNIQUE INDEX idx_users_email_company ON users(email, company_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_repcard ON users(repcard_user_id);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- 3. USER CREDENTIALS & INTEGRATIONS
-- ============================================================

CREATE TABLE user_lender_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL,  -- FK added after lenders table
  lender_username TEXT,
  lender_email TEXT,
  lender_rep_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  extra_credentials JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  UNIQUE(user_id, lender_id)
);

CREATE TABLE user_integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  UNIQUE(user_id, integration_type)
);

-- ============================================================
-- 4. CONTACTS
-- ============================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),

  -- Identity
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country_code TEXT DEFAULT '+1',
  secondary_phone TEXT,
  secondary_email TEXT,

  -- Mailing / Home Address
  address TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),

  -- Property Details
  building_sqft INTEGER,
  roof_type TEXT,
  roof_age INTEGER,
  has_hoa BOOLEAN DEFAULT false,
  hoa_name TEXT,
  hoa_contact TEXT,

  -- Utility & Consumption (Option A: basic input, Option B ready)
  utility_company TEXT,
  utility_account_number TEXT,
  monthly_electric_bill DECIMAL(8,2),
  annual_usage_kwh DECIMAL(10,2),
  monthly_usage_kwh JSONB,               -- [jan, feb, ..., dec] kWh values if available
  utility_rate_kwh DECIMAL(8,5),         -- $/kWh if known
  utility_tariff_code TEXT,              -- e.g. "RS-1" (for Option B / Genability)
  utility_tariff_name TEXT,              -- e.g. "Residential" (for Option B)
  genability_utility_id INTEGER,         -- Genability LSE ID (for Option B)
  genability_tariff_id INTEGER,          -- Genability tariff ID (for Option B)

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- External IDs
  repcard_customer_id INTEGER,
  repcard_status_id INTEGER,
  external_id TEXT,

  -- Type
  contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN (
    'lead', 'customer', 'referral', 'other'
  )),
  contact_source TEXT DEFAULT 'repcard',

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_repcard ON contacts(repcard_customer_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_name ON contacts(company_id, last_name, first_name);
CREATE INDEX idx_contacts_not_deleted ON contacts(company_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 5. DEALS
-- ============================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),

  deal_number TEXT UNIQUE NOT NULL,

  -- Ownership
  setter_id UUID REFERENCES users(id),
  closer_id UUID REFERENCES users(id),
  office_id UUID REFERENCES offices(id),
  team_id UUID REFERENCES teams(id),

  -- Pipeline
  stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN (
    'new_lead',
    'appointment_set',
    'appointment_sat',
    'design_requested',
    'design_complete',
    'proposal_sent',
    'proposal_accepted',
    'financing_applied',
    'financing_approved',
    'stips_pending',
    'stips_cleared',
    'contract_sent',
    'contract_signed',
    'submission_ready',
    'submitted',
    'intake_approved',
    'intake_rejected',
    'cancelled',
    'lost'
  )),
  stage_changed_at TIMESTAMPTZ DEFAULT now(),

  -- Active Proposal (which proposal is "the one")
  active_proposal_id UUID,  -- FK added after proposals table

  -- Install Address (may differ from contact mailing address)
  install_address TEXT,
  install_address2 TEXT,
  install_city TEXT,
  install_state TEXT,
  install_zip TEXT,
  install_lat DECIMAL(10,7),
  install_lng DECIMAL(10,7),

  -- Appointment (from RepCard)
  repcard_appointment_id INTEGER,
  appointment_date TIMESTAMPTZ,
  appointment_end TIMESTAMPTZ,
  appointment_timezone TEXT,
  appointment_location TEXT,
  appointment_notes TEXT,
  appointment_outcome TEXT,
  appointment_outcome_id INTEGER,

  -- Solar System Details (populated from finalized proposal)
  system_size_kw DECIMAL(8,3),
  panel_count INTEGER,
  panel_model TEXT,
  inverter_model TEXT,
  battery_model TEXT,
  battery_count INTEGER DEFAULT 0,
  offset_percentage DECIMAL(5,2),
  annual_production_kwh DECIMAL(10,2),
  annual_usage_kwh DECIMAL(10,2),
  mounting_type TEXT DEFAULT 'roof' CHECK (mounting_type IN ('roof', 'ground', 'carport', 'mixed')),

  -- Pricing (populated from finalized proposal)
  gross_price DECIMAL(12,2),
  adders_total DECIMAL(10,2) DEFAULT 0,
  net_price DECIMAL(12,2),
  gross_ppw DECIMAL(8,4),
  net_ppw DECIMAL(8,4),
  dealer_fee DECIMAL(10,2),
  dealer_fee_percentage DECIMAL(5,4),
  commission_base DECIMAL(12,2),

  -- Financing
  lender_id UUID,  -- FK added after lenders table
  loan_product TEXT,
  loan_amount DECIMAL(12,2),
  loan_term_months INTEGER,
  interest_rate DECIMAL(6,4),
  monthly_payment DECIMAL(10,2),
  financing_status TEXT CHECK (financing_status IN (
    'not_started', 'application_sent', 'pending', 'approved',
    'conditionally_approved', 'stips_pending', 'stips_cleared',
    'denied', 'expired', 'cancelled'
  )),
  financing_application_id TEXT,
  financing_approved_at TIMESTAMPTZ,

  -- Document Signing
  install_agreement_status TEXT DEFAULT 'not_sent' CHECK (install_agreement_status IN (
    'not_sent', 'sent', 'viewed', 'signed', 'declined', 'expired'
  )),
  install_agreement_signed_at TIMESTAMPTZ,

  -- Submission
  submission_status TEXT DEFAULT 'not_ready' CHECK (submission_status IN (
    'not_ready', 'ready', 'submitted', 'approved', 'rejected'
  )),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  intake_reviewed_at TIMESTAMPTZ,
  intake_reviewed_by TEXT,
  rejection_reason TEXT,

  -- Aurora
  aurora_project_id TEXT,
  aurora_design_id TEXT,

  -- External IDs
  quickbase_deal_id TEXT,
  enerflo_deal_id TEXT,
  enerflo_short_code TEXT,

  -- Metadata
  source TEXT DEFAULT 'repcard',
  both_spouses_present BOOLEAN,
  is_new_construction BOOLEAN DEFAULT false,
  is_battery_only BOOLEAN DEFAULT false,
  is_commercial BOOLEAN DEFAULT false,
  has_hoa BOOLEAN DEFAULT false,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_deals_company_stage ON deals(company_id, stage);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_closer ON deals(closer_id);
CREATE INDEX idx_deals_setter ON deals(setter_id);
CREATE INDEX idx_deals_office ON deals(office_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_repcard_appt ON deals(repcard_appointment_id);
CREATE INDEX idx_deals_created ON deals(created_at);
CREATE INDEX idx_deals_aurora ON deals(aurora_project_id);
CREATE INDEX idx_deals_not_deleted ON deals(company_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_office_created ON deals(office_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_closer_created ON deals(closer_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_submitted ON deals(submitted_at) WHERE submitted_at IS NOT NULL;

-- ============================================================
-- 6. EQUIPMENT CATALOG
-- ============================================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  category TEXT NOT NULL CHECK (category IN ('panel', 'inverter', 'battery', 'optimizer', 'other')),
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  wattage INTEGER,
  efficiency DECIMAL(6,4),
  degradation_rate DECIMAL(6,4),    -- Annual degradation (e.g. 0.005 = 0.5%)
  specifications JSONB DEFAULT '{}',

  cost_per_unit DECIMAL(10,2),
  cost_per_watt DECIMAL(8,4),
  msrp DECIMAL(10,2),

  aurora_component_id TEXT,
  aurora_component_name TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
  archived_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_equipment_company ON equipment(company_id, category);
CREATE INDEX idx_equipment_aurora ON equipment(aurora_component_id);

CREATE TABLE equipment_market_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  installer_market_id UUID NOT NULL,  -- FK added after installer_markets
  is_default BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  override_cost_per_unit DECIMAL(10,2),
  override_cost_per_watt DECIMAL(8,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. LENDERS & FINANCING
-- ============================================================

CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  lender_type TEXT NOT NULL CHECK (lender_type IN ('loan', 'tpo', 'ppa', 'lease', 'cash')),
  logo_url TEXT,
  api_endpoint TEXT,
  api_credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_lenders_company ON lenders(company_id);

-- Add deferred FKs
ALTER TABLE user_lender_credentials
  ADD CONSTRAINT fk_ulc_lender FOREIGN KEY (lender_id) REFERENCES lenders(id);
ALTER TABLE deals
  ADD CONSTRAINT fk_deals_lender FOREIGN KEY (lender_id) REFERENCES lenders(id);

CREATE TABLE lender_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_code TEXT,

  -- Terms
  term_months INTEGER,
  interest_rate DECIMAL(6,4),
  apr DECIMAL(6,4),
  escalator_percent DECIMAL(5,3),

  -- Dealer fee
  dealer_fee_percent DECIMAL(6,4),
  dealer_fee_min DECIMAL(10,2),
  dealer_fee_max DECIMAL(10,2),

  -- Sales-facing (margin engine)
  sales_facing_fee_percent DECIMAL(6,4),
  kin_margin_percent DECIMAL(6,4),

  -- TPO-specific (from Enerflo payload)
  tpo_available_rates JSONB,          -- Array of rate options [0.09, 0.095, ...]
  tpo_payment_input_mode TEXT CHECK (tpo_payment_input_mode IN (
    'rate_only', 'payment_only', 'both'
  )),
  allowed_adder_categories JSONB DEFAULT '[]',  -- e.g. ["backupBattery", "electricalUpgrade"]
  equipment_pricing_mode TEXT DEFAULT 'standard' CHECK (equipment_pricing_mode IN (
    'standard', 'zero_cost', 'custom'
  )),

  -- Availability
  available_states TEXT[],
  min_fico INTEGER,
  min_system_size_kw DECIMAL(6,2),
  max_system_size_kw DECIMAL(6,2),
  min_loan_amount DECIMAL(10,2),
  max_loan_amount DECIMAL(10,2),

  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_lender_products_lender ON lender_products(lender_id);

CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  proposal_id UUID,  -- FK added after proposals
  lender_id UUID NOT NULL REFERENCES lenders(id),
  lender_product_id UUID REFERENCES lender_products(id),

  external_application_id TEXT,
  application_url TEXT,
  loan_amount DECIMAL(12,2),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'pending', 'approved',
    'conditionally_approved', 'stips_pending', 'stips_cleared',
    'denied', 'expired', 'cancelled', 'funded'
  )),
  status_changed_at TIMESTAMPTZ DEFAULT now(),

  approved_amount DECIMAL(12,2),
  approved_rate DECIMAL(6,4),
  approved_term_months INTEGER,
  denial_reason TEXT,
  conditions TEXT,
  stips JSONB DEFAULT '[]',

  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  decision_at TIMESTAMPTZ,

  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_financing_deal ON financing_applications(deal_id);
CREATE INDEX idx_financing_status ON financing_applications(status);

CREATE TABLE financing_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financing_application_id UUID NOT NULL REFERENCES financing_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. PROPOSALS
-- ============================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,

  -- Design snapshot (frozen at proposal creation)
  aurora_design_id TEXT,
  design_name TEXT,
  system_size_kw DECIMAL(8,3),
  panel_count INTEGER,
  panel_model TEXT,
  panel_wattage INTEGER,
  inverter_model TEXT,
  annual_production_kwh DECIMAL(10,2),
  annual_consumption_kwh DECIMAL(10,2),
  offset_percentage DECIMAL(6,2),
  weighted_tsrf DECIMAL(8,6),
  mounting_type TEXT DEFAULT 'roof',

  -- Consumption snapshot (from Aurora consumption profile)
  monthly_consumption_kwh JSONB,       -- [jan_kwh, feb_kwh, ..., dec_kwh]
  utility_name TEXT,                    -- Utility used for savings calc
  utility_rate_kwh DECIMAL(8,5),       -- Pre-solar rate $/kWh
  post_solar_rate_kwh DECIMAL(8,5),    -- Post-solar rate $/kWh

  -- Pricing (calculated by pricing engine)
  base_price DECIMAL(12,2),
  base_ppw DECIMAL(8,4),
  adder_total DECIMAL(12,2) DEFAULT 0,
  adder_ppw DECIMAL(8,4) DEFAULT 0,
  discount_total DECIMAL(12,2) DEFAULT 0,
  equipment_cost DECIMAL(12,2) DEFAULT 0,
  base_system_cost DECIMAL(12,2),
  base_system_ppw DECIMAL(8,4),
  dealer_fee_amount DECIMAL(12,2) DEFAULT 0,
  dealer_fee_ppw DECIMAL(8,4) DEFAULT 0,
  gross_cost DECIMAL(12,2),
  gross_ppw DECIMAL(8,4),
  rebate_total DECIMAL(12,2) DEFAULT 0,
  net_cost DECIMAL(12,2),
  net_ppw DECIMAL(8,4),
  down_payment DECIMAL(10,2) DEFAULT 0,
  finance_cost DECIMAL(12,2),           -- Total financed (gross - down_payment)
  tax_amount DECIMAL(10,2) DEFAULT 0,

  -- ITC / Federal Rebate
  federal_rebate_base DECIMAL(12,2),
  federal_rebate_amount DECIMAL(12,2) DEFAULT 0,

  -- Cost override / goal-seek
  is_cost_override BOOLEAN DEFAULT false,
  original_base_ppw DECIMAL(8,4),
  override_gross_cost DECIMAL(12,2),

  -- Financing selection
  lender_id UUID REFERENCES lenders(id),
  lender_product_id UUID REFERENCES lender_products(id),
  financing_method TEXT,
  financing_product_name TEXT,
  monthly_payment DECIMAL(10,2),
  escalator_percent DECIMAL(5,3),
  rate_per_kwh DECIMAL(8,5),
  epc_rate DECIMAL(8,4),
  epc_total DECIMAL(12,2),

  -- Dealer fee tracking (margin engine)
  lender_actual_dealer_fee DECIMAL(6,4),
  sales_facing_dealer_fee DECIMAL(6,4),
  kin_margin_on_fee DECIMAL(6,4),

  rep_lender_verified BOOLEAN DEFAULT false,

  -- Commission
  commission_base DECIMAL(12,2),
  commission_ppw DECIMAL(8,4),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'ready', 'finalized', 'superseded'
  )),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES users(id),
  unfinalized_at TIMESTAMPTZ,
  unfinalized_by UUID REFERENCES users(id),

  -- Aurora sync
  aurora_proposal_id TEXT,
  aurora_web_proposal_url TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Add deferred FKs
ALTER TABLE deals
  ADD CONSTRAINT fk_deals_active_proposal FOREIGN KEY (active_proposal_id) REFERENCES proposals(id);
ALTER TABLE financing_applications
  ADD CONSTRAINT fk_financing_proposal FOREIGN KEY (proposal_id) REFERENCES proposals(id);

-- ============================================================
-- 9. PROPOSAL ARRAYS (Per-array design data from Aurora)
-- ============================================================

CREATE TABLE proposal_arrays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  array_index INTEGER NOT NULL,

  -- Module info
  module_name TEXT,
  module_model TEXT,
  module_manufacturer TEXT,
  module_wattage INTEGER,
  module_count INTEGER NOT NULL,

  -- Array geometry
  pitch DECIMAL(5,2),
  azimuth DECIMAL(6,2),
  roof_plane_index INTEGER,
  panel_orientation TEXT,
  inverter_index INTEGER,

  -- Performance metrics
  tof DECIMAL(6,4),                    -- Temperature operating factor
  tsrf DECIMAL(8,6),                   -- Total solar resource fraction
  solar_access DECIMAL(6,4),
  solar_access_by_month JSONB,         -- [12 decimal values]

  -- Aurora references
  aurora_module_id TEXT,
  aurora_inverter_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposal_arrays ON proposal_arrays(proposal_id);

-- ============================================================
-- 10. PROPOSAL ADDERS & DISCOUNTS
-- ============================================================

CREATE TABLE proposal_adders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  adder_template_id UUID,  -- FK added after adder_templates
  name TEXT NOT NULL,
  pricing_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,
  ppw DECIMAL(8,4),
  is_auto_applied BOOLEAN DEFAULT false,
  is_customer_facing BOOLEAN DEFAULT true,
  eligible_for_itc BOOLEAN DEFAULT false,
  dynamic_inputs JSONB DEFAULT '{}',   -- User-entered values (e.g. {"linear_feet": 45})
  aurora_adder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposal_adders ON proposal_adders(proposal_id);

CREATE TABLE proposal_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN (
    'fixed_amount', 'percentage', 'per_watt'
  )),
  amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  ppw DECIMAL(8,4),
  is_customer_facing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposal_discounts ON proposal_discounts(proposal_id);

-- ============================================================
-- 11. PRICING & ADDER CONFIGURATION
-- ============================================================

CREATE TABLE installer_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Add deferred FK
ALTER TABLE equipment_market_availability
  ADD CONSTRAINT fk_ema_market FOREIGN KEY (installer_market_id) REFERENCES installer_markets(id);

CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  installer_market_id UUID REFERENCES installer_markets(id),
  name TEXT NOT NULL,
  base_ppw DECIMAL(8,4),
  min_ppw DECIMAL(8,4),
  max_ppw DECIMAL(8,4),
  buffer_amount DECIMAL(10,2) DEFAULT 0,
  buffer_ppw DECIMAL(8,4) DEFAULT 0,
  state_tax_rate DECIMAL(6,4) DEFAULT 0,
  allow_cost_override BOOLEAN DEFAULT false,
  override_min_ppw DECIMAL(8,4),
  override_max_ppw DECIMAL(8,4),
  ppw_adjustments JSONB DEFAULT '[]',  -- [{condition, adjustment}] rules
  rounding_scale INTEGER DEFAULT 2,
  rounding_mode TEXT DEFAULT 'ROUND_HALF_UP',
  min_panel_count INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE adder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,  -- 'electrical', 'structural', 'battery', 'roof', etc.
  pricing_type TEXT NOT NULL CHECK (pricing_type IN (
    'fixed_amount', 'price_per_watt', 'price_per_unit',
    'price_per_panel', 'percentage', 'custom'
  )),
  default_amount DECIMAL(10,2),
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  is_customer_facing BOOLEAN DEFAULT true,
  eligible_for_itc BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  -- Dynamic input definitions (what the closer needs to enter)
  dynamic_input_definitions JSONB DEFAULT '[]',  -- [{name, type, label, required, min, max}]
  -- Pricing computation model (for custom adders)
  pricing_model JSONB DEFAULT '{}',  -- {formula, inputs} like Enerflo's pricingOptions
  auto_apply_conditions JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Add deferred FK
ALTER TABLE proposal_adders
  ADD CONSTRAINT fk_pa_template FOREIGN KEY (adder_template_id) REFERENCES adder_templates(id);

CREATE TABLE adder_scope_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adder_template_id UUID NOT NULL REFERENCES adder_templates(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'installer_market', 'state', 'office', 'team',
    'equipment', 'lender', 'lender_type', 'system_size_min', 'system_size_max'
  )),
  rule_value TEXT NOT NULL,
  is_inclusion BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_adder_scope ON adder_scope_rules(adder_template_id);

-- ============================================================
-- 12. DOCUMENT SIGNING
-- ============================================================

CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT DEFAULT 'pandadoc' CHECK (provider IN ('pandadoc', 'signnow')),
  provider_template_id TEXT NOT NULL,
  merge_field_mapping JSONB DEFAULT '{}',
  document_type TEXT NOT NULL CHECK (document_type IN (
    'install_agreement', 'financing_agreement', 'hoa_authorization',
    'interconnection', 'change_order', 'addendum', 'other'
  )),
  required_for_stages TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE document_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id),
  provider TEXT NOT NULL,
  provider_document_id TEXT,
  provider_envelope_id TEXT,

  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'sent', 'viewed', 'partially_signed',
    'signed', 'declined', 'expired', 'voided'
  )),
  status_changed_at TIMESTAMPTZ DEFAULT now(),

  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_document_url TEXT,

  signers JSONB DEFAULT '[]',
  merge_data JSONB DEFAULT '{}',

  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_doc_envelopes_deal ON document_envelopes(deal_id);
CREATE INDEX idx_doc_envelopes_status ON document_envelopes(status);

-- ============================================================
-- 13. GATES / CHECKLIST SYSTEM
-- ============================================================

CREATE TABLE gate_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  gate_type TEXT NOT NULL CHECK (gate_type IN (
    'auto_status',        -- Automatically passes based on deal state
    'file_uploaded',      -- A file must be uploaded
    'manual_check',       -- Manual toggle by rep
    'approval_required',  -- Manager must approve
    'external_status',    -- Based on external system status
    'lender_specific'     -- Only applies for certain lenders
  )),
  required_for_stage TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE gate_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  gate_definition_id UUID NOT NULL REFERENCES gate_definitions(id),
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, gate_definition_id)
);

CREATE INDEX idx_gate_completions_deal ON gate_completions(deal_id);

-- ============================================================
-- 14. ATTACHMENTS
-- ============================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT,  -- 'utility_bill', 'photo_id', 'signed_contract', 'site_survey', 'permit', 'design', 'other'

  -- External references
  enerflo_file_id TEXT,
  repcard_attachment_id TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attachments_deal ON attachments(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_contact ON attachments(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_category ON attachments(deal_id, category);

-- ============================================================
-- 15. NOTES
-- ============================================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'team' CHECK (visibility IN (
    'private', 'team', 'company'
  )),
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,

  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_notes_deal ON notes(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_contact ON notes(contact_id) WHERE deleted_at IS NULL;

CREATE TABLE note_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 16. HISTORY & AUDIT TRACKING
-- ============================================================

-- Deal stage changes
CREATE TABLE deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stage_history_deal ON deal_stage_history(deal_id);
CREATE INDEX idx_stage_history_created ON deal_stage_history(created_at);

-- Deal assignment changes (closer/setter/office/team)
CREATE TABLE deal_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('closer', 'setter', 'office', 'team')),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  from_entity_id UUID,
  to_entity_id UUID,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assignment_history_deal ON deal_assignment_history(deal_id);

-- Contact field-level change history
CREATE TABLE contact_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users(id),
  change_source TEXT DEFAULT 'user',  -- 'user', 'repcard_webhook', 'import'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_history ON contact_change_history(contact_id);

-- ============================================================
-- 17. DEAL SNAPSHOTS (Point-in-time state capture)
-- ============================================================

CREATE TABLE deal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'proposal_finalized',
    'financing_submitted',
    'contract_generated',
    'submitted_to_quickbase',
    'manual'
  )),
  snapshot_data JSONB NOT NULL,  -- Full deal + proposal + contact state
  proposal_id UUID REFERENCES proposals(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_snapshots_deal ON deal_snapshots(deal_id);
CREATE INDEX idx_snapshots_type ON deal_snapshots(deal_id, snapshot_type);

-- ============================================================
-- 18. GENERIC AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changes JSONB NOT NULL DEFAULT '{}',  -- {"field": {"old": x, "new": y}}
  changed_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_user ON audit_log(changed_by);

-- ============================================================
-- 19. WEBHOOK EVENTS (Inbound)
-- ============================================================

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}',
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received', 'processing', 'processed', 'failed', 'skipped'
  )),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  related_deal_id UUID REFERENCES deals(id),
  related_contact_id UUID REFERENCES contacts(id),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhooks_source ON webhook_events(source, event_type);
CREATE INDEX idx_webhooks_status ON webhook_events(status);
CREATE INDEX idx_webhooks_created ON webhook_events(created_at);

-- ============================================================
-- 20. INTEGRATION SYNC LOG (Outbound)
-- ============================================================

CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'success', 'failed', 'retrying'
  )),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_log_target ON integration_sync_log(target, action);
CREATE INDEX idx_sync_log_entity ON integration_sync_log(entity_type, entity_id);

-- ============================================================
-- 21. AURORA PRICING SYNCS
-- ============================================================

CREATE TABLE aurora_pricing_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  aurora_project_id TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 22. ACTIVITY LOG & NOTIFICATIONS
-- ============================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_deal ON activities(deal_id, created_at DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  deal_id UUID REFERENCES deals(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 23. COMMISSION STRUCTURES
-- ============================================================

CREATE TABLE commission_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  structure_type TEXT NOT NULL CHECK (structure_type IN (
    'per_watt', 'percentage', 'flat_fee', 'tiered'
  )),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('closer', 'setter', 'manager')),
  base_rate DECIMAL(8,4),
  tiers JSONB DEFAULT '[]',
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE deal_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  commission_type TEXT NOT NULL,
  commission_structure_id UUID REFERENCES commission_structures(id),
  base_amount DECIMAL(12,2),
  adjustments JSONB DEFAULT '[]',
  final_amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'estimated' CHECK (status IN (
    'estimated', 'pending', 'approved', 'paid', 'clawback'
  )),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_commissions_deal ON deal_commissions(deal_id);
CREATE INDEX idx_commissions_user ON deal_commissions(user_id);

-- ============================================================
-- 24. REPCARD SYNC TRACKING
-- ============================================================

CREATE TABLE repcard_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  entity_type TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_cursor TEXT,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  UNIQUE(company_id, entity_type)
);

-- ============================================================
-- 25. POSTGRES FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on all tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all major tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'offices', 'teams', 'roles', 'users',
    'user_lender_credentials', 'user_integration_settings',
    'contacts', 'deals', 'proposals', 'attachments', 'notes',
    'equipment', 'lenders', 'lender_products',
    'financing_applications', 'document_templates', 'document_envelopes',
    'gate_definitions', 'gate_completions',
    'installer_markets', 'pricing_configs', 'adder_templates',
    'commission_structures', 'deal_commissions'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- Auto-insert deal_stage_history when deal stage changes
CREATE OR REPLACE FUNCTION track_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.updated_by);
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deals_stage_change
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION track_deal_stage_change();

-- Auto-insert deal_assignment_history when closer/setter changes
CREATE OR REPLACE FUNCTION track_deal_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.closer_id IS DISTINCT FROM NEW.closer_id THEN
    INSERT INTO deal_assignment_history (deal_id, assignment_type, from_user_id, to_user_id, changed_by)
    VALUES (NEW.id, 'closer', OLD.closer_id, NEW.closer_id, NEW.updated_by);
  END IF;
  IF OLD.setter_id IS DISTINCT FROM NEW.setter_id THEN
    INSERT INTO deal_assignment_history (deal_id, assignment_type, from_user_id, to_user_id, changed_by)
    VALUES (NEW.id, 'setter', OLD.setter_id, NEW.setter_id, NEW.updated_by);
  END IF;
  IF OLD.office_id IS DISTINCT FROM NEW.office_id THEN
    INSERT INTO deal_assignment_history (deal_id, assignment_type, from_entity_id, to_entity_id, changed_by)
    VALUES (NEW.id, 'office', OLD.office_id, NEW.office_id, NEW.updated_by);
  END IF;
  IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
    INSERT INTO deal_assignment_history (deal_id, assignment_type, from_entity_id, to_entity_id, changed_by)
    VALUES (NEW.id, 'team', OLD.team_id, NEW.team_id, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deals_assignment_change
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION track_deal_assignment_change();

-- Auto-generate deal_number: KIN-2026-00001
CREATE SEQUENCE IF NOT EXISTS deal_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_deal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_number IS NULL OR NEW.deal_number = '' THEN
    NEW.deal_number = 'KIN-' || EXTRACT(YEAR FROM now())::TEXT || '-' ||
                      LPAD(nextval('deal_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deals_number
  BEFORE INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION generate_deal_number();

-- Track contact field changes (especially from RepCard webhooks)
CREATE OR REPLACE FUNCTION track_contact_changes()
RETURNS TRIGGER AS $$
DECLARE
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  FOREACH field IN ARRAY ARRAY[
    'first_name', 'last_name', 'email', 'phone', 'address', 'address2',
    'city', 'state', 'zip', 'latitude', 'longitude', 'utility_company',
    'monthly_electric_bill', 'annual_usage_kwh', 'owner_id'
  ]
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO new_val USING NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO contact_change_history (contact_id, field_name, old_value, new_value, changed_by, change_source)
      VALUES (NEW.id, field, old_val, new_val, NEW.updated_by,
              CASE WHEN NEW.updated_by IS NULL THEN 'repcard_webhook' ELSE 'user' END);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contacts_change_history
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION track_contact_changes();

-- ============================================================
-- 26. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'offices', 'teams', 'roles', 'users',
    'user_lender_credentials', 'user_integration_settings',
    'contacts', 'deals', 'proposals', 'proposal_arrays',
    'proposal_adders', 'proposal_discounts',
    'equipment', 'equipment_market_availability',
    'lenders', 'lender_products',
    'financing_applications', 'financing_status_history',
    'document_templates', 'document_envelopes',
    'gate_definitions', 'gate_completions',
    'installer_markets', 'pricing_configs',
    'adder_templates', 'adder_scope_rules',
    'attachments', 'notes', 'note_edits',
    'deal_stage_history', 'deal_assignment_history',
    'contact_change_history', 'deal_snapshots',
    'audit_log', 'webhook_events', 'integration_sync_log',
    'aurora_pricing_syncs', 'activities', 'notifications',
    'commission_structures', 'deal_commissions',
    'repcard_sync_state'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- Helper function: Get user's company_id from their auth JWT
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Get user's internal user_id from their auth JWT
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'user_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Get user's role category
CREATE OR REPLACE FUNCTION auth_role_category()
RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role_category')::TEXT;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --------------------------------------------------------
-- COMPANY-SCOPED TABLES: Users see only their company's data
-- --------------------------------------------------------

-- Companies: users see only their own company
CREATE POLICY company_isolation ON companies
  FOR ALL USING (id = auth_company_id());

-- Offices: same company
CREATE POLICY office_isolation ON offices
  FOR ALL USING (company_id = auth_company_id());

-- Teams: same company (through office)
CREATE POLICY team_isolation ON teams
  FOR ALL USING (
    office_id IN (SELECT id FROM offices WHERE company_id = auth_company_id())
  );

-- Roles: same company
CREATE POLICY role_isolation ON roles
  FOR ALL USING (company_id = auth_company_id());

-- Users: same company
CREATE POLICY user_isolation ON users
  FOR ALL USING (company_id = auth_company_id());

-- Contacts: same company + soft delete filter
CREATE POLICY contact_isolation ON contacts
  FOR ALL USING (company_id = auth_company_id() AND deleted_at IS NULL);

-- Deals: same company + soft delete filter
CREATE POLICY deal_isolation ON deals
  FOR ALL USING (company_id = auth_company_id() AND deleted_at IS NULL);

-- Equipment: same company
CREATE POLICY equipment_isolation ON equipment
  FOR ALL USING (company_id = auth_company_id());

-- Lenders: same company
CREATE POLICY lender_isolation ON lenders
  FOR ALL USING (company_id = auth_company_id());

-- --------------------------------------------------------
-- DEAL-SCOPED TABLES: Inherit isolation from parent deal
-- --------------------------------------------------------

CREATE POLICY proposals_via_deal ON proposals
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id() AND deleted_at IS NULL)
    AND deleted_at IS NULL
  );

CREATE POLICY proposal_arrays_via_deal ON proposal_arrays
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM proposals p JOIN deals d ON p.deal_id = d.id
      WHERE d.company_id = auth_company_id()
    )
  );

CREATE POLICY proposal_adders_via_deal ON proposal_adders
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM proposals p JOIN deals d ON p.deal_id = d.id
      WHERE d.company_id = auth_company_id()
    )
  );

CREATE POLICY proposal_discounts_via_deal ON proposal_discounts
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM proposals p JOIN deals d ON p.deal_id = d.id
      WHERE d.company_id = auth_company_id()
    )
  );

CREATE POLICY attachments_via_deal ON attachments
  FOR ALL USING (
    (deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id()))
    OR (contact_id IN (SELECT id FROM contacts WHERE company_id = auth_company_id()))
  );

CREATE POLICY notes_via_deal ON notes
  FOR ALL USING (
    (deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id()))
    OR (contact_id IN (SELECT id FROM contacts WHERE company_id = auth_company_id()))
  );

CREATE POLICY activities_via_deal ON activities
  FOR ALL USING (
    (deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id()))
    OR (contact_id IN (SELECT id FROM contacts WHERE company_id = auth_company_id()))
  );

CREATE POLICY financing_via_deal ON financing_applications
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY doc_envelopes_via_deal ON document_envelopes
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY gate_completions_via_deal ON gate_completions
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY snapshots_via_deal ON deal_snapshots
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY stage_history_via_deal ON deal_stage_history
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY assignment_history_via_deal ON deal_assignment_history
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

CREATE POLICY commissions_via_deal ON deal_commissions
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
  );

-- --------------------------------------------------------
-- COMPANY-SCOPED CONFIG TABLES
-- --------------------------------------------------------

CREATE POLICY lender_products_via_lender ON lender_products
  FOR ALL USING (
    lender_id IN (SELECT id FROM lenders WHERE company_id = auth_company_id())
  );

CREATE POLICY gate_defs_isolation ON gate_definitions
  FOR ALL USING (company_id = auth_company_id());

CREATE POLICY doc_templates_isolation ON document_templates
  FOR ALL USING (company_id = auth_company_id());

CREATE POLICY markets_isolation ON installer_markets
  FOR ALL USING (company_id = auth_company_id());

CREATE POLICY pricing_isolation ON pricing_configs
  FOR ALL USING (company_id = auth_company_id());

CREATE POLICY adder_templates_isolation ON adder_templates
  FOR ALL USING (company_id = auth_company_id());

CREATE POLICY commission_structures_isolation ON commission_structures
  FOR ALL USING (company_id = auth_company_id());

-- --------------------------------------------------------
-- USER-SCOPED TABLES
-- --------------------------------------------------------

CREATE POLICY user_credentials_own ON user_lender_credentials
  FOR ALL USING (user_id = auth_user_id());

CREATE POLICY user_settings_own ON user_integration_settings
  FOR ALL USING (user_id = auth_user_id());

CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = auth_user_id());

-- --------------------------------------------------------
-- ADMIN-ONLY TABLES
-- --------------------------------------------------------

CREATE POLICY audit_admin_only ON audit_log
  FOR ALL USING (auth_role_category() = 'admin');

CREATE POLICY webhooks_admin_only ON webhook_events
  FOR ALL USING (auth_role_category() = 'admin');

CREATE POLICY sync_log_admin_only ON integration_sync_log
  FOR ALL USING (auth_role_category() = 'admin');

CREATE POLICY sync_state_admin_only ON repcard_sync_state
  FOR ALL USING (auth_role_category() = 'admin');

-- --------------------------------------------------------
-- SERVICE ROLE BYPASS (for server-side operations)
-- --------------------------------------------------------
-- Note: Supabase service_role key automatically bypasses RLS.
-- All webhook handlers, cron jobs, and background processes
-- should use the service_role key. No additional policies needed.

-- ============================================================
-- 27. SEED DATA: Default Roles
-- ============================================================

-- These get created once per company during onboarding.
-- Using a placeholder company_id that will be replaced during setup.
-- This section shows the STRUCTURE, not the actual seed.

/*
INSERT INTO roles (company_id, name, display_name, category, is_system_role, permissions) VALUES
  (:company_id, 'admin',            'Administrator',     'admin',            true, '{"full_access": true}'),
  (:company_id, 'regional_manager', 'Regional Manager',  'regional_manager', true, '{"view_all_offices": true, "manage_users": true}'),
  (:company_id, 'office_manager',   'Office Manager',    'office_manager',   true, '{"view_office": true, "manage_team": true}'),
  (:company_id, 'closer',           'Closer',            'closer',           true, '{"create_deals": true, "manage_own_deals": true}'),
  (:company_id, 'setter',           'Setter',            'setter',           true, '{"create_leads": true, "set_appointments": true}'),
  (:company_id, 'viewer',           'View Only',         'viewer',           true, '{"read_only": true}');
*/

-- ============================================================
-- 28. VIEWS (Convenience queries)
-- ============================================================

-- Active deals with key info (for pipeline view)
CREATE OR REPLACE VIEW v_deal_pipeline AS
SELECT
  d.id,
  d.deal_number,
  d.stage,
  d.stage_changed_at,
  d.created_at,
  d.system_size_kw,
  d.gross_price,
  d.net_price,
  d.mounting_type,
  c.first_name || ' ' || c.last_name AS contact_name,
  c.phone AS contact_phone,
  c.city AS contact_city,
  c.state AS contact_state,
  COALESCE(d.install_city, c.city) AS install_city,
  COALESCE(d.install_state, c.state) AS install_state,
  closer.first_name || ' ' || closer.last_name AS closer_name,
  setter.first_name || ' ' || setter.last_name AS setter_name,
  o.name AS office_name,
  t.name AS team_name,
  d.company_id
FROM deals d
  JOIN contacts c ON d.contact_id = c.id
  LEFT JOIN users closer ON d.closer_id = closer.id
  LEFT JOIN users setter ON d.setter_id = setter.id
  LEFT JOIN offices o ON d.office_id = o.id
  LEFT JOIN teams t ON d.team_id = t.id
WHERE d.deleted_at IS NULL;

-- Deal detail view (for deal page)
CREATE OR REPLACE VIEW v_deal_detail AS
SELECT
  d.*,
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
  c.utility_company,
  closer.first_name || ' ' || closer.last_name AS closer_name,
  closer.email AS closer_email,
  setter.first_name || ' ' || setter.last_name AS setter_name,
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

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Tables:  38
-- Triggers: 5 (updated_at on 26 tables, stage change, assignment change, deal number, contact history)
-- RLS:     35 policies
-- Views:   2
-- ============================================================
