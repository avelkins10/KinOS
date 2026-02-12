# KinOS Database Audit — Live Schema

> Last audited: 2026-02-11 (pulled from live Supabase)
> 47 tables + 2 views = 49 objects in public schema
> Epic 6 UI complete (consumption form, design request/results, status badge; no schema change)

---

## LIVE TABLE INVENTORY

### Org Hierarchy (4 tables)

- **companies** (8 cols): id, name, slug, logo_url, settings (JSONB), timestamps
- **offices** (12 cols): id, company_id, name, office_type, parent_office_id, state, timezone, repcard_office_name, is_active, timestamps
- **teams** (8 cols): id, office_id, name, repcard_team_name, is_active, timestamps
- **roles** (8 cols): id, company_id, name, display_name, category (setter/closer/manager/admin/owner), permissions (JSONB), is_system_role

### Users (3 tables)

- **users** (34 cols): id, auth_id, company_id, office_id, team_id, role_id, first_name, last_name, email, phone, country_code, image_url, bio, external_id, repcard_user_id, repcard_badge_id, sales_rep_license_number, license_state, license_expiry, status (invited/active/deactivated), activated_at, deactivated_at, invited_at, last_login_at, timezone, permission overrides (6 booleans), timestamps
- **user_lender_credentials** (14 cols): per-user, per-lender credentials
- **user_integration_settings** (7 cols): per-user integration config

### CRM Core (7 tables)

- **contacts** (44 cols): id, company_id, names, email, phone, address fields, contact_type, contact_source, repcard_customer_id, repcard_status, repcard_status_id, utility fields (company, account_number, rate_kwh, tariff_code, tariff_name), consumption fields (annual_usage_kwh, monthly_electric_bill, monthly_usage_kwh JSONB, building_sqft), genability IDs, HOA fields, roof fields, lat/lng, soft delete
- **deals** (92 cols): id, company_id, contact_id, deal_number, stage, closer_id, setter_id, office_id, team_id, appointment fields (7), aurora fields (project_id, design_id, design_request_id, sales_mode_url), design_status (see below), consumption (monthly_kwh JSONB, annual_kwh, utility_company, utility_tariff, monthly_bill), design request metadata (design_request_type, design_requested_at, design_completed_at, design_request_notes, target_offset, roof_material), system fields (size_kw, panel_count/model, inverter_model, battery), pricing fields (gross/net price/ppw, dealer_fee, commission_base), financing fields, submission fields, active_appointment_id, active_proposal_id, install address fields, soft delete
- **proposals** (70 cols): full pricing waterfall, design snapshot, financing terms
- **proposal_arrays** (20 cols): per-array design data (modules, pitch, azimuth, TSRF, solar access)
- **proposal_adders** (15 cols): line-item adders with dynamic inputs
- **proposal_discounts** (9 cols): line-item discounts

### Appointments (1 table — Epic 5)

- **appointments** (24 cols): id, company_id, contact_id, deal_id, closer_id, setter_id, scheduled_start/end, timezone, duration_minutes, location, status (scheduled/confirmed/completed/no_show/cancelled/rescheduled), outcome, outcome_id, outcome_notes, notes, repcard_appointment_id, repcard_attachments (JSONB), appointment_type (in_home/virtual/phone/follow_up), is_active, created_by, timestamps

### Equipment (2 tables)

- **equipment** (20 cols): category, manufacturer, model, wattage, efficiency, cost, aurora_component_id/name, specifications (JSONB)
- **equipment_market_availability** (8 cols): per-market equipment config with override pricing

### Financing (2 tables)

- **financing_applications** (23 cols): deal_id, lender_id, lender_product_id, status tracking, approval details, stips (JSONB), soft delete
- **financing_status_history** (8 cols): from/to status changes

### Lenders (2 tables)

- **lenders** (14 cols): company-scoped lender config
- **lender_products** (28 cols): product terms, rates, fee structure, TPO config, state availability

### Pricing (4 tables)

- **pricing_configs** (21 cols): PPW-based pricing with adjustments, market-scoped
- **adder_templates** (20 cols): reusable adder definitions with dynamic input schemas
- **adder_scope_rules** (6 cols): inclusion/exclusion rules for adder availability
- **installer_markets** (9 cols): state/region market definitions

### Documents (2 tables)

- **document_templates** (14 cols): signing provider templates with merge field mapping
- **document_envelopes** (19 cols): sent documents with signature tracking, soft delete

### Gates (2 tables)

- **gate_definitions** (13 cols): configurable submission gates per stage
- **gate_completions** (11 cols): per-deal gate status

