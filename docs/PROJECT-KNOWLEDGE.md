# KinOS Project Knowledge Base

> Last updated: 2026-02-12
> Schema verified against live Supabase database (52 tables + 2 views). Migrations 001-017 applied.
> Epic 10 complete — Submission & Gating Engine (DB-driven gate checklist, auto-evaluation, frozen deal snapshots, submission adapter).
> This is the single source of truth for the KinOS project.

---

## 1. What is KinOS?

KinOS is a custom solar CRM replacing Enerflo for KIN Home Solar. It manages the full deal lifecycle from lead intake through installation submission.

**Tech Stack:**

- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- Hosting: Vercel
- Source Control: GitHub (private repo)

**Key Integrations:**

- RepCard (lead intake via 7 webhooks, user sync)
- Aurora Solar (design, proposals, financing) — API + webhooks
- PandaDoc / SignNow (document signing)
- Quickbase (submission/installation tracking)
- LightReach, GoodLeap, Mosaic, etc. (lender APIs)

---

## 2. Infrastructure

| Resource         | URL/ID                                   | Notes                              |
| ---------------- | ---------------------------------------- | ---------------------------------- |
| GitHub Repo      | https://github.com/avelkins10/KinOS.git  | Private                            |
| Supabase Project | https://tmfbggewmqcwryhzgrct.supabase.co | Project ref: tmfbggewmqcwryhzgrct  |
| Vercel           | https://kin-os-one.vercel.app            | Deployed, auto-deploys from GitHub |
| RepCard API      | https://app.repcard.com/api/             | x-api-key auth                     |
| Aurora API       | https://api.aurorasolar.com              | Bearer token, API version 2024.05  |
| Aurora Tenant    | 034b1c47-310a-460f-9d5d-b625dd354f12     | KIN Home tenant                    |

---

## 3. Database Schema (Verified 2026-02-12)

**Base migration:** `kinos-migration-v1.sql` (1,744 lines) — deployed 2026-02-10
**Additional migrations:** 002 (get_user_company_id function), 003 (seed test data), 004 (pipeline stages — superseded by 005), 005 (revert to 19 blueprint stages), 006 (filter_presets + workflow tables), 007 (appointments table + indexes + auth_user_id helper), 008 (storage attachments bucket), 009 (contact lead_status column), 010 (Aurora design fields on deals — design_status, consumption, design request metadata, aurora_sales_mode_url; v_deal_detail updated to 108 cols), 011 (Epic 7: pricing_configs office_id, adder_templates pricing_tiers/is_manual_toggle/is_auto_apply, proposals is_goal_seek/goal_seek_target_gross/original_base_ppw), 012 (proposal_adders tier_selection + custom_amount columns, adder_templates is_customer_facing rename to is_customer_visible), 013 (deal_adders table + RLS, deals.aurora_proposal_id; contacts.latitude/longitude already existed — ADD IF NOT EXISTS was no-op), 014 (adder_scope_rules RLS policy — cascade through adder_templates.company_id; fixes silent empty-result bug breaking scope-rule-based adder filtering), 015 (document_templates check constraint expansion — add 'manual' provider + 'contract'/'notice'/'authorization' document types for Epic 9), 016 (Epic 10: deal_snapshots.submission_attempt, deals.quickbase_record_id + rejection_reasons JSONB, gate_completions.value, clean slate gates, 8-type gate CHECK constraint), 017 (RLS policies for 5 tables: financing_status_history, contact_change_history, note_edits, equipment_market_availability, aurora_pricing_syncs)
**Seed data (local dev):** `supabase/seed/epic7-pricing-seed.sql` — 3 installer markets, 10 lenders, 12 lender products, 3 pricing configs, 36 adder templates, 13 scope rules, 9 workflow steps, 11 gate definitions, 5 test contacts, 5 test deals
**Seed data (Epic 9):** `supabase/seed/epic9-contracting-seed.sql` — 4 document templates, 6 envelopes (mix of statuses), 6 notifications
**Seed data (Epic 10):** `supabase/seed/epic10-gates-seed.sql` — 13 pre-intake checklist gates from blueprint §10.2 (replaces old 11 scaffolding gates)
**Full column-level schema:** `docs/schema-reference.md` (auto-generated from live DB)

### Live Object Count: 51 tables + 2 views

