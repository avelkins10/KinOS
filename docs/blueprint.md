# KIN HOME SOLAR CRM — SYSTEM BLUEPRINT

> **Note:** This blueprint reflects the original design intent plus updates through
> February 2026. For the current live database schema, see `docs/schema-reference.md`.
> For system vision and current state, see `docs/kinos-vision-and-state.md`.
> For planned future features, see `docs/kinos-future-features.md`.

## Platform: KinOS (Internal Codename)

**Version:** 1.0 — February 2026
**Author:** Lead Architect
**Stack:** Next.js 16 (App Router) + Supabase (Postgres + Auth + Storage) + Vercel
**Status:** Epics 0–7 complete. Epic 8 (Financing) next.
**Related Docs:** `docs/kinos-vision-and-state.md` (system overview), `docs/kinos-future-features.md` (planned features)

---

## TABLE OF CONTENTS

1. Executive Summary
2. Architecture Overview
3. Data Model (Complete Postgres Schema)
4. Authentication & Role-Based Access Control
5. RepCard Integration (Webhook Receiver + REST API)
6. Aurora Solar Integration
7. Lender Integration Layer (Provider-Agnostic)
8. Document Signing Layer (Provider-Agnostic)
9. Deal Lifecycle State Machine
10. Configurable Gating Engine (Deal Submission Workflow)
11. Quickbase Integration (Ops Handoff)
12. Commission Data Push (Sequifi / CaptiveIQ)
13. Notifications (Twilio SMS + Email)
14. Screen-by-Screen Specification
15. API Route Architecture
16. Build Status & Remaining Work

---

## 1. EXECUTIVE SUMMARY

KinOS replaces Enerflo as KIN Home's primary sales platform. It is the system of record for deals from the moment a RepCard appointment lands through design, financing, contracting, and submission to the Quickbase operations team.

**What KinOS IS:**

- The deal lifecycle management platform (appointment → submission)
- The margin/pricing management layer
- The configurable deal submission gating engine
- The integration hub connecting RepCard, Aurora, lenders, doc signing, Quickbase, Arrivy, Sequifi, and Twilio
- The closer's post-sale visibility window (read from Quickbase, limited write-back actions)

**What KinOS IS NOT:**

- A canvassing tool (RepCard handles this)
- A design tool (Aurora handles this)
- A proposal generator (Aurora handles this — KinOS displays results)
- An operations/project management tool (Quickbase handles this — KinOS provides closer visibility)
- A field service scheduler (Arrivy handles this — KinOS integrates for site survey scheduling)

**Cost:** ~$40–150/month infrastructure vs. $7,000–15,000/month for Enerflo

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              Next.js 16 App Router (Vercel)                  │
│    ┌──────┬──────┬───────┬──────┬──────┬──────┬───────┐     │
│    │ Auth │ Dash │ Deals │Admin │ Docs │ Sub- │Portal │     │
│    │      │board │       │Panel │ign   │ mit  │       │     │
│    └──────┴──────┴───────┴──────┴──────┴──────┴───────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    SUPABASE BACKEND                           │
│  ┌────────────┬───────────────┬────────────┬──────────┐     │
│  │  Postgres  │  Auth (RLS)   │  Storage   │  Edge    │     │
│  │  Database  │  Row-Level    │  (Files/   │  Funcs   │     │
│  │            │  Security     │  Images)   │          │     │
│  └────────────┴───────────────┴────────────┴──────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   INTEGRATION LAYER                           │
│  ┌────────┬────────┬─────────┬────────┬─────────┬────────┐  │
│  │RepCard │Aurora  │Lender   │DocSign │Quick-   │Twilio  │  │
│  │Webhooks│Solar   │APIs     │APIs    │base     │SMS     │  │
│  │+ REST  │API     │(multi)  │(multi) │(bidir)  │        │  │
│  │        │        │         │        │Arrivy   │        │  │
│  │        │        │         │        │(surveys)│        │  │
│  └────────┴────────┴─────────┴────────┴─────────┴────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. DATA MODEL (COMPLETE POSTGRES SCHEMA)

### 3.1 Core Identity Tables

```sql
-- ============================================================
-- COMPANIES (Multi-tenant ready, single company for now)
-- ============================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- 'KIN Home'
  slug TEXT UNIQUE NOT NULL,                   -- 'kin-home'
  logo_url TEXT,
  website TEXT,
  industry TEXT DEFAULT 'Solar',
  repcard_company_id INTEGER,                  -- 2113 for KIN Home
  repcard_account_number TEXT,                 -- '9FNV6'
  quickbase_app_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- OFFICES & REGIONS
-- Offices are the primary organizational unit. Regions group offices.
-- Regional managers oversee multiple offices across states.
-- Maps to RepCard "location" field (e.g., "Bitton Region")
-- ============================================================
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  parent_office_id UUID REFERENCES offices(id), -- Regional parent (NULL = top-level region)
  name TEXT NOT NULL,                          -- 'Florida Office' or 'Bitton Region'
  office_type TEXT DEFAULT 'office' CHECK (office_type IN ('region', 'office')),
  repcard_office_name TEXT,                    -- exact match for RepCard mapping
  address TEXT,
  city TEXT,
  state TEXT,                                  -- State the office operates in
  zip TEXT,
  phone TEXT,
  installer_market_id UUID REFERENCES installer_markets(id), -- Default market for deals from this office
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_offices_parent ON offices(parent_office_id);

-- ============================================================
-- TEAMS
-- Maps to RepCard "team" field (e.g., "Bitton - Pensacola 2026")
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id),
  name TEXT NOT NULL,                          -- 'Bitton - Pensacola 2026'
  repcard_team_name TEXT,                      -- exact match for mapping
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Rookie - Setter', 'Area Director', etc.
  slug TEXT NOT NULL,                          -- 'rookie-setter', 'area-director'
  category TEXT NOT NULL CHECK (category IN ('setter', 'closer', 'manager', 'admin', 'owner')),
  permissions JSONB DEFAULT '{}',             -- granular permission flags
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USERS (Sales reps, managers, admins)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,                        -- Supabase Auth UUID
  company_id UUID NOT NULL REFERENCES companies(id),
  office_id UUID REFERENCES offices(id),
  team_id UUID REFERENCES teams(id),
  role_id UUID REFERENCES roles(id),

  -- Identity
  kin_id TEXT UNIQUE,                          -- KIN-generated unique ID (from onboarding platform)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country_code TEXT DEFAULT '+1',
  avatar_url TEXT,
  job_title TEXT,

  -- External System IDs
  repcard_user_id INTEGER UNIQUE,             -- RepCard user.id (e.g., 176783)
  repcard_badge_no TEXT,                       -- RepCard badge (e.g., '45PCM7')
  repcard_username TEXT,                       -- RepCard username
  sequifi_id TEXT,                             -- Sequifi rep ID
  captiveiq_id TEXT,                           -- CaptiveIQ rep ID
  quickbase_record_id TEXT,                    -- Quickbase user record

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,

  -- Profile Settings
  timezone TEXT DEFAULT 'America/New_York',
  sales_rep_license_number TEXT,               -- State license (compliance)

  -- Per-User Permission Overrides (admin-configurable, override base role)
  can_create_leads BOOLEAN DEFAULT true,
  is_view_only BOOLEAN DEFAULT false,          -- Overrides all edit permissions
  allow_design_requests BOOLEAN DEFAULT true,
  allow_manual_installs BOOLEAN DEFAULT true,
  can_create_change_orders BOOLEAN DEFAULT true,
  can_reassign_leads BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_repcard_id ON users(repcard_user_id);
CREATE INDEX idx_users_kin_id ON users(kin_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_team ON users(team_id);

-- ============================================================
-- SCHEMA DRIFT NOTE (as of 2026-02-12):
-- The live users table differs from this blueprint. The live schema
-- uses: auth_id, status ('invited'/'active'/'deactivated'), invited_at,
-- activated_at, deactivated_at, image_url, bio, license_state, license_expiry.
-- Missing from live (tracked for future migration):
--   kin_id, job_title, sequifi_id, captiveiq_id, quickbase_record_id, repcard_username
-- See docs/schema-reference.md for the authoritative live schema.
-- ============================================================
```

### 3.2 Lead & Deal Tables