### Workflow (2 tables — added by Cursor)

- **workflow_step_definitions** (14 cols): configurable steps with type, order, blocking flag
- **deal_workflow_progress** (9 cols): per-deal step completion with status and data

### Files (1 table)

- **attachments** (15 cols): deal_id or contact_id linked, category, enerflo_file_id, repcard_attachment_id, soft delete

### Notes (2 tables)

- **notes** (14 cols): deal_id or contact_id linked, visibility (team/private/all), pinnable, edit tracking, soft delete
- **note_edits** (5 cols): previous content snapshots

### History/Audit (5 tables)

- **deal_stage_history** (8 cols): from/to stage with metadata
- **deal_assignment_history** (10 cols): closer/setter/office reassignments
- **contact_change_history** (8 cols): field-level changes with source
- **deal_snapshots** (7 cols): point-in-time deal state (JSONB)
- **audit_log** (9 cols): generic change log with IP/user-agent

### Integrations (4 tables)

- **webhook_events** (12 cols): all inbound webhooks with payload, status, related entities
- **integration_sync_log** (11 cols): outbound API calls with request/response
- **aurora_pricing_syncs** (9 cols): Aurora-specific sync tracking
- **repcard_sync_state** (8 cols): RepCard bulk sync cursor/status

### Activity/Notifications (2 tables)

- **activities** (9 cols): timeline events (deal_id or contact_id scoped)
- **notifications** (10 cols): per-user notifications with read tracking

### Commissions (2 tables)

- **commission_structures** (13 cols): company-level commission config with tiers
- **deal_commissions** (16 cols): per-deal, per-user commission calculations

### User Preferences (1 table — added by Cursor)

- **filter_presets** (10 cols): saved filter configurations per user per entity type

---

## VIEWS (2)

- **v_deal_detail** (108 cols): deals JOIN contacts, users (closer + setter), offices, teams, lenders — includes all 14 Aurora design fields from deals
- **v_deal_pipeline** (20 cols): compact pipeline view with names for kanban

---

## SCHEMA DRIFT FROM BLUEPRINT

### Users table — significant divergence:

| Blueprint Field     | Live Equivalent  | Status             |
| ------------------- | ---------------- | ------------------ |
| kin_id              | —                | ❌ Missing         |
| avatar_url          | image_url        | ✅ Renamed         |
| job_title           | —                | ❌ Missing         |
| repcard_username    | —                | ❌ Missing         |
| repcard_badge_no    | repcard_badge_id | ✅ Renamed         |
| sequifi_id          | —                | ❌ Missing         |
| captiveiq_id        | —                | ❌ Missing         |
| quickbase_record_id | —                | ❌ Missing         |
| last_active_at      | last_login_at    | ✅ Renamed         |
| is_active           | status (enum)    | ✅ Changed to enum |

**Action needed:** Add kin_id, job_title, sequifi_id, captiveiq_id, quickbase_record_id in future migration.

---

## STILL NEEDED

1. **Data retention/archival** — no strategy for webhook_events, integration_sync_log growth
2. **Commission snapshots** — freeze commission numbers at submission time
3. **Proposal versioning** — editing draft overwrites previous values
4. **Reporting indexes** — defer to reporting epic

---

## EPIC 6 AURORA FIELDS (Migration 010 — applied)

**deals.design_status** (TEXT, default `'not_started'`, CHECK): `not_started` | `consumption_entered` | `project_created` | `design_requested` | `design_in_progress` | `design_completed` | `design_rejected` | `design_accepted`. Tracks Aurora design workflow; stage transitions (e.g. to `design_complete`) are driven by pipeline, but design_status reflects Aurora-side state for webhooks and UI.

**Consumption data (per-deal snapshot):** `monthly_kwh` (JSONB — array of 12 numbers [jan…dec]), `annual_kwh` (NUMERIC), `utility_company`, `utility_tariff`, `monthly_bill` (NUMERIC). Relationship to stage: consumption is entered before design request; design_status and stage can advance together when design is completed.

**Design request metadata:** `aurora_design_request_id`, `design_request_type` (`design_team` | `auto_designer` | `sales_mode`), `design_requested_at`, `design_completed_at`, `design_request_notes`, `target_offset` (default 105), `roof_material`, `aurora_sales_mode_url`.

**Indexes:** `idx_deals_aurora_design_request`, `idx_deals_aurora_project`, `idx_deals_design_status`.

---

## UPCOMING SCHEMA CHANGES (Epic 6+)

- Equipment catalog table or company settings for approved Aurora panels/inverters (if needed)