**Org Hierarchy (4):** companies, offices, teams, roles
**Users (3):** users (34 cols), user_lender_credentials, user_integration_settings
**CRM Core (8):** contacts (44 cols), deals (93 cols), proposals (72 cols), proposal_arrays, proposal_adders, proposal_discounts, deal_adders
**Tags (2):** tags, deal_tags
**Appointments (1):** appointments (24 cols) — Epic 5
**Equipment (2):** equipment, equipment_market_availability
**Financing (2):** financing_applications, financing_status_history
**Lenders (2):** lenders, lender_products (28 cols)
**Pricing (4):** installer_markets, pricing_configs, adder_templates, adder_scope_rules
**Documents (2):** document_templates, document_envelopes
**Gates (2):** gate_definitions, gate_completions
**Workflow (2):** workflow_step_definitions, deal_workflow_progress
**Files (1):** attachments
**Notes (2):** notes, note_edits
**Communications (1):** communication_log (19 cols)
**History/Audit (5):** deal_stage_history, deal_assignment_history, contact_change_history, deal_snapshots, audit_log
**Integrations (4):** webhook_events, integration_sync_log, aurora_pricing_syncs, repcard_sync_state
**Activity (2):** activities, notifications
**Commissions (2):** commission_structures, deal_commissions
**UI (1):** filter_presets

**Views (2):**

- v_deal_detail (108 cols) — full deal with joined contact, closer, setter, office, team, lender; includes all 14 Aurora design fields from deals
- v_deal_pipeline (20 cols) — compact pipeline view for kanban/list

### Key Schema Features:

- `updated_by UUID` on all major tables
- `deleted_at` / `deleted_by` soft deletes on: contacts, deals, proposals, attachments, notes, financing_applications, document_envelopes
- Postgres triggers: auto `updated_at`, auto `deal_number` generation (KIN-2026-00001), auto stage history, auto assignment history, auto contact change tracking
- 38+ RLS policies: company isolation, soft-delete filtering, admin-only audit tables, role-based appointment visibility
- Deal number format: `KIN-{YEAR}-{SEQUENCE}` (auto-generated)
- Appointments: status constraint (scheduled/confirmed/completed/no_show/cancelled/rescheduled), type constraint (in_home/virtual/phone/follow_up), `duration_minutes DEFAULT 60`, `is_active` flag

### Schema Drift from Blueprint (Users table):

Live users table differs from blueprint. Missing fields that will be needed:

- `kin_id` — KIN-generated unique ID (needed for onboarding platform integration)
- `job_title` — rep's role title
- `sequifi_id` — Sequifi rep ID (commission push)
- `captiveiq_id` — CaptiveIQ rep ID (commission push)
- `quickbase_record_id` — Quickbase user record (submission)
- `repcard_username` — RepCard username

Renamed: avatar_url→image_url, is_active→status (enum), last_active_at→last_login_at, repcard_badge_no→repcard_badge_id
Added by Cursor: bio, external_id, activated_at, deactivated_at, invited_at, license_expiry, license_state

### Aurora Fields on Deals:

**Existing:** aurora_project_id, aurora_design_id, system_size_kw, annual_production_kwh, offset_percentage, panel_count, panel_model, inverter_model, battery_model, battery_count, mounting_type  
**Added by migration 010 (Epic 6 Part 1):** aurora_design_request_id, design_status (not_started | consumption_entered | project_created | design_requested | design_in_progress | design_completed | design_rejected | design_accepted), consumption (monthly_kwh JSONB, annual_kwh, utility_company, utility_tariff, monthly_bill), design request metadata (design_request_type, design_requested_at, design_completed_at, design_request_notes, target_offset, roof_material), aurora_sales_mode_url. Architecture: API for actions (create project, consumption, design request); GET webhooks with query params for design completion; service layer + typed client (Part 2).

---

## 4. Deal Lifecycle (Pipeline Stages)

19 stages matching blueprint §9:

```
new_lead → appointment_set → appointment_sat → design_requested →
design_complete → proposal_sent → proposal_accepted → financing_applied →
financing_approved → stips_pending → stips_cleared → contract_sent →
contract_signed → submission_ready → submitted → intake_approved
                                                → intake_rejected
Also: cancelled, lost
```

**Stage categories:**

- Lead: new_lead, appointment_set, appointment_sat
- Design: design_requested, design_complete
- Proposal: proposal_sent, proposal_accepted
- Financing: financing_applied, financing_approved, stips_pending, stips_cleared
- Contract: contract_sent, contract_signed
- Submission: submission_ready, submitted, intake_approved, intake_rejected
- Closed: cancelled, lost