```sql
-- ============================================================
-- CONTACTS (Homeowners / Leads from RepCard)
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),

  -- Identity
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country_code TEXT DEFAULT 'US',

  -- Address
  address TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  full_address TEXT GENERATED ALWAYS AS (
    COALESCE(address, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(zip, '')
  ) STORED,

  -- Ownership
  setter_id UUID REFERENCES users(id),        -- Rep who knocked the door / created lead
  owner_id UUID REFERENCES users(id),          -- Current owner (usually setter initially)

  -- External IDs
  repcard_contact_id INTEGER UNIQUE,           -- RepCard contact.id (e.g., 47832044)
  quickbase_record_id TEXT,                    -- Quickbase contact record
  enerflo_customer_id TEXT,                    -- Legacy Enerflo reference (for migration)

  -- RepCard Metadata
  repcard_status TEXT,                         -- Last known RepCard status
  contact_source TEXT,                         -- 'RepCard', 'Manual', 'API', 'Referral'
  contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN ('lead', 'customer', 'recruit', 'other')),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_repcard_id ON contacts(repcard_contact_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_setter ON contacts(setter_id);
CREATE INDEX idx_contacts_address ON contacts(state, city);

-- ============================================================
-- DEALS (The core entity — one deal per sales opportunity)
-- ============================================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),

  -- Deal Number (human-readable)
  deal_number TEXT UNIQUE NOT NULL,            -- Auto-generated: 'KIN-2026-00001'

  -- Ownership
  setter_id UUID REFERENCES users(id),         -- Rep who set the appointment
  closer_id UUID REFERENCES users(id),         -- Closer assigned to the deal
  office_id UUID REFERENCES offices(id),
  team_id UUID REFERENCES teams(id),

  -- Pipeline
  stage TEXT NOT NULL DEFAULT 'new_lead' CHECK (stage IN (
    'new_lead',           -- Just received from RepCard
    'appointment_set',    -- Appointment scheduled
    'appointment_sat',    -- Closer sat with homeowner
    'design_requested',   -- Design request sent to Aurora
    'design_complete',    -- Design received from Aurora
    'proposal_sent',      -- Proposal sent to homeowner
    'proposal_accepted',  -- Homeowner accepted proposal
    'financing_applied',  -- Lender application submitted
    'financing_approved', -- Lender approved
    'stips_pending',      -- Stipulations pending
    'stips_cleared',      -- All stips cleared
    'contract_sent',      -- Install agreement sent
    'contract_signed',    -- Install agreement signed
    'submission_ready',   -- All gates passed, ready to submit
    'submitted',          -- Submitted to Quickbase intake
    'intake_approved',    -- Intake team approved
    'intake_rejected',    -- Intake team rejected (needs fixes)
    'cancelled',          -- Deal cancelled
    'lost'                -- Deal lost
  )),
  stage_changed_at TIMESTAMPTZ DEFAULT now(),

  -- Appointment (from RepCard)
  repcard_appointment_id INTEGER,
  appointment_date TIMESTAMPTZ,
  appointment_end TIMESTAMPTZ,
  appointment_timezone TEXT,
  appointment_location TEXT,
  appointment_notes TEXT,
  appointment_outcome TEXT,                    -- RepCard disposition
  appointment_outcome_id INTEGER,

  -- Solar System Details
  system_size_kw DECIMAL(8,3),
  panel_count INTEGER,
  panel_model TEXT,
  inverter_model TEXT,
  battery_model TEXT,
  battery_count INTEGER DEFAULT 0,
  offset_percentage DECIMAL(5,2),
  annual_production_kwh DECIMAL(10,2),
  annual_usage_kwh DECIMAL(10,2),

  -- Pricing
  gross_price DECIMAL(12,2),                   -- Total system price before adders
  adders_total DECIMAL(10,2) DEFAULT 0,        -- Sum of all adders
  net_price DECIMAL(12,2),                     -- Final price (gross + adders - discounts)
  gross_ppw DECIMAL(8,4),                      -- Gross price per watt
  net_ppw DECIMAL(8,4),                        -- Net price per watt
  dealer_fee DECIMAL(10,2),                    -- Dealer fee amount
  dealer_fee_percentage DECIMAL(5,4),          -- Dealer fee as percentage
  commission_base DECIMAL(12,2),               -- Commission calculation base

  -- Financing
  lender_id UUID REFERENCES lenders(id),
  loan_product TEXT,                           -- Loan product name
  loan_amount DECIMAL(12,2),
  loan_term_months INTEGER,
  interest_rate DECIMAL(6,4),
  monthly_payment DECIMAL(10,2),
  financing_status TEXT CHECK (financing_status IN (
    NULL, 'not_started', 'application_sent', 'pending', 'approved',
    'conditionally_approved', 'stips_pending', 'stips_cleared',
    'denied', 'expired', 'cancelled'
  )),
  financing_application_id TEXT,               -- Lender's application reference
  financing_approved_at TIMESTAMPTZ,

  -- Document Signing
  install_agreement_status TEXT CHECK (install_agreement_status IN (
    NULL, 'not_sent', 'sent', 'viewed', 'signed', 'declined', 'expired'
  )),
  install_agreement_signed_at TIMESTAMPTZ,
  interconnection_agreement_status TEXT,
  interconnection_agreement_signed_at TIMESTAMPTZ,

  -- Submission
  submission_status TEXT CHECK (submission_status IN (
    NULL, 'not_ready', 'ready', 'submitted', 'approved', 'rejected'
  )),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  intake_reviewed_at TIMESTAMPTZ,
  intake_reviewed_by TEXT,                     -- Quickbase reviewer name
  rejection_reason TEXT,

  -- Aurora
  aurora_project_id TEXT,
  aurora_design_id TEXT,
  aurora_proposal_id TEXT,

  -- External IDs
  quickbase_deal_id TEXT,
  sequifi_deal_id TEXT,
  captiveiq_deal_id TEXT,
  enerflo_deal_id TEXT,                        -- Legacy reference

  -- Metadata
  source TEXT DEFAULT 'repcard',               -- 'repcard', 'manual', 'referral', 'self-gen'
  both_spouses_present BOOLEAN,
  is_new_construction BOOLEAN DEFAULT false,
  has_hoa BOOLEAN DEFAULT false,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_closer ON deals(closer_id);
CREATE INDEX idx_deals_setter ON deals(setter_id);
CREATE INDEX idx_deals_office ON deals(office_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_repcard_appt ON deals(repcard_appointment_id);
CREATE INDEX idx_deals_created ON deals(created_at);
CREATE INDEX idx_deals_company_stage ON deals(company_id, stage);
CREATE INDEX idx_deals_aurora ON deals(aurora_project_id);

-- ============================================================
-- DEAL STAGE HISTORY (Audit trail)
-- ============================================================
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

-- ============================================================
-- DEAL ADDERS (Value-adds and extras)
-- ============================================================
CREATE TABLE deal_adders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  adder_template_id UUID REFERENCES adder_templates(id),
  name TEXT NOT NULL,                          -- 'Main Panel Upgrade', 'Critter Guard', etc.
  amount DECIMAL(10,2) NOT NULL,               -- Dollar amount
  is_per_watt BOOLEAN DEFAULT false,           -- If true, amount is per-watt
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,                -- Calculated total
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Financing & Lender Tables

````sql
-- ============================================================
-- LENDERS
-- ============================================================
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'GoodLeap', 'LightReach', etc.
  slug TEXT NOT NULL,                          -- 'goodleap', 'lightreach'
  lender_type TEXT NOT NULL CHECK (lender_type IN ('loan', 'tpo', 'ppa', 'lease', 'cash')),
  api_provider TEXT,                           -- Integration class name
  api_base_url TEXT,
  api_credentials JSONB DEFAULT '{}',          -- Encrypted credentials
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LENDER PRODUCTS (Loan products, TPO offerings)
-- ============================================================
CREATE TABLE lender_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id),
  name TEXT NOT NULL,                          -- '25yr 1.49% / 7.99% Dealer Fee'
  product_code TEXT,                           -- Lender's product code
  term_months INTEGER,
  intro_rate DECIMAL(6,4),
  standard_rate DECIMAL(6,4),
  intro_period_months INTEGER,
  dealer_fee_percentage DECIMAL(6,4),          -- What lender charges
  kin_markup_percentage DECIMAL(6,4) DEFAULT 0, -- KIN's added markup (margin capture)
  effective_dealer_fee DECIMAL(6,4),           -- dealer_fee + kin_markup (what rep sees)
  tpo_escalator DECIMAL(5,3),                  -- Annual escalator for TPO
  tpo_tail_value DECIMAL(10,2),                -- Residual value for TPO
  min_fico INTEGER,
  min_system_size DECIMAL(6,2),
  max_system_size DECIMAL(6,2),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROPOSALS (Multiple per deal — each is a pricing/financing scenario)
-- The proposal is the pivot point of the deal. It combines a design,
-- adders, discounts, lender product, and calculates the total price.
-- Finalizing a proposal locks it and gates downstream steps
-- (financing application, contracting).
-- ============================================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- 'Proposal 1', 'Option A - Lease', etc.
  display_order INTEGER DEFAULT 0,

  -- Design Link
  aurora_design_id TEXT,                       -- Which Aurora design this proposal uses
  design_name TEXT,                            -- '5408 Siltstone St Design'

  -- System Summary (snapshot from design at proposal creation)
  system_size_kw DECIMAL(8,3),
  panel_count INTEGER,
  panel_model TEXT,
  panel_wattage INTEGER,                       -- e.g., 410W
  inverter_model TEXT,
  annual_production_kwh DECIMAL(10,2),
  annual_consumption_kwh DECIMAL(10,2),
  offset_percentage DECIMAL(6,2),

  -- Pricing (calculated)
  base_price DECIMAL(12,2),                    -- Base system price (before adders)
  base_ppw DECIMAL(8,4),                       -- Base price per watt
  adder_total DECIMAL(12,2) DEFAULT 0,         -- Sum of all adders
  adder_ppw DECIMAL(8,4) DEFAULT 0,            -- Adders as PPW
  discount_total DECIMAL(12,2) DEFAULT 0,      -- Sum of all discounts
  equipment_cost DECIMAL(12,2) DEFAULT 0,      -- Price-per-component total (if used)
  base_system_cost DECIMAL(12,2),              -- base + equipment + adders - discounts
  base_system_ppw DECIMAL(8,4),
  dealer_fee_amount DECIMAL(12,2) DEFAULT 0,   -- Dollar amount of dealer fee
  dealer_fee_ppw DECIMAL(8,4) DEFAULT 0,
  gross_cost DECIMAL(12,2),                    -- base_system_cost + dealer_fee
  gross_ppw DECIMAL(8,4),
  rebate_total DECIMAL(12,2) DEFAULT 0,        -- Net cost rebates
  net_cost DECIMAL(12,2),                      -- gross_cost - rebates
  net_ppw DECIMAL(8,4),

  -- Financing Selection
  lender_id UUID REFERENCES lenders(id),
  lender_product_id UUID REFERENCES lender_products(id),
  financing_method TEXT,                       -- Display: 'LightReach'
  financing_product_name TEXT,                 -- Display: 'LightReach Solar Lease - 2.99%'
  monthly_payment DECIMAL(10,2),
  escalator_percent DECIMAL(5,3),              -- TPO/PPA escalator (e.g., 2.99)
  rate_per_kwh DECIMAL(8,5),                   -- TPO/PPA rate (e.g., 0.115)
  epc_rate DECIMAL(8,4),                       -- Solar-only EPC rate ($/W)
  epc_total DECIMAL(12,2),                     -- Total EPC payment

  -- Dealer Fee Tracking (margin engine)
  lender_actual_dealer_fee DECIMAL(6,4),       -- What lender charges (hidden)
  sales_facing_dealer_fee DECIMAL(6,4),        -- What rep sees
  kin_margin_on_fee DECIMAL(6,4),              -- Delta = KIN's margin

  -- Rep Verification
  rep_lender_verified BOOLEAN DEFAULT false,   -- Rep is credentialed with this lender

  -- Optimus Template (LightReach-specific?)
  optimus_template TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',              -- Being configured, not yet ready
    'ready',              -- Complete but not finalized
    'finalized',          -- Locked — gates downstream steps
    'superseded'          -- Replaced by another finalized proposal
  )),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES users(id),
  unfinalized_at TIMESTAMPTZ,                  -- If unfinalized, when
  unfinalized_by UUID REFERENCES users(id),

  -- Aurora Sync
  aurora_proposal_id TEXT,                     -- Aurora's proposal ID if synced
  aurora_web_proposal_url TEXT,                -- Shareable web proposal link

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- ============================================================
-- PROPOSAL ADDERS (Adders applied to a specific proposal)
-- Separate from deal_adders because each proposal can have
-- different adders selected.
-- ============================================================
CREATE TABLE proposal_adders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  adder_template_id UUID REFERENCES adder_templates(id),
  name TEXT NOT NULL,
  pricing_type TEXT NOT NULL,                  -- 'fixed_amount', 'price_per_watt', etc.
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,
  ppw DECIMAL(8,4),                            -- This adder as price-per-watt
  is_auto_applied BOOLEAN DEFAULT false,
  is_customer_facing BOOLEAN DEFAULT true,
  eligible_for_itc BOOLEAN DEFAULT false,
  aurora_adder_id TEXT,                        -- ID in Aurora if synced
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposal_adders_proposal ON proposal_adders(proposal_id);

-- ============================================================
-- PROPOSAL DISCOUNTS
-- ============================================================
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

### 3.4 Equipment, Pricing & Adder Rules Engine

```sql
-- ============================================================
-- EQUIPMENT CATALOG (Reference catalog for pricing — Aurora is design SOT)
-- Maps Aurora equipment to internal cost/pricing data.
-- Aurora owns: what equipment goes in a design
-- KinOS owns: what it costs us, what we charge, margin
-- ============================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  category TEXT NOT NULL CHECK (category IN ('panel', 'inverter', 'battery', 'optimizer', 'other')),
  name TEXT NOT NULL,                          -- Display name: 'Enphase IQ8+'
  manufacturer TEXT NOT NULL,                  -- 'Enphase'
  model TEXT NOT NULL,                         -- 'IQ8PLUS-72-2-US'
  wattage DECIMAL(8,2),                        -- For panels (watts)
  capacity_kwh DECIMAL(8,2),                   -- For batteries
  efficiency DECIMAL(5,2),                     -- Percentage: 97.0
  ac_output_watts INTEGER,                     -- For inverters: 290
  is_micro BOOLEAN DEFAULT false,              -- Microinverter flag
  cost DECIMAL(10,2),                          -- Internal cost (what KIN pays)
  price DECIMAL(10,2),                         -- Customer-facing price
  spec_sheet_url TEXT,                         -- PDF spec sheet (stored in Supabase Storage)
  aurora_equipment_id TEXT,                    -- Maps to Aurora's equipment ID
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
  is_default BOOLEAN DEFAULT false,
  specs JSONB DEFAULT '{}',                    -- Additional specs as needed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EQUIPMENT MARKET AVAILABILITY
-- Aurora enables equipment account-wide; KinOS scopes to markets.
-- If no rows exist for an equipment item, it's available everywhere.
-- ============================================================
CREATE TABLE equipment_market_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  installer_market_id UUID NOT NULL REFERENCES installer_markets(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  override_cost DECIMAL(10,2),                 -- Market-specific cost override
  override_price DECIMAL(10,2),                -- Market-specific price override
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(equipment_id, installer_market_id)
);

-- ============================================================
-- AURORA SYNC LOG
-- Tracks all pricing/adder pushes to Aurora per design.
-- Enables audit trail and re-sync if needed.
-- ============================================================
CREATE TABLE aurora_pricing_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  aurora_design_id TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'pricing_push',       -- KinOS pushed PPW/flat price to Aurora
    'adder_push',         -- KinOS pushed adders to Aurora
    'adder_delete',       -- KinOS deleted adders from Aurora
    'pricing_pull',       -- KinOS read pricing from Aurora
    'full_sync'           -- Complete pricing + adder sync
  )),
  payload_sent JSONB DEFAULT '{}',             -- What we sent to Aurora
  response_received JSONB DEFAULT '{}',        -- What Aurora returned
  aurora_adder_ids TEXT[] DEFAULT '{}',         -- IDs of adders created in Aurora (for cleanup)
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  synced_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_aurora_sync_deal ON aurora_pricing_syncs(deal_id);

-- ============================================================
-- INSTALLER MARKETS (Geographic regions for pricing/adder scoping)
-- ============================================================
CREATE TABLE installer_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Florida - COM', 'CA', 'DFW', etc.
  states TEXT[] DEFAULT '{}',                  -- States included: ['FL','GA']
  cities TEXT[] DEFAULT '{}',                  -- Specific cities (optional)
  zipcodes TEXT[] DEFAULT '{}',                -- Specific zips (optional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRICING CONFIGURATIONS
-- ============================================================
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Standard Pricing Q1 2026'
  base_ppw DECIMAL(8,4),                       -- Base price per watt
  min_ppw DECIMAL(8,4),                        -- Floor (reps can't go below)
  max_ppw DECIMAL(8,4),                        -- Ceiling
  buffer_percentage DECIMAL(5,4) DEFAULT 0,    -- Markup buffer
  is_active BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  expires_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADDER TEMPLATES (Configurable adders with rules engine)
-- ============================================================
CREATE TABLE adder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Main Panel Upgrade'
  description TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN (
    'fixed_amount',       -- Flat dollar amount (e.g., $2000)
    'price_per_watt',     -- Per-watt amount (e.g., $0.25/W)
    'custom'              -- Custom calculation / manual entry
  )),
  default_amount DECIMAL(10,2),                -- Default value ($ or $/W depending on type)
  category TEXT,                               -- 'electrical', 'structural', 'site', 'roof', etc.
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADDER SCOPING RULES (Which adders apply where)
-- An adder can have multiple rules; if ANY rule matches, the adder is available.
-- Empty scope = available everywhere.
-- ============================================================
CREATE TABLE adder_scope_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adder_template_id UUID NOT NULL REFERENCES adder_templates(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN (
    'market',             -- Applies in specific installer markets
    'state',              -- Applies in specific states
    'city',               -- Applies in specific cities
    'zipcode',            -- Applies in specific zipcodes
    'equipment',          -- Applies when specific equipment is used
    'deal_template',      -- Applies to specific deal types
    'sales_team',         -- Applies to specific sales teams
    'lender'              -- Applies with specific lender
  )),
  scope_values TEXT[] NOT NULL,                -- Array of matching values
  -- Examples:
  -- market: ['CA', 'Arizona']
  -- state: ['FL', 'TX']
  -- equipment: ['enphase-iq8plus', 'solaredge-se7600']
  -- deal_template: ['solar_loan', 'solar_tpo']
  -- sales_team: ['Bitton - Pensacola 2026']
  is_required BOOLEAN DEFAULT false,           -- If true, auto-add when rule matches
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_adder_rules_template ON adder_scope_rules(adder_template_id);

-- ============================================================
-- DEAL ADDERS (Adders applied to a specific deal)
-- ============================================================
CREATE TABLE deal_adders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  adder_template_id UUID REFERENCES adder_templates(id),
  name TEXT NOT NULL,
  pricing_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,               -- Dollar amount or per-watt rate
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,                -- Calculated: amount * quantity (or amount * system_kw * 1000 for PPW)
  is_auto_applied BOOLEAN DEFAULT false,       -- True if applied by rules engine
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
````

### 3.5 Financing & Lender Tables (Expanded)

```sql
-- ============================================================
-- LENDERS (Finance Options)
-- Each entry = a finance option as it appears to reps
-- e.g., "GoodLeap (Loans)" and "GoodLeap (TPO)" are separate entries
-- ============================================================
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'GoodLeap (Loans)', 'Dividend', 'Kin Capital'
  slug TEXT NOT NULL,                          -- 'goodleap-loans', 'dividend'
  lender_type TEXT NOT NULL CHECK (lender_type IN (
    'loan', 'tpo', 'ppa', 'lease', 'cash', 'direct_pay', 'non_integrated'
  )),
  is_integrated BOOLEAN DEFAULT true,          -- API-integrated vs manual/non-integrated
  api_provider TEXT,                           -- Integration class: 'GoodLeapProvider', etc.
  api_base_url TEXT,
  api_credentials JSONB DEFAULT '{}',          -- Encrypted credentials reference
  sync_enabled BOOLEAN DEFAULT false,          -- Auto-sync products from lender API
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LENDER PRODUCTS (110+ per lender is normal — e.g., Dividend)
-- Products may sync from lender API or be manually configured
-- ============================================================
CREATE TABLE lender_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id),

  -- Identity
  name TEXT NOT NULL,                          -- Sales-facing: 'Level - 10 years - 3.99%'
  internal_name TEXT,                          -- Lender's original name (if renamed)
  product_code TEXT,                           -- Lender's product code/ID

  -- Terms
  term_months INTEGER,                         -- 120 (10 years), 300 (25 years), etc.
  intro_rate DECIMAL(6,4),                     -- Intro/teaser rate
  standard_rate DECIMAL(6,4),                  -- Standard rate after intro period
  intro_period_months INTEGER,

  -- Dealer Fees (the margin engine)
  lender_dealer_fee DECIMAL(6,4),              -- What the lender actually charges (hidden)
  sales_facing_dealer_fee DECIMAL(6,4),        -- What the rep sees (lender fee + KIN markup)
  kin_markup DECIMAL(6,4) GENERATED ALWAYS AS (
    sales_facing_dealer_fee - lender_dealer_fee
  ) STORED,                                    -- Delta = KIN's margin (for accounting)

  -- TPO-specific
  tpo_escalator DECIMAL(5,3),
  tpo_ppw DECIMAL(8,4),
  tpo_tail_value DECIMAL(10,2),

  -- Availability
  available_states TEXT[] DEFAULT '{}',         -- States where product is available
  min_fico INTEGER,
  min_system_size DECIMAL(6,2),
  max_system_size DECIMAL(6,2),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_synced BOOLEAN DEFAULT false,             -- True if auto-synced from lender API
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lender_products_lender ON lender_products(lender_id);
CREATE INDEX idx_lender_products_status ON lender_products(status);
CREATE INDEX idx_lender_products_states ON lender_products USING GIN(available_states);

-- ============================================================
-- FINANCING APPLICATIONS
-- ============================================================
CREATE TABLE financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  proposal_id UUID REFERENCES proposals(id),   -- Which finalized proposal this app is for
  lender_id UUID NOT NULL REFERENCES lenders(id),
  lender_product_id UUID REFERENCES lender_products(id),

  -- Application
  application_id TEXT,                         -- Lender's reference ID
  application_url TEXT,                        -- Link to lender portal
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'pending', 'approved', 'conditionally_approved',
    'denied', 'expired', 'cancelled', 'error'
  )),
  status_detail TEXT,
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,

  -- Approval Details
  approved_amount DECIMAL(12,2),
  approved_term_months INTEGER,
  approved_rate DECIMAL(6,4),
  approved_monthly_payment DECIMAL(10,2),

  -- Dealer Fee Tracking (for accounting)
  lender_dealer_fee_applied DECIMAL(6,4),      -- Actual lender fee at time of application
  sales_facing_fee_applied DECIMAL(6,4),       -- What rep saw
  kin_margin_amount DECIMAL(10,2),             -- Dollar amount of KIN's margin on this deal

  -- Stips
  stips JSONB DEFAULT '[]',
  stips_cleared BOOLEAN DEFAULT false,
  stips_cleared_at TIMESTAMPTZ,

  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_financing_deal ON financing_applications(deal_id);
CREATE INDEX idx_financing_status ON financing_applications(status);
```

### 3.7 Document Signing

```sql
-- ============================================================
-- DOCUMENT TEMPLATES (Admin-configurable)
-- ============================================================
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'KIN Install Agreement'
  description TEXT,
  template_key TEXT UNIQUE NOT NULL,           -- 'kin_install_agreement_v2'
  signing_provider TEXT,                       -- 'docusign', 'pandadoc', 'signnow', 'boldsign'
  provider_template_id TEXT,                   -- Template ID in signing provider
  required_for_stages TEXT[] DEFAULT '{}',     -- Stages where this doc is required
  required_for_deal_types TEXT[] DEFAULT '{}', -- Deal types: 'solar_loan', 'solar_tpo', etc.
  field_mappings JSONB DEFAULT '{}',           -- Map deal fields → template fields
  signing_order JSONB DEFAULT '[]',            -- Order of signers
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DOCUMENT ENVELOPES (Sent signing packages)
-- ============================================================
CREATE TABLE document_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  template_id UUID NOT NULL REFERENCES document_templates(id),
  provider TEXT NOT NULL,                      -- 'docusign', 'pandadoc', etc.
  provider_envelope_id TEXT,                   -- Provider's envelope/document ID
  provider_url TEXT,                           -- Link to view in provider
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'sent', 'delivered', 'viewed', 'signed',
    'declined', 'voided', 'expired', 'error'
  )),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signers JSONB DEFAULT '[]',                  -- Array of signer status objects
  completed_document_url TEXT,                 -- Signed document download URL
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_envelopes_deal ON document_envelopes(deal_id);
CREATE INDEX idx_envelopes_status ON document_envelopes(status);
```

### 3.8 Gating / Submission Workflow

```sql
-- ============================================================
-- GATE DEFINITIONS (Admin-configurable submission requirements)
-- ============================================================
CREATE TABLE gate_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Utility Bill Uploaded'
  description TEXT,
  gate_type TEXT NOT NULL CHECK (gate_type IN (
    'document_signed',    -- A specific document must be signed
    'file_uploaded',      -- A file must be uploaded (e.g., utility bill)
    'field_required',     -- A deal field must have a value
    'checkbox',           -- Manual checkbox verification
    'question',           -- Question requiring an answer
    'external_status',    -- Status from external system (e.g., CallPilot call complete)
    'financing_status',   -- Financing must be in certain status
    'stage_reached'       -- Deal must have reached a certain stage
  )),
  config JSONB NOT NULL DEFAULT '{}',          -- Type-specific configuration
  -- Examples:
  -- document_signed: { "template_key": "kin_install_agreement_v2" }
  -- file_uploaded:   { "file_type": "utility_bill", "accepted_formats": ["pdf","jpg","png"] }
  -- field_required:  { "field_name": "system_size_kw" }
  -- checkbox:        { "label": "Site survey scheduled with customer" }
  -- question:        { "question": "Any additional work needed?", "answer_type": "text" }
  -- external_status: { "system": "callpilot", "status": "completed" }
  -- financing_status:{ "required_status": ["approved","stips_cleared"] }

  applies_to_deal_types TEXT[] DEFAULT '{}',   -- Empty = all deal types
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GATE COMPLETIONS (Per-deal tracking of gate status)
-- ============================================================
CREATE TABLE gate_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  gate_definition_id UUID NOT NULL REFERENCES gate_definitions(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  value TEXT,                                  -- Answer for questions, notes for checkboxes
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, gate_definition_id)
);

CREATE INDEX idx_gates_deal ON gate_completions(deal_id);
```

### 3.9 Attachments & Files

```sql
-- ============================================================
-- ATTACHMENTS (Files associated with deals, contacts, etc.)
-- ============================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),

  -- Polymorphic association
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'contact', 'financing', 'gate')),
  entity_id UUID NOT NULL,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT,                              -- 'utility_bill', 'photo_id', 'contract', 'other'
  mime_type TEXT,
  file_size_bytes INTEGER,
  storage_path TEXT NOT NULL,                  -- Supabase Storage path
  public_url TEXT,                             -- Public URL if applicable
  source_url TEXT,                             -- Original URL (e.g., RepCard S3 URL)

  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  source TEXT DEFAULT 'upload',                -- 'upload', 'repcard', 'aurora', 'lender'
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_type ON attachments(file_type);
```

### 3.10 Webhook & Integration Logging

```sql
-- ============================================================
-- WEBHOOK EVENTS (Inbound webhook log)
-- ============================================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                        -- 'repcard', 'aurora', 'lender', 'signing'
  event_type TEXT NOT NULL,                    -- 'appointment_set', 'appointment_outcome', etc.
  payload JSONB NOT NULL,                      -- Full raw payload
  headers JSONB DEFAULT '{}',                  -- Request headers
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
-- INTEGRATION SYNC LOG (Outbound API calls)
-- ============================================================
CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL,                        -- 'quickbase', 'aurora', 'sequifi', 'twilio'
  action TEXT NOT NULL,                        -- 'create_project', 'push_deal', 'send_sms'
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
```

### 3.11 Activity & Notifications

```sql
-- ============================================================
-- ACTIVITY LOG (Deal timeline / feed)
-- ============================================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,                 -- 'stage_change', 'note_added', 'document_sent', etc.
  title TEXT NOT NULL,                         -- 'Deal moved to Design Requested'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_deal ON activities(deal_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  deal_id UUID REFERENCES deals(id),
  type TEXT NOT NULL,                          -- 'new_appointment', 'deal_update', 'stip_required', etc.
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,                             -- Deep link to relevant page
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

## 4. AUTHENTICATION & ACCOUNT MANAGEMENT

### 4.1 How Users Get Access

There is NO self-registration. KinOS is an internal company tool. Users get access
through one of these paths:

**Path A: Admin Creates Account (Primary)**

1. Admin (or manager) goes to Admin Panel → Users → "Add User"
2. Enters first name, last name, email, phone, office, team, role
3. System creates Supabase Auth account + KinOS user record
4. User receives email invite with link to set password
5. On first login, user sets password and is active

**Path B: Auto-Provisioned from KIN Onboarding Platform (Future)**

1. New rep completes onboarding on KIN's onboarding platform
2. Onboarding platform assigns KIN ID
3. Onboarding platform calls KinOS API to create user account
4. User receives email invite
5. KIN ID is stored on user record, pushed to RepCard externalId

**Path C: Bulk Import (Initial Migration)**

1. Admin uploads CSV of existing users
2. System creates accounts in batch
3. All users receive email invites

### 4.2 Auth Strategy

Supabase Auth with email/password. Magic link optional. SSO can be added later.

```
Login flow:
  Email + Password → Supabase Auth → JWT → RLS policies enforce access

Password reset:
  User clicks "Forgot Password" → email with reset link → set new password

Session management:
  JWT tokens with refresh. Auto-logout after 24h inactivity.
  Multiple devices supported (rep on phone + laptop).
```

### 4.3 User Lifecycle

```
INVITED → ACTIVE → DEACTIVATED (can be reactivated)
                 → REMOVED (contacts reassigned, account disabled)

States:
- Invited: Account created, hasn't logged in yet
- Active: Normal access
- Deactivated: Can't log in, deals still visible, can be reactivated
- Removed: Contacts/deals reassigned to another user, account permanently disabled
```

Deactivation/removal mirrors RepCard's model:

- When a user is deactivated in KinOS, optionally deactivate in RepCard via API
- When removing a user, admin must reassign their contacts and deals (same as RepCard's
  "Remove User" flow which requires assignContact, leadToUser, customerToUser, etc.)

### 4.4 Account Management (Admin Panel → Users)

**User List View:**

- Filterable by office, team, role, status (active/inactive)
- Search by name, email, KIN ID
- Bulk actions: activate, deactivate, change office/team

**User Detail / Edit:**

- Personal info: name, email, phone, avatar
- Company info: office, team, role, job title
- External IDs: KIN ID, RepCard user ID, RepCard badge, Sequifi ID (read-only display)
- Status: Active/Deactivated toggle
- Permissions: inherited from role, can add per-user overrides
- Activity: recent login, deal count, last activity

**User Creation Form:**

- First name, last name (required)
- Email (required, must be unique)
- Phone + country code (required)
- Office (required, dropdown)
- Team (required, dropdown filtered by selected office)
- Role (required, dropdown)
- Job title (optional)
- KIN ID (auto-generated or manually entered)
- "Send invite email" checkbox (default: on)

### 4.5 Deal-Level Access Control & Row-Level Security

**Deal Access Philosophy:**
Access is based on deal assignment, not just role. This protects deal integrity —
only the assigned closer can make changes to their deal. Others get read-only
access based on their relationship to the deal or their role.

```sql
-- ============================================================
-- REP-LENDER CREDENTIALS (Per-user, per-lender)
-- Each rep stores their own login/email/ID for each lender.
-- Some lenders require the rep's own credentials when submitting
-- financing applications (e.g., LightReach wants the rep's email).
-- ============================================================
CREATE TABLE user_lender_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,

  -- Credentials (varies by lender)
  lender_username TEXT,                        -- Rep's login for this lender
  lender_email TEXT,                           -- Rep's email at this lender
  lender_rep_id TEXT,                          -- Rep's ID in the lender's system

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,

  -- Overflow for lender-specific fields
  extra_credentials JSONB DEFAULT '{}',        -- e.g., {"enfin_login": "...", "api_token": "..."}

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lender_id)
);

CREATE INDEX idx_user_lender_creds ON user_lender_credentials(user_id, lender_id);

-- ============================================================
-- USER INTEGRATION SETTINGS (Non-lender integrations per user)
-- Aurora username, Callpilot API key, etc.
-- ============================================================
CREATE TABLE user_integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,               -- 'aurora', 'callpilot', 'solo', etc.
  settings JSONB NOT NULL DEFAULT '{}',
  -- Aurora: {"aurora_username": "austin@kinhome.com"}
  -- Callpilot: {"api_key_name": "Callpilot", "api_key_prefix": "b482"}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEAL ACCESS: WHO CAN SEE WHAT
-- ============================================================

-- Assigned closer: full read/write access to their deals
CREATE POLICY "closer_full_access" ON deals
  FOR ALL USING (
    closer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Assigned setter: read-only access to deals they set
CREATE POLICY "setter_read_access" ON deals
  FOR SELECT USING (
    setter_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Office manager/leader: read-only access to all deals in their office
CREATE POLICY "manager_office_read" ON deals
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE auth_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_id = auth.uid()
      AND r.category IN ('manager')
    )
  );

-- Regional manager: read-only access to deals in all offices under their region
CREATE POLICY "regional_manager_read" ON deals
  FOR SELECT USING (
    office_id IN (
      SELECT o.id FROM offices o
      WHERE o.parent_office_id IN (
        SELECT office_id FROM users WHERE auth_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_id = auth.uid()
      AND r.category IN ('regional_manager')
    )
  );

-- Admin/Owner: full access to all deals company-wide
CREATE POLICY "admin_full_access" ON deals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_id = auth.uid()
      AND r.category IN ('admin', 'owner')
      AND u.company_id = deals.company_id
    )
  );

-- ============================================================
-- PROPOSAL ACCESS: Inherits from deal access
-- ============================================================
CREATE POLICY "proposal_access" ON proposals
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals)  -- RLS on deals cascades
  );