**Terminal stages:** intake_approved (deal moves to Quickbase), cancelled, lost
**Revivable:** lost → appointment_set (can revive lost deals)
**Backward allowed:** design_complete/proposal_sent → design_requested (redesign)

**Important:** KinOS pipeline ENDS at intake_approved. Everything after lives in Quickbase.

### App Routes

**Pages:**

- `/` — Dashboard (pipeline summary, appointments widget, activity feed, financing alerts)
- `/deals` — Deals list (kanban + list views, filters, drag-drop stage transitions)
- `/deals/[id]` — Deal detail (workflow stepper, tabs: overview, financing, files, submission)
- `/leads` — Leads management (list, filters, CSV import, create lead dialog)
- `/leads/[id]` — Lead detail (contact info, assignments, appointments, deals, notes, attachments)
- `/calendar` — Calendar (day/week/month/list views, appointment cards)
- `/reports` — Reports (pipeline funnel, stage distribution)
- `/design-requests` — Design requests queue
- `/admin/*` — Admin panels (equipment, gates, integrations, lenders, offices, pricing, users)
- `/login` — Auth login page

**API Routes:**

- `/api/deals` — Deals CRUD + search
- `/api/deals/[id]/notes` — Deal notes
- `/api/deals/[id]/aurora` — Aurora actions (create_project, save_consumption, submit_design_request)
- `/api/deals/transition` — Stage transitions
- `/api/contacts` — Contacts CRUD
- `/api/contacts/[id]` — Contact detail + assign
- `/api/appointments` — Appointments CRUD + cancel
- `/api/attachments` — Attachments CRUD
- `/api/notes` — Notes CRUD
- `/api/filter-presets` — Filter presets CRUD
- `/api/notifications` — Notifications GET (list) + PATCH (mark read)
- `/api/deals/[id]/documents` — Document envelopes GET (list) + POST (create/send packet) + PATCH (update status)
- `/api/webhooks/repcard/*` — 7 RepCard webhook routes (see 5.2)
- `/api/webhooks/aurora` — Aurora design webhooks

---

## 5. Data Flow Architecture

### 5.1 Lead Intake (RepCard → KinOS)

**Trigger:** Rep manually clicks "Send to KinOS" button in RepCard Connectors.

**RepCard Connector Config:**

- Connector Type: Custom, Type: Web, Method: POST
- URL: `https://kin-os-one.vercel.app/api/webhooks/repcard/create-lead`

**Fields sent:** Contact (id, name, email, phone, address, type, statusId) + User (id, name, email, jobTitle)

### 5.2 RepCard Webhook Routes (7 events — all wired)

The legacy `/api/webhooks/repcard` (create-lead) route delegates to `/appointment-set`.

| Event                | Route                                        | Handler                                             |
| -------------------- | -------------------------------------------- | --------------------------------------------------- |
| appointment_set      | `/api/webhooks/repcard/appointment-set`      | Creates contact + deal + appointment                |
| appointment_update   | `/api/webhooks/repcard/appointment-update`   | Updates appointment fields (time, location, closer) |
| appointment_outcome  | `/api/webhooks/repcard/appointment-outcome`  | Records outcome, updates appointment status         |
| closer_update        | `/api/webhooks/repcard/closer-update`        | Reassigns deal closer                               |
| status_changed       | `/api/webhooks/repcard/status-changed`       | Updates contact repcard_status                      |
| contact_type_changed | `/api/webhooks/repcard/contact-type-changed` | Updates contact type                                |
| door_knocked         | `/api/webhooks/repcard/door-knocked`         | Logs activity, creates/updates contact              |

### 5.3 User Sync (RepCard → KinOS)

RepCard is source of truth for users. KinOS syncs via:

- GET /api/users/minimal (bulk), GET /api/users/{id}/details (individual), PUT /api/users/{id} (push KIN ID to externalId)

### 5.4 Design Flow (KinOS → Aurora) — Epic 6

**Three design paths:**