-- ============================================================
-- DEAL WRITE PROTECTION (Application-Level Enforcement)
-- RLS handles visibility. These rules are enforced in the API layer:
--
-- 1. ONLY the assigned closer can:
--    - Edit deal details
--    - Create/edit/finalize proposals
--    - Submit financing applications
--    - Send contracts for signing
--    - Submit deal to intake
--
-- 2. ONLY admin/owner can:
--    - Override closer restriction (emergency edits)
--    - Reassign a deal to a different closer
--    - Unfinalize a proposal that's already been submitted
--
-- 3. Setter can:
--    - View deal progress (read-only)
--    - See their setter commission status
--
-- 4. Manager can:
--    - View all deals in their office (read-only)
--    - Run reports on office deals
--    - Cannot edit deals they don't own
--
-- Implementation: API middleware checks deal.closer_id against
-- authenticated user before allowing any mutation.
-- ============================================================
```

**Proposal Finalization Guards (Application-Level):**

```typescript
async function finalizeProposal(proposalId: string, userId: string) {
  const proposal = await getProposalWithDeal(proposalId);
  const user = await getUser(userId);
  const deal = proposal.deal;

  // 1. Only assigned closer can finalize (or admin override)
  if (deal.closer_id !== userId && !user.role.isAdmin) {
    throw new ForbiddenError("Only the assigned closer can finalize proposals");
  }

  // 2. Check rep is credentialed with the selected lender
  if (proposal.lender_id) {
    const cred = await getUserLenderCredential(userId, proposal.lender_id);
    if (!cred?.is_verified) {
      throw new ValidationError(
        `You are not verified to sell ${proposal.financing_method}. ` +
          `Contact your admin to get credentialed.`,
      );
    }
  }

  // 3. Validate proposal is complete
  validateProposalComplete(proposal); // design, pricing, lender selected

  // 4. Supersede any previously finalized proposal on this deal
  await supersedePreviousProposals(deal.id);

  // 5. Finalize
  await updateProposal(proposalId, {
    status: "finalized",
    finalized_at: new Date(),
    finalized_by: userId,
    rep_lender_verified: true,
  });

  // 6. Sync pricing to Aurora (so proposal/financing is accurate)
  await syncPricingToAurora(deal.id);

  // 7. Advance deal workflow
  await completeWorkflowStep(deal.id, "proposal");
}
```

### 4.6 Role Permission Matrix

**Deal-Level Permissions (per-deal, based on assignment):**

| Permission            | Setter (on their deal) | Closer (on their deal) | Manager (office deals) | Admin       | Owner       |
| --------------------- | ---------------------- | ---------------------- | ---------------------- | ----------- | ----------- |
| View deal             | ✅ read-only           | ✅                     | ✅ read-only           | ✅          | ✅          |
| Edit deal details     | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Create/edit proposals | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Finalize proposal     | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Submit financing      | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Send contracts        | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Submit to intake      | ❌                     | ✅                     | ❌                     | ✅ override | ✅ override |
| Request design        | ❌                     | ✅                     | ❌                     | ✅          | ✅          |
| Self-design (Aurora)  | ❌                     | ✅                     | ❌                     | ✅          | ✅          |
| Reassign deal         | ❌                     | ❌                     | ❌                     | ✅          | ✅          |
| View unassigned deals | ❌                     | ❌                     | ✅ office only         | ✅          | ✅          |

**System-Level Permissions (not deal-specific):**

| Permission              | Setter | Closer | Manager | Admin | Owner |
| ----------------------- | ------ | ------ | ------- | ----- | ----- |
| Configure pricing       | ❌     | ❌     | ❌      | ✅    | ✅    |
| Manage adder rules      | ❌     | ❌     | ❌      | ✅    | ✅    |
| Manage gates            | ❌     | ❌     | ❌      | ✅    | ✅    |
| Manage users            | ❌     | ❌     | ✅\*    | ✅    | ✅    |
| Manage lenders          | ❌     | ❌     | ❌      | ✅    | ✅    |
| Manage equipment        | ❌     | ❌     | ❌      | ✅    | ✅    |
| Manage rep-lender creds | ❌     | ❌     | ✅\*    | ✅    | ✅    |
| View reports            | ❌     | ❌     | ✅      | ✅    | ✅    |
| Manage company          | ❌     | ❌     | ❌      | ❌    | ✅    |

\*Managers can manage users and credentials within their own office only.

### 4.7 Lender Configuration (Admin Panel → Lenders)

Admins configure which lenders are available and how pricing works:

**Lender List:**

- Active lenders with status indicators
- Toggle lender on/off without deleting configuration
- Display order (controls how lenders appear in deal financing tab)

**Lender Detail / Edit:**

- Name, logo, lender type (loan/tpo/ppa/lease/cash)
- API credentials (encrypted, masked display)
- API base URL and provider class

**Lender Products (nested under lender):**

- Product name, code, term, rates
- Dealer fee percentage (what lender charges)
- KIN markup percentage (KIN's margin on top)
- Effective dealer fee (dealer_fee + kin_markup — what the rep sees)
- Min/max system size, min FICO
- Active/inactive toggle
- Display order

This is the margin management engine. Admin sets the KIN markup, and the system
automatically calculates effective dealer fees. Reps only see the final number.
The split between lender fee and KIN markup is invisible to them.

---

## 5. REPCARD INTEGRATION

### 5.1 Webhook Receiver

Single endpoint handles all 7 RepCard webhook events:

**Endpoint:** `POST /api/webhooks/repcard`

```typescript
// app/api/webhooks/repcard/route.ts

type RepCardWebhookEvent =
  | "appointment_set"
  | "appointment_update"
  | "appointment_outcome"
  | "closer_update"
  | "door_knocked"
  | "contact_type_changed"
  | "status_changed";

export async function POST(req: Request) {
  const payload = await req.json();
  const eventType = identifyEventType(payload);

  // 1. Log raw webhook
  await logWebhookEvent("repcard", eventType, payload);

  // 2. Route to handler
  switch (eventType) {
    case "appointment_set":
      return handleAppointmentSet(payload);
    case "appointment_update":
      return handleAppointmentUpdate(payload);
    case "appointment_outcome":
      return handleAppointmentOutcome(payload);
    case "closer_update":
      return handleCloserUpdate(payload);
    case "status_changed":
      return handleStatusChanged(payload);
    case "contact_type_changed":
      return handleContactTypeChanged(payload);
    case "door_knocked":
      return handleDoorKnocked(payload);
  }
}
```

### 5.2 Appointment Set Handler (Primary Ingest)

This is the most critical handler — it creates deals from RepCard appointments.

```typescript
async function handleAppointmentSet(payload: RepCardAppointmentPayload) {
  // 1. Resolve or create SETTER
  const setter = await upsertUserFromRepCard(payload.user, "setter");

  // 2. Resolve or create CLOSER
  const closer = await upsertUserFromRepCard(payload.closer, "closer");

  // 3. Resolve or create CONTACT
  const contact = await upsertContact({
    repcard_contact_id: payload.contact.id,
    first_name: payload.contact.firstName,
    last_name: payload.contact.lastName,
    email: payload.contact.email,
    phone: payload.contact.phoneNumber,
    address: payload.contact.address,
    city: payload.contact.city,
    state: payload.contact.state,
    zip: payload.contact.zip,
    latitude: payload.contact.latitude,
    longitude: payload.contact.longitude,
    notes: payload.contact.notes,
    setter_id: setter.id,
    repcard_status: payload.contact.status,
    contact_source: "RepCard",
  });

  // 4. Create DEAL
  const deal = await createDeal({
    contact_id: contact.id,
    setter_id: setter.id,
    closer_id: closer.id,
    office_id: await resolveOffice(payload.closer.location),
    team_id: await resolveTeam(payload.closer.team),
    stage: "appointment_set",
    repcard_appointment_id: payload.id,
    appointment_date: parseAppointmentTime(payload),
    appointment_end: parseAppointmentEndTime(payload),
    appointment_timezone: payload.start_at_timezone,
    appointment_location: payload.appointment_location,
    appointment_notes: payload.notes,
    both_spouses_present: payload.contact.both_spouses_present,
    system_size_kw: payload.contact.system_size_kw,
    gross_price: payload.contact.gross_price,
    net_price: payload.contact.net_price,
    gross_ppw: payload.contact.gross_ppw,
    net_ppw: payload.contact.net_ppw,
    source: "repcard",
  });

  // 5. Ingest ATTACHMENTS (utility bills, photos)
  if (payload.appointment_attachment?.length > 0) {
    for (const url of payload.appointment_attachment) {
      await ingestAttachmentFromUrl(url, deal.id, "deal", "repcard");
    }
  }

  // 6. Initialize GATE COMPLETIONS for this deal
  await initializeGatesForDeal(deal.id);

  // 7. Create ACTIVITY log entry
  await createActivity(
    deal.id,
    "deal_created",
    "New deal created from RepCard appointment",
    { setter: setter.name, closer: closer.name },
  );

  // 8. Send NOTIFICATION to closer
  await notifyUser(
    closer.id,
    "new_appointment",
    `New appointment: ${contact.first_name} ${contact.last_name}`,
    `${payload.appt_start_time_local_pretty} at ${payload.appointment_location}`,
  );

  // 9. Trigger SMS via Twilio (if configured)
  await sendAppointmentConfirmationSMS(deal, contact, closer);

  return NextResponse.json({ success: true, deal_id: deal.id });
}
```

### 5.3 RepCard Field Mapping (Webhook → Database)

| RepCard Webhook Field          | KinOS Table          | KinOS Column                   |
| ------------------------------ | -------------------- | ------------------------------ |
| `id`                           | deals                | repcard_appointment_id         |
| `contact.id`                   | contacts             | repcard_contact_id             |
| `contact.firstName`            | contacts             | first_name                     |
| `contact.lastName`             | contacts             | last_name                      |
| `contact.email`                | contacts             | email                          |
| `contact.phoneNumber`          | contacts             | phone                          |
| `contact.address`              | contacts             | address                        |
| `contact.city`                 | contacts             | city                           |
| `contact.state`                | contacts             | state                          |
| `contact.zip`                  | contacts             | zip                            |
| `contact.latitude`             | contacts             | latitude                       |
| `contact.longitude`            | contacts             | longitude                      |
| `contact.notes`                | contacts             | notes                          |
| `contact.status`               | contacts             | repcard_status                 |
| `contact.both_spouses_present` | deals                | both_spouses_present           |
| `contact.system_size_kw`       | deals                | system_size_kw                 |
| `contact.gross_price`          | deals                | gross_price                    |
| `contact.net_price`            | deals                | net_price                      |
| `contact.gross_ppw`            | deals                | gross_ppw                      |
| `contact.net_ppw`              | deals                | net_ppw                        |
| `contact.qb_record_id`         | contacts             | quickbase_record_id            |
| `contact.owner.id`             | contacts → setter_id | (resolved via repcard_user_id) |
| `user.id`                      | users                | repcard_user_id (setter)       |
| `user.firstName/lastName`      | users                | first_name/last_name           |
| `user.email`                   | users                | email                          |
| `user.role`                    | users → role_id      | (resolved via role name)       |
| `user.location`                | users → office_id    | (resolved via office name)     |
| `user.team`                    | users → team_id      | (resolved via team name)       |
| `user.badgeNo`                 | users                | repcard_badge_no               |
| `closer.id`                    | users                | repcard_user_id (closer)       |
| `closer.*`                     | users                | (same pattern as user)         |
| `appointment_location`         | deals                | appointment_location           |
| `appt_start_time_local`        | deals                | appointment_date               |
| `appt_end_time_local`          | deals                | appointment_end                |
| `start_at_timezone`            | deals                | appointment_timezone           |
| `notes`                        | deals                | appointment_notes              |
| `appointment_attachment[]`     | attachments          | source_url                     |
| `appointment_status_id`        | deals                | appointment_outcome_id         |
| `appointment_status_title`     | deals                | appointment_outcome            |

### 5.4 Two-Way Sync Operations

**KinOS → RepCard (write-back):**

- Update appointment outcome: `POST /api/appointments/set-outcome`
- Update customer status: via Customer Status API
- Sync KIN ID to RepCard user `externalId`: `PUT /api/users/{id}`

**RepCard → KinOS (inbound webhooks):**

- All 7 webhook events listed above

---

## 6. AURORA SOLAR INTEGRATION (✅ COMPLETE — Epic 6)

### 6.1 Integration Strategy: Fully Automated, No Iframe

Aurora cannot be embedded/iframed into external platforms. Their embed program works
in the opposite direction (they iframe YOUR app inside Aurora). This is the same for
every CRM that integrates with Aurora — Salesforce, HubSpot, Enerflo, all of them.

KinOS improves on the current Enerflo workflow (manual handoff to design team, manual
import back) by automating both directions via Aurora's API + webhooks:

```
CURRENT (Enerflo - Manual):
  Closer requests design → someone manually creates Aurora project →
  design team builds it → someone manually imports results back into Enerflo deal

KINOS (Automated):
  Closer clicks "Request Design" →
    → KinOS auto-creates Aurora project via API (all customer data pre-filled)
    → Design team sees it in their Aurora queue immediately
    → Design team works in Aurora (their normal workflow, unchanged)
    → Aurora webhook fires on design complete
    → KinOS auto-pulls design data via API (system size, panels, production, pricing)
    → Deal auto-advances to "Design Complete"
    → Closer sees all design outputs in KinOS deal page (no Aurora login needed)
    → If closer wants to show homeowner the 3D model/proposal → "Open in Aurora" button
```

**What each role sees:**

- **Closer:** Everything in KinOS. Design outputs (system size, production, pricing,
  panel layout image) displayed directly on the deal detail page. One-click "Open in
  Aurora" button only for presenting the interactive 3D proposal to homeowners.
- **Design team:** Works entirely in Aurora as they do today. Projects just show up
  automatically with all data pre-filled instead of being manually created.
- **Managers/Admins:** Design status visible on every deal in KinOS. No need to check
  Aurora separately.

### 6.2 Key Aurora API Endpoints

| Action                     | Method | Endpoint                                            | When                                                 |
| -------------------------- | ------ | --------------------------------------------------- | ---------------------------------------------------- |
| Create project             | POST   | /tenants/{tid}/projects                             | Closer clicks "Request Design"                       |
| Create consumption profile | POST   | /tenants/{tid}/projects/{pid}/consumption_profiles  | With project creation (utility data)                 |
| Create design request      | POST   | /tenants/{tid}/projects/{pid}/design_requests       | After consumption profile                            |
| Get designs                | GET    | /tenants/{tid}/projects/{pid}/designs               | On webhook or poll                                   |
| Get design summary         | GET    | /tenants/{tid}/designs/{did}/summary                | After design complete                                |
| Get design assets          | GET    | /tenants/{tid}/designs/{did}/assets                 | Pull panel layout image                              |
| Get pricing                | GET    | /tenants/{tid}/projects/{pid}/designs/{did}/pricing | After design complete                                |
| Get financings             | GET    | /tenants/{tid}/projects/{pid}/financings            | After pricing configured                             |
| Get agreements             | GET    | /tenants/{tid}/projects/{pid}/agreements            | After proposal sent                                  |
| Get project web proposal   | GET    | /tenants/{tid}/projects/{pid}/web_proposals         | Generate shareable proposal URL                      |
| Webhooks                   | —      | Configured in Aurora                                | design_complete, proposal_accepted, agreement_signed |

### 6.3 Aurora Project Auto-Creation (on "Request Design")

```typescript
async function requestDesign(dealId: string, requestedBy: string) {
  const deal = await getDealWithContact(dealId);
  const contact = deal.contact;

  // 1. Create Aurora project with all customer data pre-filled
  const project = await auroraApi.post(`/tenants/${TENANT_ID}/projects`, {
    name: `${contact.first_name} ${contact.last_name} - ${deal.deal_number}`,
    customer: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
    },
    location: {
      street_address: contact.address,
      city: contact.city,
      state: contact.state,
      zip_code: contact.zip,
      latitude: contact.latitude,
      longitude: contact.longitude,
    },
    external_provider_id: deal.id, // Links Aurora project back to KinOS deal
  });

  // 2. Create consumption profile (if we have utility data)
  if (deal.annual_usage_kwh) {
    await auroraApi.post(
      `/tenants/${TENANT_ID}/projects/${project.id}/consumption_profiles`,
      { annual_usage_kwh: deal.annual_usage_kwh },
    );
  }

  // 3. Submit design request (puts it in design team's queue)
  await auroraApi.post(
    `/tenants/${TENANT_ID}/projects/${project.id}/design_requests`,
    { notes: deal.appointment_notes || "" },
  );

  // 4. Update deal with Aurora IDs and advance stage
  await updateDeal(deal.id, {
    aurora_project_id: project.id,
    stage: "design_requested",
    stage_changed_at: new Date(),
  });

  // 5. Log activity
  await createActivity(
    deal.id,
    "design_requested",
    "Design requested — Aurora project created automatically",
    { aurora_project_id: project.id, requested_by: requestedBy },
  );

  return project;
}
```

### 6.4 Aurora Webhook Handler (Design Complete)

```typescript
async function handleAuroraDesignComplete(payload: AuroraWebhookPayload) {
  const { project_id, design_id } = payload;

  // 1. Find the KinOS deal linked to this Aurora project
  const deal = await findDealByAuroraProject(project_id);
  if (!deal) return; // Log warning — orphaned Aurora project

  // 2. Pull full design data from Aurora API
  const design = await auroraApi.get(
    `/tenants/${TENANT_ID}/designs/${design_id}/summary`,
  );
  const pricing = await auroraApi.get(
    `/tenants/${TENANT_ID}/projects/${project_id}/designs/${design_id}/pricing`,
  );
  const assets = await auroraApi.get(
    `/tenants/${TENANT_ID}/designs/${design_id}/assets`,
  );

  // 3. Update deal with design outputs
  await updateDeal(deal.id, {
    aurora_design_id: design_id,
    system_size_kw: design.system_size_kw,
    panel_count: design.module_count,
    panel_model: design.module_model,
    inverter_model: design.inverter_model,
    annual_production_kwh: design.annual_production_kwh,
    offset_percentage: design.offset_percentage,
    stage: "design_complete",
    stage_changed_at: new Date(),
  });

  // 4. Store panel layout image as attachment
  if (assets?.layout_image_url) {
    await ingestAttachmentFromUrl(
      assets.layout_image_url,
      deal.id,
      "deal",
      "aurora",
    );
  }

  // 5. Notify closer
  await notifyUser(
    deal.closer_id,
    "design_complete",
    `Design complete for ${deal.contact.first_name} ${deal.contact.last_name}`,
    `${design.system_size_kw} kW system — ready for proposal`,
  );

  // 6. Log activity
  await createActivity(
    deal.id,
    "design_complete",
    `Design complete: ${design.system_size_kw} kW, ${design.module_count} panels`,
    { design_id, system_size_kw: design.system_size_kw },
  );
}
```

### 6.5 Three Design Paths

KinOS supports three paths to a completed design. All three use the same automated
return path — Aurora webhook fires, KinOS pulls data back via API, deal auto-updates.

**Path A: Request Design (Design Team)**

```
Closer clicks "Request Design" in KinOS
  → KinOS auto-creates Aurora project via API (customer data pre-filled)
  → Design request created in Aurora queue
  → Design team picks it up, builds design in Aurora
  → Aurora webhook → KinOS pulls results → deal advances to "Design Complete"
```

**Path B: Self-Design (Closer does it themselves)**

```
Closer clicks "Self Design" in KinOS
  → KinOS auto-creates Aurora project via API (customer data pre-filled) if not already created
  → KinOS deep links closer directly into Aurora for that project
  → Closer uses Aurora's self-design tool to build proposal
  → Closer runs simulations, configures pricing, finalizes design
  → Closer saves/syncs design in Aurora
  → Aurora webhook → KinOS pulls results → deal advances to "Design Complete"
```

**Path C: Expert Design (Aurora's Design Team)**

```
Closer clicks "Expert Design" in KinOS
  → KinOS creates Aurora project (if not exists) + design request with expert flag
  → Aurora's professional design team picks it up
  → Expert designers build optimized design in Aurora
  → Aurora webhook → KinOS pulls results → deal advances
```

This path is for complex projects (commercial, ground mount, heavy shading) where
the in-house team may not have the expertise.

**Implementation:**

```typescript
async function handleDesignAction(
  dealId: string,
  action: "request" | "self",
  userId: string,
) {
  const deal = await getDealWithContact(dealId);

  // Create Aurora project if it doesn't exist yet
  let auroraProjectId = deal.aurora_project_id;
  if (!auroraProjectId) {
    const project = await createAuroraProject(deal);
    auroraProjectId = project.id;
  }

  if (action === "request") {
    // Path A: Submit design request to team queue
    await auroraApi.post(
      `/tenants/${TENANT_ID}/projects/${auroraProjectId}/design_requests`,
      { notes: deal.appointment_notes || "" },
    );
    await updateDeal(deal.id, { stage: "design_requested" });
    await createActivity(
      deal.id,
      "design_requested",
      "Design requested — sent to design team queue",
    );
  } else if (action === "self") {
    // Path B: Return deep link for closer to open Aurora directly
    await updateDeal(deal.id, { stage: "design_requested" });
    await createActivity(
      deal.id,
      "self_design_started",
      "Self-design started — closer building in Aurora",
    );
    return {
      aurora_url: `https://app.aurorasolar.com/projects/${auroraProjectId}/design`,
    };
  }
}
```

**Deal Detail Design Tab — Actions:**

- "Request Design" → sends to design team (Path A)
- "Self Design" → opens Aurora directly for closer to build (Path B)
- "Open in Aurora" → deep link to existing project (view/edit/present)
- "Share Proposal" → generates Aurora web proposal URL for homeowner
- "Re-request Design" → creates new design request if changes needed
- "Sync Design" → manual trigger to re-pull latest design data from Aurora

### 6.6 Design Data Display in KinOS Deal Detail

The deal detail page Design tab shows all Aurora outputs WITHOUT requiring Aurora login:

- **System Overview:** Size (kW), panel count, panel model, inverter, battery (if any)
- **Production:** Annual kWh, monthly breakdown, offset percentage
- **Layout Image:** Panel layout rendered on roof (pulled from Aurora assets API)
- **Pricing:** Base price, adders, net price, PPW (from Aurora or KinOS pricing engine)

The closer's entire workflow stays inside KinOS. Aurora is only opened when the closer
wants to self-design, present the interactive 3D proposal to homeowners, or make
design changes.

````

### 6.7 KinOS → Aurora Pricing & Adder Sync

Aurora's API supports full read/write for design-level pricing. KinOS is the
**pricing brain** — it calculates what things cost based on business rules
(market, team, deal type, margin). Aurora is the **design presentation layer** —
it needs correct pricing to show proposals and run financing.

**Aurora API Pricing Capabilities (Confirmed):**
- `PUT /designs/{id}/pricing` — Set flat price or PPW
- `POST /designs/{id}/pricing/adders` — Create adders (flat, per-watt, per-panel, %, roof area)
- `DELETE /designs/{id}/pricing/adders/{id}` — Remove adders
- Adder flags: `is_editable`, `is_hidden`, `is_quantity_editable`, `eligible_for_cbi`, `prevent_manual_deletion`

**Aurora's Built-In Automatic Adders (configured in Aurora admin):**
Conditions: specific modules, specific inverters, system size, roof pitch,
storage mode, ground mount, array count.
→ These handle DESIGN-based conditions natively.

**KinOS Adder Rules Engine (configured in KinOS admin):**
Conditions: installer market, state, city, zipcode, equipment, deal template,
sales team, lender.
→ These handle BUSINESS-CONTEXT conditions that Aurora doesn't know about.

**Sync Flow — After Design Complete:**
```typescript
async function syncPricingToAurora(dealId: string) {
  const deal = await getDealWithDesignData(dealId);

  // 1. Calculate pricing from KinOS rules engine
  const pricing = await calculateDealPricing(deal);
  //    - Looks up installer market from deal address
  //    - Applies active pricing config (base PPW, min/max)
  //    - Evaluates adder rules: which adders apply to this deal?
  //    - Calculates total price with adders

  // 2. Delete any previously-synced KinOS adders from Aurora
  //    (Aurora's own automatic adders are untouched)
  const previousSync = await getLastAuroraPricingSync(dealId);
  if (previousSync?.aurora_adder_ids?.length) {
    for (const adderId of previousSync.aurora_adder_ids) {
      await auroraApi.delete(
        `/tenants/${TENANT_ID}/designs/${deal.aurora_design_id}/pricing/adders/${adderId}`
      );
    }
  }

  // 3. Push base pricing to Aurora
  await auroraApi.put(
    `/tenants/${TENANT_ID}/designs/${deal.aurora_design_id}/pricing`,
    { pricing: { price_per_watt: pricing.base_ppw } }
  );

  // 4. Push KinOS-calculated adders to Aurora
  const auroraAdderIds: string[] = [];
  for (const adder of pricing.applied_adders) {
    const result = await auroraApi.post(
      `/tenants/${TENANT_ID}/designs/${deal.aurora_design_id}/pricing/adders`,
      {
        adder: {
          adder_name: adder.name,
          adder_value: adder.amount,
          quantity: adder.quantity || 1,
          is_discount: false,
          is_editable: false,           // Rep can't change KinOS-calculated adders
          is_hidden: !adder.is_customer_facing,
          prevent_manual_deletion: true, // Rep can't remove business-rule adders
          eligible_for_cbi: adder.eligible_for_itc || false,
        }
      }
    );
    auroraAdderIds.push(result.adder.id);
  }

  // 5. Log the sync for audit trail
  await logAuroraPricingSync(dealId, {
    sync_type: 'full_sync',
    aurora_design_id: deal.aurora_design_id,
    payload_sent: { ppw: pricing.base_ppw, adders: pricing.applied_adders },
    aurora_adder_ids: auroraAdderIds,
    status: 'success'
  });
}
````

**When Sync Happens:**

- After design complete webhook (auto)
- After admin changes pricing config that affects active deals (batch)
- After closer modifies deal adders in KinOS (on save)
- Manual "Sync Pricing" button on deal detail

**Dealer Fee / Margin Sync:**
When a lender product is selected on a deal, the sales-facing dealer fee
(which includes KIN's markup) is what gets pushed to Aurora for financing
calculations. The lender's actual dealer fee is used when submitting the
financing application to the lender's API. The delta (KIN's margin) is
recorded on the financing application record for accounting.

### 6.8 Equipment Source of Truth: Split Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EQUIPMENT MANAGEMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AURORA OWNS:                    KINOS OWNS:                 │
│  ─────────────                   ──────────────              │
│  • Equipment database            • Equipment pricing/cost    │
│    (all models, specs)           • Market availability        │
│  • Which models enabled           (which equipment in        │
│    for designers                   which market)              │
│  • Design-time equipment         • Margin calculations       │
│    selection                     • Adder rules per equipment │
│  • Component specs/sheets        • Price per component       │
│  • Automatic adders based          overrides by market       │
│    on equipment (design)                                     │
│                                  • Equipment admin page      │
│  API: Read from KinOS to          (mirrors Aurora catalog    │
│  display specs + sync              with business logic)      │
│  catalog periodically                                        │
│                                                              │
│  WHY: Aurora has 10,000+         WHY: Aurora can't scope     │
│  component models. We don't      equipment to markets.       │
│  want to duplicate that.         "Only use REC panels in     │
│  Design team picks equipment     CA, only Qcells in FL"      │
│  in Aurora as they always        is business logic Aurora     │
│  have.                           doesn't support.            │
│                                                              │
│  API: Read-only from KinOS       DB: equipment table +       │
│  perspective. Can specify        equipment_market_            │
│  preferred_panels on project     availability table           │
│  creation.                                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**How market-specific equipment works in practice:**

When a closer creates a deal in KinOS, the system knows the installer market
(from the project address). If the admin has restricted certain panels to
certain markets, KinOS can pass the `preferred_panels` parameter when creating
the Aurora project via API. This tells Aurora's AutoDesigner which panels to
use. For manual design, the design team follows market rules communicated via
design request notes or Aurora's Partner Management.

For adders, KinOS handles it fully — "if Enphase microinverters are used AND
the project is in the CA market, add $0.15/W adder" is a KinOS rule, because
Aurora's automatic adders don't know about markets.

### 6.9 Pricing Engine (Calculation Waterfall)

Enerflo uses a programmable computation graph (40+ JavaScript functions using Big.js)
that admins can customize per org. KinOS v1 does NOT need that level of complexity.
Instead, we implement the same pricing waterfall as a typed TypeScript service that
produces identical numbers. The waterfall can be made configurable later if needed.