1. **Design Team (in-house)** — Closer requests design → KinOS updates deal status + sends Slack notification (Zapier for now) → Designer picks up from queue → opens Aurora to design → syncs results back. Does NOT call Aurora's createDesignRequest API (that sends to Aurora's external paid team).
2. **Sales Mode (self-design)** — Closer opens Aurora Sales Mode link, designs themselves. Returns sales_mode_url.
3. **Expert Design (Aurora's team)** — Outsourced to Aurora designers via createDesignRequest API. Backup/premium option. SLA=180min, auto_accept=true.

**Common steps (all paths):**

- Closer enters consumption data → KinOS POST /projects + PUT /consumption_profile
- Aurora project created at consumption step (not earlier — don't waste API on no-shows)
- Design results stored on deal, stage → design_complete

**Aurora webhooks (paths 3 only):**

- Aurora fires GET webhook to KinOS with design_request_id + status in query params
- KinOS calls GET /design_requests/{id} → gets design_id → GET /designs/{id}/summary

**Current state:** Designers use Enerflo's Design Requests portal as their queue. KinOS Design Queue (Epic 10+) will replace this. See `docs/design-queue-research.md`.

**Aurora webhooks are GET requests with data in URL query parameters (not POST with JSON body).**

### 5.5 Proposal & Pricing Flow (Epic 7) — Implemented

Design data → pricing engine (base PPW × system + adders - discounts + dealer fee) → lender terms → ITC → finalize → snapshot → advance.

**Pricing engine:** `lib/utils/pricing.ts` — Pure TypeScript with Big.js for money math. Full waterfall: base PPW × watts → + equipment → + system adders (auto) → + value adders (manual) → + tax → ÷ dealer fee factor (gross-up) → - discounts → - rebates → = gross cost → - ITC (30%) → = net cost → monthly payment. Goal-seek: inverse-solve PPW from target gross cost.

**Server actions:**

- `lib/actions/proposals.ts` — getProposalsByDeal, createProposal, updateProposal, finalizeProposal, unfinalizeProposal, deleteProposal, duplicateProposal
- `lib/actions/pricing-data.ts` — getActivePricingConfig (office → market → company waterfall), getLendersWithProducts, getInstallerMarket
- `lib/actions/aurora-pricing-sync.ts` — syncPricingToAurora, logAuroraPricingSync (push KinOS pricing to Aurora design)
- `lib/actions/financing.ts` — getFinancingApplicationsByDeal, createFinancingApplication, updateFinancingStatus, deleteFinancingApplication (with stage auto-transitions, status history logging, activity logging)

**Types:**

- `lib/types/financing.ts` — FinancingStatus union (11 values), FinancingApplicationWithRelations, CreateFinancingInput, UpdateFinancingStatusInput
- `lib/integrations/lenders/types.ts` — LenderAdapter interface, ManualLenderAdapter (default no-op adapter for manual status tracking)

**UI:** `components/deals/detail/steps/proposal-step.tsx` with sub-components:

- `proposal-list.tsx` — tab bar for multiple proposals per deal
- `proposal-pricing-card.tsx` — base PPW input, goal-seek, PPW slider (min/max), live recalc
- `proposal-adders-card.tsx` — auto-applied (locked) + manual toggle sections, tiered dropdowns, custom amount inputs
- `proposal-financing-card.tsx` — lender/product selectors, dealer fee display, monthly payment
- `proposal-summary-card.tsx` — full waterfall breakdown, commission base, ITC

**Adder resolution:** Scope rules evaluated against deal context (state, system size, lender, equipment). `is_auto_apply=true` → system adder (locked). `is_manual_toggle=true` → value adder (rep toggles). Tiered adders use `pricing_tiers` JSONB for dropdown selection.

**Key behaviors:**

- All pricing recalculates on any input change (debounced 300ms)
- Lender change → re-evaluate lender-specific adders, recalculate dealer fee + monthly payment
- Goal-seek: closer enters target gross → engine solves for base PPW within admin min/max bounds
- Finalize: locks proposal, sets deal.active_proposal_id, advances stage to proposal_sent, logs activity
- Multiple proposals per deal for side-by-side comparison (loan vs lease, with/without battery)

### 5.6 Submission & Gating Engine (Epic 10)

**Server actions:**

- `lib/actions/gates.ts` — getGateStatus, evaluateGates (auto-evaluation for document_signed/file_uploaded/financing_status), completeGate, uncompleteGate
- `lib/actions/submission.ts` — assembleSubmissionPayload, submitDeal (freeze snapshot → adapter → stage transition → notify), rejectDeal (structured reasons), getSubmissionHistory

**Types:**

- `lib/integrations/submission/types.ts` — SubmissionProvider interface, SubmissionPayload interface
- `lib/integrations/submission/manual-provider.ts` — ManualSubmissionProvider (no-op adapter, Quickbase API stubbed)

**UI:**

- `components/deals/detail/steps/submission-step.tsx` — PreIntakeStep: DB-driven gate checklist with interactive controls per gate type (checkbox toggle, select dropdown, text input, boolean switch, auto-check badge)
- `components/deals/detail/steps/project-submission-step.tsx` — ProjectSubmissionStep: review summary, submit button, submitted/rejected/history views

**Gate types (8):** document_signed, file_uploaded, financing_status, stage_reached, field_required, checkbox, question, external_status

**Flow:** All required gates pass → auto-advance to submission_ready → closer reviews & submits → frozen JSONB snapshot in deal_snapshots → ManualSubmissionProvider.submit() → stage to submitted → notifications to closer + managers. Rejection: structured reasons (JSONB array), stage to intake_rejected, Fix & Resubmit returns to submission_ready.

---

## 6. RepCard API Reference

Base URL: `https://app.repcard.com/api` | Auth: `x-api-key` header

| Method | Endpoint                                               | Description              |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | /users/minimal?company_id={id}&per_page={n}&search={q} | List users               |
| GET    | /users/{id}/details                                    | Get user details         |
| PUT    | /users/{id}                                            | Update user              |
| POST   | /users/{id}/unlink                                     | Remove user              |
| PUT    | /users/{id}/activate-deactivate                        | Activate/deactivate user |
| GET    | /customers/{id}                                        | Get customer             |
| GET    | /customers/{id}/attachments?per_page={n}               | Get attachments          |

---

## 7. Aurora Solar API Reference

**Base URL:** `https://api.aurorasolar.com`
**Auth:** `Authorization: Bearer {api_key}` + `X-Aurora-Api-Version: 2024.05`
**Tenant ID:** `034b1c47-310a-460f-9d5d-b625dd354f12`

| Action                         | Method  | Endpoint                                          |
| ------------------------------ | ------- | ------------------------------------------------- |
| Create project                 | POST    | /tenants/{tid}/projects                           |
| Update project                 | PUT     | /tenants/{tid}/projects/{pid}                     |
| Get/Update consumption profile | GET/PUT | /tenants/{tid}/projects/{pid}/consumption_profile |
| Create design request          | POST    | /tenants/{tid}/design_requests                    |
| Get design request             | GET     | /tenants/{tid}/design_requests/{id}               |
| Accept design                  | POST    | /tenants/{tid}/design_requests/{id}/accept        |
| Get design summary             | GET     | /tenants/{tid}/designs/{did}/summary              |
| Get design assets              | GET     | /tenants/{tid}/designs/{did}/assets               |
| List modules                   | GET     | /tenants/{tid}/modules                            |
| List inverters                 | GET     | /tenants/{tid}/inverters                          |

### Aurora Webhook Events (pipeline-critical):

- design_request_completed, design_request_rejected
- performance_simulation_job_completed
- agreement_status_changed, financier_contract_status_changed

### Sales Mode Deeplink:

`https://v2.aurorasolar.com/projects/{project_id}/designs/{design_id}/e-proposal/overview`

### Test Addresses (instant complete, no credits):

- 901 Mears Ct, Stanford, CA 94305 — Gabled roof
- 634 Mirada Ave, Stanford, CA 94305 — Hipped roof
- 600 Montgomery St, San Francisco, CA 94111 — Rejection test (TransAmerica Pyramid)

---

## 8. Enerflo Payload Structure (Reference)

See enerflo-payload-analysis.md and schema-updates-from-enerflo.md for full details.
Enerflo's deal.projectSubmitted webhook is the template for Quickbase submission compatibility.

---

## 9. Epic Completion Status

| Epic | Name                             | Status      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Infrastructure                   | ✅ Complete | Supabase, GitHub, Vercel, schema deployed                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1    | Auth & User System               | ✅ Complete | Supabase Auth, proxy.ts (Next.js 16), RepCard user sync                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2    | RepCard Integration              | ✅ Complete | Connector webhook, contact/deal creation, user sync                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3    | Pipeline & Deal Management       | ✅ Complete | Kanban, drag-drop, 19 stages, realtime, dashboard, deal detail                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4    | Leads Management                 | ✅ Complete | Leads list, lead detail page, notes, attachments, CSV import, filter presets                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 5    | Calendar & Appointments          | ✅ Complete | 7 RepCard webhook routes, appointments table, calendar (day/week/month/list), dashboard widgets                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6    | Aurora Design Integration        | ✅ Complete | Migration 010, API client, service layer, webhooks, UI: ConsumptionForm, DesignRequestForm, DesignResultsCard, DesignStatusBadge; consumption + designs steps in deal workflow.                                                                                                                                                                                                                                                                                                                         |
| 7    | Proposal & Pricing Engine        | ✅ Complete | Migrations 011+012, pricing engine (Big.js waterfall), server actions (proposals, pricing-data, aurora-pricing-sync), proposal step UI (pricing/adders/financing/summary cards), seed data. ProposalsTab wired to real data.                                                                                                                                                                                                                                                                            |
| 8    | Financing & Lender Integration   | ✅ Complete | Server actions (financing.ts), types (financing.ts, lenders/types.ts), FinancingStep rewrite (submit/status/multi-app), FinancingTab rewrite (read-only summary), dashboard alerts wired to real data, getDeal() loads lender joins, seed data (4 apps across 4 statuses). Lender API adapters stubbed (ManualLenderAdapter).                                                                                                                                                                           |
| 9    | Document Signing + Notifications | ✅ Complete | Server actions (documents.ts, notifications.ts), types (notifications.ts, signing/types.ts), ManualSigningProvider adapter, merge-fields utility, notifications API route + bell component (Supabase Realtime), contracting step rewrite (real envelopes, status management, auto-advance), dashboard contract alerts, seed data.                                                                                                                                                                       |
| 10   | Submission & Gating Engine       | ✅ Complete | Server actions (gates.ts, submission.ts), types (submission/types.ts), ManualSubmissionProvider adapter, gate engine (13 blueprint §10.2 gates, auto-evaluation for document_signed/file_uploaded/financing_status), PreIntakeStep rewrite (DB-driven checklist, interactive controls per gate type), ProjectSubmissionStep rewrite (real submitDeal, frozen JSONB snapshots, rejection display, submission history), deal_snapshots.submission_attempt, deals.quickbase_record_id + rejection_reasons. |
| 11   | Admin Panel                      | 📋 Planned  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 12   | Reports & Analytics              | 📋 Planned  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## 10. Key Architecture Decisions

| Decision                  | Resolution                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js version           | 16 (App Router). Middleware renamed to proxy.ts.                                                                                                                                |
| Auth strategy             | Supabase Auth + RLS. No self-registration. Admin creates accounts.                                                                                                              |
| Client component data     | API routes, NOT direct server action imports                                                                                                                                    |
| RepCard lead flow         | Manual push via connector (not automatic webhook)                                                                                                                               |
| Pipeline scope            | KinOS ends at intake_approved. Install tracking = Quickbase.                                                                                                                    |
| Aurora integration        | API for actions + webhooks for reactions. Both needed.                                                                                                                          |
| Aurora project timing     | Create at consumption step, not appointment (don't waste API on no-shows)                                                                                                       |
| Aurora auto-accept        | auto_accept=true on design requests (reduce closer manual steps)                                                                                                                |
| Equipment ownership       | Split: Aurora owns catalog, KinOS owns business logic/pricing                                                                                                                   |
| Document signing          | PandaDoc primary, SignNow fallback                                                                                                                                              |
| Commission flow           | KinOS → Quickbase → Sequifi/CaptiveIQ (no direct push)                                                                                                                          |
| Launch strategy           | Full cutover from Enerflo. New deals in KinOS, old deals finish in Enerflo.                                                                                                     |
| Pricing engine            | Typed TypeScript service with Big.js, not configurable function graph. Pure functions, zero side effects.                                                                       |
| Adder scope rules         | Rule-based system: rule_type (state, lender, system_size_min/max, equipment) + rule_value (TEXT). is_auto_apply=true → locked system adder. is_manual_toggle=true → rep choice. |
| Dealer fee math           | Gross-up, not additive. Positive fee: cost / (1 - fee%). Negative fee: cost / (1 / (1 + abs(fee%))).                                                                            |
| Pricing config resolution | Waterfall: office-specific → market-specific → company default. Most specific active config wins.                                                                               |
| Seed data strategy        | Deterministic UUIDs (b0000001..., c0000001..., etc.) for FK references. ON CONFLICT DO NOTHING for idempotent reruns.                                                           |
| Design team workflow      | In-house designers use Enerflo queue → Aurora editor → sync back. NOT Aurora's external design API. KinOS "Design Team" = update status + Slack notify only.                    |
| Design queue              | Epic 10+ — replace Enerflo Design Requests portal. Incoming/In Progress/Completed, designer assignment, timer, Sync from Aurora. See docs/design-queue-research.md              |
| Zapier (interim)          | Keep Zapier→Slack for design team notifications until KinOS has native Slack integration                                                                                        |

---

## 11. Open Items / Future Work

- [x] Epic 6 Part 1: Migration 010 (Aurora design fields on deals, v_deal_detail, types, docs)
- [x] Epic 6 Part 2+: Aurora API client, service layer, webhooks, consumption form, design request form, design results card, design status badge, Sales Mode
- [x] Epic 7: Proposal & pricing engine (pricing.ts, proposals/pricing-data/aurora-pricing-sync actions, migrations 011+012, seed data, proposal step UI + cards)
- [ ] Epic 7: Unit tests for pricing engine (`lib/utils/__tests__/pricing.test.ts`)
- [ ] Epic 7: Production seed data — Austin to verify lender rates, dealer fees, adder amounts
- [ ] Add missing user fields: kin_id, job_title, sequifi_id, captiveiq_id, quickbase_record_id
- [ ] Genability/UtilityAPI integration for utility rate lookup (Option B)
- [ ] v2: Installs tab — read-only Quickbase install progress visibility
- [ ] Data retention/archival strategy (year 2+)
- [ ] Reporting indexes (add when building reports)
- [ ] Review request tracking (Google reviews)
- [ ] Change order workflow (post-v1)

### Mock Data Debt (10 files still importing from `lib/mock-data.ts`)

| File                                            | Imports              | Risk                      |
| ----------------------------------------------- | -------------------- | ------------------------- |
| `components/dashboard/activity-feed.tsx`        | RECENT_ACTIVITY      | HIGH — dashboard          |
| `components/dashboard/financing-alerts.tsx`     | FINANCING_ALERTS     | HIGH — dashboard          |
| `components/dashboard/leaderboard.tsx`          | REPS                 | HIGH — dashboard          |
| `components/deals/deals-page-client.tsx`        | LENDERS, SOURCES     | MEDIUM — filter dropdowns |
| `components/deals/detail/tabs/activity-tab.tsx` | RECENT_ACTIVITY      | MEDIUM — fallback         |
| `components/deals/detail/tabs/overview-tab.tsx` | RECENT_ACTIVITY      | MEDIUM — fallback         |
| `app/(crm)/admin/offices/page.tsx`              | OFFICES, REPS, DEALS | CRITICAL — full mock page |
| `app/(crm)/admin/users/page.tsx`                | REPS                 | CRITICAL — full mock page |
| `app/(crm)/reports/page.tsx`                    | DEALS, REPS          | CRITICAL — full mock page |
| `app/(crm)/design-requests/page.tsx`            | DEALS                | HIGH — full mock page     |

Each file has a `// TODO: Replace mock data with real Supabase query` comment. Replace these as pages get wired to real data (Epics 10-12).

### Pre-Ship (Epic 6)

- [ ] Fix submitDesignRequest() — "Design Team" path must skip Aurora createDesignRequest API, just update deal status + notify Slack
- [ ] Register Aurora webhooks in Aurora dashboard (design_request_completed, design_request_rejected, performance_simulation_completed)

### KinOS Design Queue (Epic 10+)

See `docs/design-queue-research.md` for full spec, Enerflo workflow analysis, and payload fields.

- [ ] `design_requests` table (queue, assignment, timer, sync, completion)
- [ ] Design queue page: Incoming / In Progress / Completed / Cancelled tabs
- [ ] Designer workflow: Start → Open in Aurora → Sync from Aurora → Complete
- [ ] "Sync from Aurora" — pull design summary, arrays, equipment, layout image via API
- [ ] Schema additions: panel_manufacturer, panel_wattage, inverter_manufacturer, battery_manufacturer, battery_purpose, design_arrays (JSONB), layout_image_url
- [ ] Redesign/revision tracking (design_request.revision_of)
- [ ] Genability (Arcadia) integration — utility lookup, tariff selection, post-solar NEM tariff
- [ ] Direct Slack integration (replace Zapier)