**Pricing Waterfall (matches Enerflo's Default Model output):**

```typescript
import Big from "big.js";

interface PricingInputs {
  systemSizeWatts: Big;
  basePPW: Big;
  basePPWAdjustments: Big[]; // Market/team PPW adjustments
  equipment: CalculatedEquipment[]; // Modules, inverters, batteries (priced)
  systemAdders: CalculatedAdder[]; // Auto-applied adders (KinOS rules engine)
  valueAdders: CalculatedAdder[]; // Rep-selected adders
  discounts: CalculatedDiscount[];
  rebates: CalculatedRebate[];
  dealerFeePercent: Big; // Sales-facing dealer fee (includes KIN margin)
  downPayment: Big;
  taxRate: Big; // State-specific sales tax rate
  financeProduct: FinanceProduct;
  stateCode: string;
  rounding: { scale: number; mode: number };
}

interface PricingOutput {
  // Core waterfall
  basePPW: Big; // Adjusted base PPW
  baseCost: Big; // systemSizeWatts × basePPW
  equipmentTotal: Big; // Sum of priced equipment
  systemAddersTotal: Big; // Sum of system adders
  valueAddersTotal: Big; // Sum of value adders
  addersAndEquipmentTotal: Big; // equipment + systemAdders + valueAdders
  baseCostWithAddersAndEquipment: Big; // baseCost + addersAndEquipmentTotal

  // Tax layer
  taxTotal: Big;
  baseCostWithTax: Big;

  // Dealer fee layer (gross-up for positive fees, discount for negative)
  dealerFeeFactor: Big;
  dealerFee: Big;
  baseCostWithDealerFees: Big; // After gross-up

  // Discount layer
  discountsTotal: Big;
  grossCostBeforeRebates: Big; // After dealer fees, before rebates

  // Rebate layer
  rebatesReducingGross: Big;
  grossCost: Big; // grossCostBeforeRebates - rebatesReducingGross
  rebatesReducingNet: Big; // Including Federal ITC
  federalRebateTotal: Big;

  // Finance layer
  financeCost: Big; // grossCost - downPayment + lender adjustments
  netCost: Big; // financeCost - rebatesReducingNet

  // PPW variants (all = value / systemSizeWatts)
  baseCostPPW: Big;
  grossPPW: Big;
  grossBeforeRebatesPPW: Big;
  netPPW: Big;

  // Commission
  commissionBase: Big; // grossCostBeforeRebates - dealerFee
  commissionBasePPW: Big;

  // Itemized breakdowns
  calculatedEquipment: CalculatedEquipment[];
  calculatedSystemAdders: CalculatedAdder[];
  calculatedValueAdders: CalculatedAdder[];
  calculatedDiscounts: CalculatedDiscount[];
  calculatedRebates: CalculatedRebate[];
}

function calculatePricing(inputs: PricingInputs): PricingOutput {
  const { systemSizeWatts, rounding } = inputs;
  const round = (v: Big) => v.round(rounding.scale, rounding.mode);

  // 1. Base PPW (with adjustments for market/team)
  const basePPW = inputs.basePPWAdjustments.reduce(
    (sum, adj) => sum.plus(adj),
    inputs.basePPW,
  );

  // 2. Base Cost
  const baseCost = round(systemSizeWatts.times(basePPW));

  // 3. Equipment, Adders
  const equipmentTotal = sumAmounts(inputs.equipment);
  const systemAddersTotal = sumAmounts(inputs.systemAdders);
  const valueAddersTotal = sumAmounts(inputs.valueAdders);
  const addersAndEquipmentTotal = equipmentTotal
    .plus(systemAddersTotal)
    .plus(valueAddersTotal);
  const baseCostWithAddersAndEquipment = baseCost.plus(addersAndEquipmentTotal);

  // 4. Taxes (state-specific)
  const taxTotal = round(baseCostWithAddersAndEquipment.times(inputs.taxRate));

  // 5. Dealer Fee (gross-up or discount)
  const dealerFeeFactor = inputs.dealerFeePercent.gte(0)
    ? Big(1).minus(inputs.dealerFeePercent).round(6)
    : Big(1).div(Big(1).plus(inputs.dealerFeePercent));

  // Gross up base + adders + equipment + tax
  const baseCostWithDealerFees = round(
    baseCostWithAddersAndEquipment.plus(taxTotal).div(dealerFeeFactor),
  );
  const dealerFee = baseCostWithDealerFees.minus(
    baseCostWithAddersAndEquipment.plus(taxTotal),
  );

  // 6. Discounts
  const discountsTotal = sumAmounts(inputs.discounts);
  const grossCostBeforeRebates = baseCostWithDealerFees.minus(discountsTotal);

  // 7. Rebates
  const rebatesReducingGross = sumRebatesByType(inputs.rebates, "reducesGross");
  const grossCost = grossCostBeforeRebates.minus(rebatesReducingGross);
  const federalRebateTotal = calculateFederalITC(
    grossCostBeforeRebates,
    inputs.rebates,
  );
  const rebatesReducingNet = sumRebatesByType(
    inputs.rebates,
    "reducesNet",
  ).plus(federalRebateTotal);

  // 8. Finance Cost (with lender-specific adjustments)
  let financeCost = grossCost.minus(inputs.downPayment);
  financeCost = applyLenderAdjustments(
    financeCost,
    inputs.financeProduct,
    inputs.stateCode,
  );

  // 9. Net Cost
  const netCost = financeCost.minus(rebatesReducingNet);

  // 10. PPW calculations
  const ppw = (v: Big) =>
    systemSizeWatts.gt(0) ? v.div(systemSizeWatts).round(2) : Big(0);

  // 11. Commission Base
  const commissionBase = grossCostBeforeRebates.minus(dealerFee);

  return {
    basePPW,
    baseCost,
    equipmentTotal,
    systemAddersTotal,
    valueAddersTotal,
    addersAndEquipmentTotal,
    baseCostWithAddersAndEquipment,
    taxTotal,
    baseCostWithTax: baseCost.plus(taxTotal),
    dealerFeeFactor,
    dealerFee,
    baseCostWithDealerFees,
    discountsTotal,
    grossCostBeforeRebates,
    rebatesReducingGross,
    grossCost,
    rebatesReducingNet,
    federalRebateTotal,
    financeCost,
    netCost,
    baseCostPPW: ppw(baseCost),
    grossPPW: ppw(grossCost),
    grossBeforeRebatesPPW: ppw(grossCostBeforeRebates),
    netPPW: ppw(netCost),
    commissionBase,
    commissionBasePPW: ppw(commissionBase),
    calculatedEquipment: inputs.equipment,
    calculatedSystemAdders: inputs.systemAdders,
    calculatedValueAdders: inputs.valueAdders,
    calculatedDiscounts: inputs.discounts,
    calculatedRebates: inputs.rebates,
  };
}

// Lender-specific adjustments (replaces Enerflo's hardcoded financeCost function)
function applyLenderAdjustments(
  financeCost: Big,
  product: FinanceProduct,
  stateCode: string,
): Big {
  // Each lender provider can implement custom adjustments
  // Climate First: +$1,125 loan fee + FL stamp tax
  // Other lenders: no adjustments (pass-through)
  const provider = getLenderProvider(product.lenderSlug);
  return (
    provider.adjustFinanceCost?.(financeCost, product, stateCode) ?? financeCost
  );
}
```

**Validation Rules (from Enerflo's pricing model):**

- `panelCheck`: Minimum 7 panels required
- `lenderCheck`: GoodLeap TPO requires Qcells or Sirius panels
- `systemSizeWattsValid`: System size must be > 0
- Lender-specific restrictions can be configured per lender in KinOS admin

**Key Design Decisions:**

1. **No custom function engine for v1.** The waterfall is implemented in TypeScript.
   All inputs are typed, all outputs are predictable. If a pricing rule changes,
   we update the code — not a JSON function definition.
2. **Lender-specific logic goes in provider classes**, not hardcoded if-statements.
   Climate First's loan fee + FL stamp tax is in `ClimateFirstProvider.adjustFinanceCost()`.
3. **Big.js for all money math.** No floating point. Rounding is configurable
   (scale + mode) matching Enerflo's behavior.
4. **Commission base is always calculated**, even though Quickbase is SOT for commission
   payouts. This number flows to Quickbase on submission so ops has it.
5. **Future: configurable pricing models.** If KIN needs per-org or per-market pricing
   model overrides, we can add a `pricing_models` table and a lightweight expression
   evaluator. But not for v1.
6. **Cost Override / Goal-Seek.** Enerflo allows closers to override `grossCost` by
   adjusting `basePPW` within admin-defined min/max bounds. This is a "goal seek"
   feature — closer enters desired gross cost, engine solves for PPW. KinOS v1 can
   support this as a simple inverse calculation:
   `targetPPW = (targetGrossCost - addersAndEquipment - dealerFee) / systemSizeWatts`
   with validation that the result falls within admin-configured PPW floor/ceiling.
   Store the override flag + original vs overridden values on the proposal for audit.

---

## 7. LENDER INTEGRATION LAYER

### 7.1 Provider-Agnostic Interface

```typescript
interface LenderProvider {
  name: string;
  slug: string;

  // Credit Application
  submitApplication(
    deal: Deal,
    contact: Contact,
    product: LenderProduct,
  ): Promise<ApplicationResult>;
  getApplicationStatus(applicationId: string): Promise<ApplicationStatus>;

  // Stipulations
  getStipulations(applicationId: string): Promise<Stipulation[]>;
  submitStipDocument(
    applicationId: string,
    stipId: string,
    file: File,
  ): Promise<void>;

  // Agreements/Docs
  getAgreements(applicationId: string): Promise<Agreement[]>;

  // Webhooks
  handleWebhook(payload: any): Promise<WebhookResult>;
}

// Implementations
class GoodLeapProvider implements LenderProvider {
  /* ... */
}
class LightReachProvider implements LenderProvider {
  /* ... */
}
class EnFinProvider implements LenderProvider {
  /* ... */
}
class SunlightProvider implements LenderProvider {
  /* ... */
}
class DividendProvider implements LenderProvider {
  /* ... */
}
class SkylightProvider implements LenderProvider {
  /* ... */
}
```

---

## 8. DOCUMENT SIGNING LAYER

### 8.1 Provider-Agnostic Interface

Primary provider: **PandaDoc** (best template + merge field API for dynamic assembly).
Fallback: **SignNow** (already used in onboarding tool).
Enerflo uses a proprietary signing tool — no migration, build fresh in PandaDoc.

```typescript
interface SigningProvider {
  name: string;

  // Templates
  listTemplates(): Promise<Template[]>;

  // Sending — merge fields from deal data are injected here
  createEnvelope(params: {
    templateId: string;
    recipients: Recipient[];
    fieldValues: Record<string, any>; // Merge fields: homeowner name, address, system specs, pricing, lender terms
    dealId: string;
  }): Promise<Envelope>;

  // Status
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus>;

  // Embedded signing (in-app signing experience)
  getSigningUrl(envelopeId: string, recipientId: string): Promise<string>;

  // Webhooks (signed, declined, viewed, etc.)
  handleWebhook(payload: any): Promise<WebhookResult>;

  // Download completed docs
  getSignedDocument(envelopeId: string): Promise<Buffer>;
}
```

### 8.2 Document Assembly Logic

When a proposal is finalized and financing approved, the contract packet is assembled
dynamically from PandaDoc templates. Every merge field is populated from KinOS deal data —
no manual entry by the closer.

```typescript
// Merge field mapping: KinOS deal data → PandaDoc template fields
const MERGE_FIELD_MAP = {
  // Homeowner
  "homeowner.name": (deal) => deal.contact.fullName,
  "homeowner.address": (deal) => deal.contact.fullAddress,
  "homeowner.email": (deal) => deal.contact.email,
  "homeowner.phone": (deal) => deal.contact.phone,

  // System
  "system.size_kw": (deal) => deal.proposal.system_size_kw,
  "system.panel_count": (deal) => deal.proposal.panel_count,
  "system.panel_model": (deal) => deal.design.module_name,
  "system.inverter_model": (deal) => deal.design.inverter_name,
  "system.annual_production": (deal) => deal.design.annual_kwh,

  // Pricing
  "pricing.gross_cost": (deal) => deal.proposal.gross_cost,
  "pricing.net_cost": (deal) => deal.proposal.net_cost,
  "pricing.ppw": (deal) => deal.proposal.gross_ppw,
  "pricing.monthly_payment": (deal) => deal.proposal.monthly_payment,
  "pricing.down_payment": (deal) => deal.proposal.down_payment,

  // Financing
  "finance.lender": (deal) => deal.proposal.lender_name,
  "finance.product": (deal) => deal.proposal.lender_product_name,
  "finance.term": (deal) => deal.proposal.loan_term,
  "finance.rate": (deal) => deal.proposal.rate_per_kwh,
  "finance.escalator": (deal) => deal.proposal.escalator_percent,

  // Rep
  "rep.name": (deal) => deal.closer.fullName,
  "rep.license": (deal) => deal.closer.sales_rep_license_number,
  "rep.phone": (deal) => deal.closer.phone,

  // Dates
  "date.today": () => formatDate(new Date()),
  "date.estimated_install": (deal) => deal.estimated_install_date,
};

async function assembleDocumentPacket(deal: Deal) {
  const templates = await getRequiredTemplates(deal);

  for (const template of templates) {
    const fieldValues = mapDealToTemplateFields(deal, template.field_mappings);

    const envelope = await signingProvider.createEnvelope({
      templateId: template.provider_template_id,
      recipients: buildRecipientList(deal, template),
      fieldValues,
      dealId: deal.id,
    });

    await createDocumentEnvelope(deal.id, template.id, envelope);
  }
}
```

---

## 9. DEAL LIFECYCLE STATE MACHINE

```
                    ┌─────────────────────────────────────┐
                    │           RepCard Webhook            │
                    │        (Appointment Set)             │
                    └───────────────┬─────────────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │   NEW LEAD   │
                            └──────┬───────┘
                                   │ auto
                                   ▼
                        ┌──────────────────┐
                        │ APPOINTMENT SET  │
                        └────────┬─────────┘
                                 │ closer dispositions
                                 ▼
                        ┌──────────────────┐     ┌──────┐
                        │ APPOINTMENT SAT  │────▶│ LOST │
                        └────────┬─────────┘     └──────┘
                                 │ request design
                                 ▼
                        ┌──────────────────┐
                        │DESIGN REQUESTED  │
                        └────────┬─────────┘
                                 │ Aurora callback
                                 ▼
                        ┌──────────────────┐
                        │ DESIGN COMPLETE  │
                        └────────┬─────────┘
                                 │ send proposal
                                 ▼
                        ┌──────────────────┐
                        │  PROPOSAL SENT   │
                        └────────┬─────────┘
                                 │ homeowner accepts
                                 ▼
                        ┌──────────────────┐
                        │PROPOSAL ACCEPTED │
                        └────────┬─────────┘
                                 │ submit to lender
                                 ▼
                        ┌──────────────────┐
                        │FINANCING APPLIED │
                        └────────┬─────────┘
                                 │ lender decision
                                 ▼
                        ┌──────────────────┐
                        │FINANCING APPROVED│
                        └────────┬─────────┘
                                 │ (if stips)
                                 ▼
                     ┌─────────────────────┐
                     │   STIPS PENDING     │
                     └───────────┬─────────┘
                                 │ all stips cleared
                                 ▼
                     ┌─────────────────────┐
                     │   STIPS CLEARED     │
                     └───────────┬─────────┘
                                 │ send install agreement
                                 ▼
                        ┌──────────────────┐
                        │  CONTRACT SENT   │
                        └────────┬─────────┘
                                 │ homeowner signs
                                 ▼
                        ┌──────────────────┐
                        │ CONTRACT SIGNED  │
                        └────────┬─────────┘
                                 │ all gates pass
                                 ▼
                     ┌─────────────────────┐
                     │  SUBMISSION READY   │
                     └───────────┬─────────┘
                                 │ rep submits
                                 ▼
                        ┌──────────────────┐
                        │    SUBMITTED     │──────┐
                        └────────┬─────────┘      │
                                 │                 │ rejected
                                 │ approved        ▼
                                 ▼          ┌─────────────┐
                        ┌──────────────┐    │  REJECTED   │
                        │   APPROVED   │    │ (fix & re-  │
                        │  (→Quickbase)│    │  submit)    │
                        └──────────────┘    └─────────────┘
```

### 9.1 Stage Transition Rules

```typescript
const STAGE_TRANSITIONS: Record<string, string[]> = {
  new_lead: ["appointment_set", "cancelled", "lost"],
  appointment_set: ["appointment_sat", "cancelled", "lost"],
  appointment_sat: ["design_requested", "cancelled", "lost"],
  design_requested: ["design_complete", "cancelled", "lost"],
  design_complete: ["proposal_sent", "design_requested", "cancelled", "lost"],
  proposal_sent: ["proposal_accepted", "design_requested", "cancelled", "lost"],
  proposal_accepted: ["financing_applied", "cancelled", "lost"],
  financing_applied: [
    "financing_approved",
    "stips_pending",
    "cancelled",
    "lost",
  ],
  financing_approved: ["stips_pending", "contract_sent", "cancelled", "lost"],
  stips_pending: ["stips_cleared", "cancelled", "lost"],
  stips_cleared: ["contract_sent", "cancelled", "lost"],
  contract_sent: ["contract_signed", "cancelled", "lost"],
  contract_signed: ["submission_ready", "cancelled"],
  submission_ready: ["submitted", "cancelled"],
  submitted: ["intake_approved", "intake_rejected"],
  intake_rejected: ["submission_ready", "cancelled"],
  intake_approved: [], // Terminal — lives in Quickbase now
  cancelled: [],
  lost: ["appointment_set"], // Can revive lost deals
};
```

---

## 10. CONFIGURABLE GATING ENGINE

### 10.1 Deal Workflow Steps (Matching Enerflo's Stepped Process)

Based on the actual Enerflo deal detail view, the deal workflow is a guided
step-by-step process (not just a gate checklist). Each step must be completed
before the next unlocks. The left sidebar shows progress with checkmarks.

**Enerflo's steps (from screenshot):**

1. Title Check ✅ — Automatic property title lookup, confirm owner name
2. Consumption ✅ — Utility bill / usage data entry
3. Deal Details ✅ — System info, pricing, adders
4. Designs ✅ — Aurora design (request or self-design)
5. Proposal ✅ — Send proposal to homeowner
6. Financing ○ — Credit application, lender selection, approval
7. Contracting ✅ — Document signing (install agreement, etc.)
8. Welcome Call Completion ○ — CallPilot welcome call verified
9. Pre-Intake Checklist (!) — Final gate checks before submission

**KinOS Implementation — Deal Workflow Steps:**

```sql
-- ============================================================
-- DEAL WORKFLOW STEPS (Configurable step definitions)
-- Admin can add/remove/reorder steps. Each step has its own
-- completion logic and UI component.
-- ============================================================
CREATE TABLE workflow_step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,                          -- 'Title Check'
  slug TEXT NOT NULL,                          -- 'title_check'
  description TEXT,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'title_check',        -- Automatic property title lookup
    'consumption',        -- Utility data entry
    'deal_details',       -- System/pricing configuration
    'design',             -- Aurora design integration
    'proposal',           -- Proposal generation/sending
    'financing',          -- Lender application
    'contracting',        -- Document signing
    'verification',       -- External verification (CallPilot, etc.)
    'checklist',          -- Pre-submission checklist (gates)
    'custom'              -- Custom step with configurable fields
  )),
  config JSONB DEFAULT '{}',                   -- Step-specific configuration
  is_required BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT true,            -- Must complete before next step
  display_order INTEGER NOT NULL,
  applies_to_deal_types TEXT[] DEFAULT '{}',   -- Empty = all types
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DEAL WORKFLOW PROGRESS (Per-deal step tracking)
-- ============================================================
CREATE TABLE deal_workflow_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES workflow_step_definitions(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'skipped', 'blocked'
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  data JSONB DEFAULT '{}',                     -- Step-specific completion data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, step_definition_id)
);

CREATE INDEX idx_workflow_progress_deal ON deal_workflow_progress(deal_id);
```

**Progress Calculation:**
The progress percentage shown on the deals list (e.g., "40%") is calculated as:
`completed_steps / total_required_steps * 100`

### 10.2 Default Gate Configuration (Pre-Intake Checklist)

The Pre-Intake Checklist is the final workflow step. It contains the configurable
gates that must ALL pass before the deal can be submitted. These map to the current
Enerflo pre-intake checklist:

```typescript
const DEFAULT_GATES = [
  // === DOCUMENTS ===
  {
    name: "Install Agreement Signed",
    gate_type: "document_signed",
    config: { template_key: "kin_install_agreement" },
    display_order: 1,
  },
  {
    name: "Loan/Lender Docs Signed",
    gate_type: "financing_status",
    config: { required_status: ["approved", "stips_cleared"] },
    display_order: 2,
  },

  // === FILE UPLOADS ===
  {
    name: "Utility Bill Uploaded",
    gate_type: "file_uploaded",
    config: {
      file_type: "utility_bill",
      accepted_formats: ["pdf", "jpg", "png"],
    },
    display_order: 3,
  },

  // === EXTERNAL VERIFICATION ===
  {
    name: "CallPilot Welcome Call Completed",
    gate_type: "checkbox",
    config: { label: "CallPilot welcome call has been completed" },
    display_order: 4,
  },
  {
    name: "Site Survey Scheduled",
    gate_type: "external_status",
    config: {
      system: "arrivy",
      label: "Site survey scheduled via Arrivy",
      required_status: ["scheduled", "en_route", "started", "completed"],
      fallback: "checkbox", // Manual checkbox until Arrivy integration is built
    },
    display_order: 5,
  },

  // === QUESTIONS ===
  {
    name: "Additional Work Needed?",
    gate_type: "question",
    config: {
      question: "Is there any additional work needed?",
      answer_type: "select",
      options: [
        "No",
        "Main Panel Upgrade",
        "Derate",
        "Roof Work",
        "Tree Removal",
        "Other",
      ],
    },
    display_order: 6,
  },
  {
    name: "Shading Issues?",
    gate_type: "question",
    config: {
      question: "Are there any shading issues?",
      answer_type: "select",
      options: ["No", "Yes - addressed in design", "Yes - customer aware"],
    },
    display_order: 7,
  },
  {
    name: "Offset Below 100%?",
    gate_type: "question",
    config: {
      question: "Is the offset below 100%?",
      answer_type: "select",
      options: ["No - 100% or above", "Yes - customer acknowledges"],
    },
    display_order: 8,
  },
  {
    name: "Design Preferences",
    gate_type: "question",
    config: {
      question: "Any design preferences or notes for ops team?",
      answer_type: "text",
    },
    display_order: 9,
  },
  {
    name: "New Move-In?",
    gate_type: "question",
    config: {
      question: "Is this a new move-in (less than 12 months)?",
      answer_type: "boolean",
    },
    display_order: 10,
  },

  // === CHECKBOXES ===
  {
    name: "Lender Welcome Call Scheduled",
    gate_type: "checkbox",
    config: { label: "Lender welcome call has been scheduled/completed" },
    display_order: 11,
  },
  {
    name: "Customer Photo ID Collected",
    gate_type: "checkbox",
    config: { label: "Customer photo ID has been collected" },
    display_order: 12,
  },
  {
    name: "Next Steps Verified with Customer",
    gate_type: "checkbox",
    config: { label: "All next steps have been verified with the customer" },
    display_order: 13,
  },
];
```

### 10.2 Gating Engine Logic

```typescript
async function checkDealReadyForSubmission(
  dealId: string,
): Promise<GateCheckResult> {
  const deal = await getDealWithRelations(dealId);
  const gates = await getActiveGatesForDeal(deal);
  const completions = await getGateCompletions(dealId);

  const results = gates.map((gate) => {
    const completion = completions.find(
      (c) => c.gate_definition_id === gate.id,
    );

    switch (gate.gate_type) {
      case "document_signed":
        return checkDocumentSigned(deal, gate.config);
      case "file_uploaded":
        return checkFileUploaded(deal, gate.config);
      case "financing_status":
        return checkFinancingStatus(deal, gate.config);
      case "checkbox":
        return { passed: completion?.is_completed ?? false };
      case "question":
        return {
          passed: completion?.is_completed ?? false,
          value: completion?.value,
        };
      case "field_required":
        return checkFieldRequired(deal, gate.config);
      default:
        return { passed: false };
    }
  });

  const allPassed = results.every((r) => r.passed);
  return {
    ready: allPassed,
    gates: gates.map((gate, i) => ({
      ...gate,
      ...results[i],
    })),
    blockers: gates.filter((_, i) => !results[i].passed),
  };
}
```

---

## 11. QUICKBASE INTEGRATION (Bidirectional)

### 11.0 Architecture: Bidirectional Sync

Quickbase integration has TWO directions:

1. **KinOS → Quickbase (Push):** Submit completed deals for ops processing
2. **Quickbase → KinOS (Pull):** Post-sale milestone visibility for closers

The push is the v1 priority. The pull enables post-sale pipeline visibility
(see `docs/kinos-future-features.md` → "Post-Sale Pipeline & Quickbase Bidirectional Sync").

Post-sale milestones from Quickbase:

```
intake_approved → site_survey_scheduled → site_survey_complete →
  permit_submitted → permit_approved → install_scheduled →
  install_complete → inspection_scheduled → inspection_passed →
  pto_submitted → pto_approved → project_complete
```

Closer actions that write back to Quickbase:

- Cancel deal (with reason)
- Respond to change orders (approve/reject)
- Flag issues ("customer unhappy about timeline")
- Update customer contact info
- Request install reschedule

### 11.1 Deal Submission Push

When all gates pass and rep clicks "Submit":

```typescript
async function submitDealToQuickbase(dealId: string) {
  const deal = await getDealWithAllRelations(dealId);

  // Map deal fields to Quickbase fields
  const qbPayload = {
    // Customer Info
    "Customer Name": `${deal.contact.first_name} ${deal.contact.last_name}`,
    Phone: deal.contact.phone,
    Email: deal.contact.email,
    Address: deal.contact.full_address,
    State: deal.contact.state,

    // Rep Info
    Setter: `${deal.setter.first_name} ${deal.setter.last_name}`,
    Closer: `${deal.closer.first_name} ${deal.closer.last_name}`,
    Office: deal.office.name,

    // System
    "System Size (kW)": deal.system_size_kw,
    "Panel Count": deal.panel_count,
    "Panel Model": deal.panel_model,
    Offset: deal.offset_percentage,

    // Pricing
    "Gross Price": deal.gross_price,
    "Net Price": deal.net_price,
    PPW: deal.net_ppw,

    // Financing
    Lender: deal.lender?.name,
    "Loan Product": deal.loan_product,
    "Financing Status": deal.financing_status,

    // Gate Answers (all submission questions)
    ...mapGateAnswersToQuickbase(deal.gate_completions),

    // Links
    "KinOS Deal URL": `https://app.kinhome.com/deals/${deal.id}`,
    "Aurora Project": deal.aurora_project_id,
  };

  const result = await quickbaseApi.createRecord(QB_TABLE_ID, qbPayload);

  await updateDeal(dealId, {
    quickbase_deal_id: result.recordId,
    submission_status: "submitted",
    submitted_at: new Date(),
    stage: "submitted",
  });
}
```

### 11.5 Arrivy Integration (Site Surveys & Field Service)

Arrivy is KIN Home's field management platform for site surveys and installs.
KinOS integrates with Arrivy to give closers self-service survey scheduling.

**Site survey is a submission GATE** — the survey must be SCHEDULED (not completed)
before a deal can be submitted. The survey happens in parallel with or after submission.

**Capabilities:**

- GET available survey time slots by region/address
- POST create survey task (customer info + address auto-filled from deal)
- PUT reschedule survey
- DELETE cancel survey
- GET task status (scheduled, en_route, started, completed)
- Webhooks: task status change notifications

**Integration Pattern:**
Same adapter pattern as lender integrations — abstract Arrivy-specific API behind
a field service interface. Since Arrivy also handles installs, the integration layer
supports multiple task types (survey, install, inspection) for future post-sale visibility.

**Deal fields needed:**

- arrivy_task_id (TEXT) — Arrivy's task/job ID
- site_survey_status (TEXT) — scheduled, en_route, in_progress, completed, cancelled
- site_survey_date (TIMESTAMPTZ) — scheduled survey date/time

---

## 12. COMMISSION & POST-SUBMISSION DATA FLOW

### 12.1 Architecture: Quickbase is Source of Truth Post-Submission

KinOS owns the deal from appointment through submission. Once submitted and approved,
Quickbase owns everything downstream — ops, install tracking, milestones, payments.
Commission tools (Sequifi / CaptiveIQ) pull from Quickbase, NOT from KinOS.

```
KinOS (pre-submission)          Quickbase (post-submission)
─────────────────────           ────────────────────────────
Lead → Design → Finance →      → Intake Review
  Contract → Submit ──────────►  → Install Scheduling
                                  → Permitting
                                  → Install Complete
                                  → M1/M2 Payments
                                  → Commission milestones ──► Sequifi/CaptiveIQ
```

**KinOS does NOT push to Sequifi/CaptiveIQ directly in v1.**
That relationship stays as-is through Quickbase initially. Future: direct push
to Sequifi/CaptiveIQ on deal milestones (contract signed, install complete, PTO).
See `docs/kinos-future-features.md` → "Commission Push" for the full plan.

### 12.2 Quickbase → KinOS Status Sync (Optional but Recommended)

The one thing KinOS benefits from is knowing the final outcome of submitted deals.
This lets managers see full pipeline health without switching to Quickbase.

**Option A: Quickbase Webhook (preferred if available)**
Quickbase fires a webhook to KinOS when deal status changes:

- `intake_approved` → deal was accepted by ops team
- `intake_rejected` → deal needs fixes (closer sees this in KinOS)
- `installed` → project completed
- `cancelled_post_submit` → deal fell apart after submission

**Option B: Periodic Sync (fallback)**
KinOS polls Quickbase API every N minutes for status updates on submitted deals.

**Option C: Email Notification Step**
For statuses that don't need real-time sync (like install complete), an email
notification triggered from Quickbase is sufficient. No API integration needed.

```typescript
// Quickbase webhook handler
async function handleQuickbaseWebhook(payload: QuickbaseWebhookPayload) {
  const deal = await findDealByQuickbaseId(payload.record_id);
  if (!deal) return;

  // Update deal status in KinOS
  await updateDeal(deal.id, {
    submission_status: mapQuickbaseStatus(payload.status),
    intake_reviewed_at: payload.reviewed_at,
    intake_reviewed_by: payload.reviewer_name,
    rejection_reason: payload.rejection_reason || null,
  });

  // If rejected, notify closer so they can fix and re-submit
  if (payload.status === "rejected") {
    await notifyUser(
      deal.closer_id,
      "submission_rejected",
      `Deal rejected: ${deal.contact.first_name} ${deal.contact.last_name}`,
      `Reason: ${payload.rejection_reason}`,
    );
    await updateDeal(deal.id, { stage: "intake_rejected" });
  }

  // If approved, mark as terminal in KinOS
  if (payload.status === "approved") {
    await updateDeal(deal.id, { stage: "intake_approved" });
    await notifyUser(
      deal.closer_id,
      "submission_approved",
      `Deal approved: ${deal.contact.first_name} ${deal.contact.last_name}`,
      "Intake team approved — moving to ops!",
    );
  }
}
```

```

---

## 13. NOTIFICATIONS

### 13.1 Twilio SMS Triggers

| Event | Recipient | Message |
|-------|-----------|---------|
| Appointment Set | Closer | "New appointment: {name} at {time} - {address}" |
| Design Complete | Closer | "Design ready for {name} - review in KinOS" |
| Financing Approved | Closer + Setter | "Financing approved for {name}!" |
| Stips Required | Closer | "Stips needed for {name}: {stip_list}" |
| Contract Signed | Closer + Setter | "{name} signed! Ready for submission." |
| Submission Approved | Closer + Setter | "{name} approved by intake team!" |
| Submission Rejected | Closer | "{name} rejected: {reason}" |

---

## 14. SCREEN-BY-SCREEN SPECIFICATION

### 14.1 Authentication
- **Login** — Email/password, magic link option
- **Forgot Password** — Email reset flow

### 14.2 Dashboard (Role-dependent)
- **Setter Dashboard:** My appointments today, my leads, my deal count, appointment calendar
- **Closer Dashboard:** Today's appointments, active deals pipeline (Kanban), financing status summary, pending submissions
- **Manager Dashboard:** Office/team performance, deal pipeline by stage, rep leaderboard, pending submissions queue
- **Admin Dashboard:** Company-wide metrics, all pipelines, configuration access, integration health

### 14.3 Deal Pipeline (Main View)
- **Kanban Board:** Deals as cards, columns = stages, drag-to-advance (with validation)
- **List View:** Sortable/filterable table of all deals
- **Filters:** Stage, closer, setter, office, team, date range, lender, source

### 14.4 Deal Detail Page
- **Header:** Contact name, address, deal number, stage badge, setter/closer avatars
- **Tab: Overview** — Contact info, appointment details, system specs, pricing, timeline
- **Tab: Design** — Aurora integration (iframe or link), design details, production estimates
- **Tab: Financing** — Lender selection, application status, stips tracker, approval details
- **Tab: Documents** — Document list, signing status, send/resend, view signed copies
- **Tab: Submission** — Gate checklist (the configurable submission workflow), submit button
- **Tab: Activity** — Full timeline/feed of all deal events
- **Tab: Files** — All attachments (utility bills, photos, IDs, contracts)

### 14.5 Admin Panel
- **Users** — CRUD, role assignment, office/team assignment, activate/deactivate
- **Offices & Teams** — CRUD, RepCard mapping, market assignment
- **Equipment** — Aurora catalog mirror, market availability toggles, pricing overrides, spec sheet links
- **Pricing Engine** — Visual waterfall display, active rules in plain English, test/sandbox mode, audit trail
- **Pricing Configs** — Base PPW per market, min/max bounds, effective dates
- **Adders** — CRUD templates, scope rules, categories, auto-apply conditions
- **Lenders** — Lender management, product configuration, dealer fee/markup settings, state availability
- **Document Templates** — Configure which docs required for which deal types, merge field mapping
- **Submission Gates** — Add/remove/reorder gates, configure gate types
- **Workflow Steps** — Step definitions, ordering, blocking rules
- **Integrations** — API key management, webhook URLs, sync status, test connections, health dashboard

### 14.6 Post-Sale Pipeline (Future)
- **Post-Sale Timeline** — Milestone progress from Quickbase (permit, install, inspection, PTO)
- **Closer Actions** — Cancel, respond to change orders, flag issues, request reschedule
- **Notifications** — Milestone updates pushed to closers
- **Change Order Management** — View proposed changes, approve/reject with pricing impact

### 14.7 Reports
- **Pipeline Report** — Deals by stage, conversion rates, stage duration averages
- **Rep Performance** — Deals per rep, close rate, average deal size, time-to-close
- **Office Report** — Office-level aggregation of all metrics
- **Financing Report** — Approval rates by lender, average dealer fee, stip rates
- **Revenue Report** — Gross/net revenue, margin analysis, PPW trends

---

## 15. API ROUTE ARCHITECTURE

```

/api
├── /webhooks
│ ├── /repcard POST — RepCard webhook receiver
│ ├── /aurora POST — Aurora webhook receiver
│ ├── /lender/[slug] POST — Lender-specific webhook
│ └── /signing POST — Doc signing webhook
│
├── /auth
│ ├── /login POST
│ ├── /logout POST
│ ├── /forgot-password POST
│ └── /reset-password POST
│
├── /deals
│ ├── / GET — List deals (filtered/paginated)
│ ├── /[id] GET — Deal detail
│ ├── /[id] PATCH — Update deal
│ ├── /[id]/stage PATCH — Advance/change stage
│ ├── /[id]/design POST — Request Aurora design
│ ├── /[id]/financing POST — Submit financing application
│ ├── /[id]/documents POST — Send document for signing
│ ├── /[id]/gates GET — Get gate status
│ ├── /[id]/gates/[gid] PATCH — Complete a gate
│ ├── /[id]/submit POST — Submit to Quickbase
│ ├── /[id]/attachments POST — Upload attachment
│ └── /[id]/activity GET — Activity feed
│
├── /contacts
│ ├── / GET — List contacts
│ ├── /[id] GET — Contact detail
│ └── /[id] PATCH — Update contact
│
├── /users
│ ├── / GET — List users
│ ├── /[id] GET — User detail
│ ├── /[id] PATCH — Update user
│ └── /me GET — Current user
│
├── /admin
│ ├── /offices CRUD
│ ├── /teams CRUD
│ ├── /roles CRUD
│ ├── /equipment CRUD
│ ├── /pricing CRUD
│ ├── /lenders CRUD
│ ├── /lender-products CRUD
│ ├── /adder-templates CRUD
│ ├── /document-templates CRUD
│ ├── /gate-definitions CRUD
│ └── /integrations GET/PATCH
│
├── /reports
│ ├── /pipeline GET
│ ├── /performance GET
│ ├── /office GET
│ ├── /financing GET
│ └── /revenue GET
│
├── /arrivy
│ ├── /availability GET — Available survey time slots
│ ├── /schedule POST — Schedule site survey
│ ├── /[taskId]/reschedule PATCH — Reschedule survey
│ ├── /[taskId]/cancel DELETE — Cancel survey
│ └── /webhook POST — Arrivy status webhook
│
├── /quickbase
│ ├── /submit POST — Submit deal to Quickbase
│ ├── /status/[dealId] GET — Pull deal status from Quickbase
│ └── /webhook POST — Quickbase status change webhook

````

---

## 16. BUILD STATUS & REMAINING WORK

### Completed Epics

| Epic | Name | Status | Key Deliverables |
|------|------|--------|-----------------|
| 0 | Infrastructure | ✅ Complete | Supabase project, schema migration, Next.js scaffold, Vercel deploy |
| 1 | Auth & Users | ✅ Complete | Supabase Auth, proxy.ts (Next.js 16), RLS policies, RepCard user sync |
| 2 | RepCard Integration | ✅ Complete | 7 webhook handlers, contact/deal auto-creation, user upsert |
| 3 | Pipeline & Deals | ✅ Complete | Kanban drag-drop, 19 stages, realtime, dashboard, deal detail |
| 4 | Leads Management | ✅ Complete | List, detail, notes, attachments, CSV import, filter presets |
| 5 | Calendar | ✅ Complete | Appointments CRUD, day/week/month/list views, dashboard widgets |
| 6 | Aurora Design | ✅ Complete | API client, service layer, webhooks, 3 design paths, consumption/design workflow |
| 7 | Proposal & Pricing | ✅ Complete (code) | Pricing engine (Big.js), goal-seek, multi-proposal, adder scope rules. Needs real lender data verification. |

### Remaining Epics

| Epic | Name | Status | See |
|------|------|--------|-----|
| 8 | Financing | 📋 Planned | `docs/kinos-future-features.md` |
| 9 | Contracting & Doc Signing | 📋 Planned | `docs/kinos-future-features.md` |
| 10 | Submission & Quickbase | 📋 Planned | `docs/kinos-future-features.md` |
| 11 | Admin Settings Suite | 📋 Planned | `docs/kinos-future-features.md` |
| 12 | Reports & Analytics | 📋 Planned | `docs/kinos-future-features.md` |

### Future Features (post-v1)

All documented in `docs/kinos-future-features.md`:
- Post-Sale Pipeline (Quickbase bidirectional sync)
- Site Survey & Arrivy Integration
- Equipment Configuration (Aurora catalog mirror)
- Pricing Engine Admin & Transparency
- Lender API Direct Integrations
- Change Order Management
- Notifications (Twilio + in-app)
- Design Queue
- Customer Portal
- Commission Push (Sequifi/CaptiveIQ)
- Mobile Experience (PWA)

---

## 17. KEY DECISIONS LOG

| Decision | Resolution | Notes |
|----------|-----------|-------|
| Document Signing Provider | PandaDoc (primary), SignNow (fallback) | Need dynamic merge fields from deal data. PandaDoc has best template + merge API. SignNow available from onboarding tool as fallback. Enerflo uses proprietary tool — no migration, build fresh. |
| Welcome Call Verification | Keep CallPilot | Webhook integration: CallPilot calls homeowner, verifies sale, webhooks pass/fail back to KinOS. Simple status update on deal workflow step. |
| Change Orders | Post-v1 | Will be "new proposal on submitted deal" → re-contract → re-submit to Quickbase with change order flag. Permission toggle already in user schema (`can_create_change_orders`). |
| Launch Strategy | Full cutover from Enerflo | No parallel systems. No in-flight deal migration. New deals start in KinOS from day one. Old deals finish in Enerflo. RepCard webhooks repointed on cutover day. |
| Pricing Engine | Typed TypeScript service (not configurable function graph) | Matches Enerflo's math output. Lender-specific logic in provider classes. Big.js for precision. Configurable engine deferred to post-v1 if needed. |
| Equipment Source of Truth | Split: Aurora owns catalog, KinOS owns business logic | Aurora: component database, design-time selection, automatic adders (design conditions). KinOS: pricing, market availability, adder rules (business conditions). |
| Deal Access Control | Assignment-based + role-based | Closer: full access. Setter: read-only. Manager: read-only on office deals. Admin: full access. RLS-enforced. |
| Post-Sale Visibility | Quickbase remains ops SOT, KinOS provides read window + limited closer actions | Bidirectional sync: read milestones, push closer actions (cancel, change order response, reschedule) |
| Equipment Admin | Mirror Aurora catalog in KinOS with business logic overlay | Settings → Equipment page syncs from Aurora API, adds market scoping + pricing rules |
| Pricing Transparency | Admin can see and test pricing engine without code access | Settings → Pricing Engine page: visual waterfall, sandbox mode, audit trail |
| Site Survey | Arrivy integration for scheduling, not just a checkbox gate | Schedule, reschedule, cancel surveys from deal detail. Gate = survey SCHEDULED (not completed). |
| Field Service | Arrivy for surveys AND installs | Same integration layer supports future post-sale install visibility |
| Future Features Docs | Every planned feature has a standalone explainer | `docs/kinos-future-features.md` — agents read before building to ensure current code supports future needs |

### Open Questions (Non-Blocking)

1. **Quickbase field mapping.** Need actual Quickbase table/field structure for intake
   submission. Generic push modeled, but precise field mapping needed before Phase 5.

2. **PandaDoc template design.** Contract templates need to be built in PandaDoc with
   merge fields mapped to KinOS deal data. Need list of all documents that get signed
   (install agreement, financing docs, HOA authorization, etc.) before Phase 5.

3. **CallPilot webhook format.** Need their webhook payload structure to build the
   integration endpoint. Or decide if we build our own verification call flow.

---

## APPENDIX A: ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# RepCard
REPCARD_API_KEY=
REPCARD_WEBHOOK_SECRET=
REPCARD_BASE_URL=https://app.repcard.com/api

# Aurora Solar
AURORA_API_KEY=
AURORA_TENANT_ID=
AURORA_BASE_URL=https://api-v2.aurorasolar.com
AURORA_WEBHOOK_SECRET=

# Lenders (per-lender)
GOODLEAP_API_KEY=
GOODLEAP_BASE_URL=
LIGHTREACH_API_KEY=
LIGHTREACH_BASE_URL=
# ... etc

# Document Signing
SIGNING_PROVIDER=         # 'docusign', 'pandadoc', 'signnow', 'boldsign'
SIGNING_API_KEY=
SIGNING_WEBHOOK_SECRET=

# Quickbase
QUICKBASE_REALM=
QUICKBASE_USER_TOKEN=
QUICKBASE_APP_ID=
QUICKBASE_TABLE_ID=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Commission
SEQUIFI_API_KEY=
CAPTIVEIQ_API_KEY=

# Arrivy (Field Service Management)
ARRIVY_API_KEY=
ARRIVY_BASE_URL=
ARRIVY_WEBHOOK_SECRET=
````

---

## APPENDIX B: REPCARD WEBHOOK PAYLOAD REFERENCE

(Full payload from KIN Home production webhook — Appointment Set event)

```json
{
  "id": 640605,
  "title": "",
  "appointment_link": "",
  "appointment_location": "2809 BRASSIE CIR NAVARRE FL 32566",
  "notes": "",
  "appointment_attachment": [
    "https://s3-ap-southeast-2.amazonaws.com/repcard/appointments/attachments/H5nH717707625075872.JPG"
  ],
  "closer": {
    "id": 174886,
    "name": "David Smith",
    "username": "davidsmith123456",
    "firstName": "David",
    "lastName": "Smith",
    "email": "david.s@kinhome.com",
    "phoneNumber": "+18504494055",
    "companyName": "Kin Home",
    "jobTitle": "Energy Consultant",
    "role": "Area Director",
    "location": "Bitton Region",
    "team": "Bitton - Pensacola 2026"
  },
  "contact": {
    "id": 47832044,
    "firstName": "Wesley",
    "lastName": "sharp",
    "phoneNumber": "+18066810070",
    "address": "2809 BRASSIE CIR",
    "city": "NAVARRE",
    "state": "FL",
    "zip": "32566",
    "latitude": "30.443119",
    "longitude": "-86.93239",
    "notes": "Husband not home",
    "status": "Appointment Scheduled",
    "owner/user": {
      "id": 176783,
      "name": "Cameron Bott",
      "role": "Rookie - Setter"
    }
  },
  "start_at_timezone": "US/Central",
  "appt_start_time_local": "2026-02-12 18:00:00",
  "appt_end_time_local": "2026-02-12 19:00:00",
  "duration": 60,
  "created_at": "2026-02-10 22:28:32+00:00"
}
```

(Abbreviated for reference — see full payload in project docs)
