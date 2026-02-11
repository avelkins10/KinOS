# KinOS Project Knowledge Base

> Last updated: 2026-02-11
> Schema verified against live Supabase database (47 tables + 2 views).
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
| Aurora Tenant    | 034b1c47-310a-460f-9d5d-b625dd354f12    | KIN Home tenant                    |

---

## 3. Database Schema (Verified 2026-02-11)

**Base migration:** `kinos-migration-v1.sql` (1,744 lines) — deployed 2026-02-10
**Additional migrations:** 002 (get_user_company_id function), 003 (seed test data), 004 (pipeline stages — superseded by 005), 005 (revert to 19 blueprint stages), 006 (filter_presets + workflow tables), 007 (appointments table + indexes + auth_user_id helper), 008 (storage attachments bucket), 009 (contact lead_status column)

### Live Object Count: 47 tables + 2 views

**Org Hierarchy (4):** companies, offices, teams, roles
**Users (3):** users (34 cols), user_lender_credentials, user_integration_settings
**CRM Core (7):** contacts (44 cols), deals (78 cols), proposals (70 cols), proposal_arrays, proposal_adders, proposal_discounts
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
**History/Audit (5):** deal_stage_history, deal_assignment_history, contact_change_history, deal_snapshots, audit_log
**Integrations (4):** webhook_events, integration_sync_log, aurora_pricing_syncs, repcard_sync_state
**Activity (2):** activities, notifications
**Commissions (2):** commission_structures, deal_commissions
**UI (1):** filter_presets

**Views (2):**
- v_deal_detail (94 cols) — full deal with joined contact, closer, setter, office, team, lender
- v_deal_pipeline (20 cols) — compact pipeline view for kanban/list

### Key Schema Features:

- `updated_by UUID` on all major tables
- `deleted_at` / `deleted_by` soft deletes on: contacts, deals, proposals, attachments, notes, financing_applications, document_envelopes
- Postgres triggers: auto `updated_at`, auto `deal_number` generation (KIN-2026-00001), auto stage history, auto assignment history, auto contact change tracking
- 37+ RLS policies: company isolation, soft-delete filtering, admin-only audit tables, role-based appointment visibility
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

### Aurora Fields on Deals (already exist):
aurora_project_id (TEXT), aurora_design_id (TEXT), system_size_kw, annual_production_kwh, offset_percentage, panel_count, panel_model, inverter_model, battery_model, battery_count, mounting_type
**Still needed for Epic 6:** aurora_design_request_id (TEXT)

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
- `/api/deals/transition` — Stage transitions
- `/api/contacts` — Contacts CRUD
- `/api/contacts/[id]` — Contact detail + assign
- `/api/appointments` — Appointments CRUD + cancel
- `/api/attachments` — Attachments CRUD
- `/api/notes` — Notes CRUD
- `/api/filter-presets` — Filter presets CRUD
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
| appointment_update   | `/api/webhooks/repcard/appointment-update`    | Updates appointment fields (time, location, closer) |
| appointment_outcome  | `/api/webhooks/repcard/appointment-outcome`   | Records outcome, updates appointment status         |
| closer_update        | `/api/webhooks/repcard/closer-update`         | Reassigns deal closer                               |
| status_changed       | `/api/webhooks/repcard/status-changed`        | Updates contact repcard_status                      |
| contact_type_changed | `/api/webhooks/repcard/contact-type-changed`  | Updates contact type                                |
| door_knocked         | `/api/webhooks/repcard/door-knocked`          | Logs activity, creates/updates contact              |

### 5.3 User Sync (RepCard → KinOS)

RepCard is source of truth for users. KinOS syncs via:
- GET /api/users/minimal (bulk), GET /api/users/{id}/details (individual), PUT /api/users/{id} (push KIN ID to externalId)

### 5.4 Design Flow (KinOS → Aurora) — Epic 6

1. Closer enters consumption data → KinOS POST /projects + PUT /consumption_profile
2. Closer clicks "Request Design" → KinOS POST /design_requests (sla=180, auto_accept=true)
3. Aurora designers build 3D model (async, minutes to hours)
4. Aurora fires GET webhook to KinOS with design_request_id + status in query params
5. KinOS calls GET /design_requests/{id} → gets design_id → GET /designs/{id}/summary
6. Results stored on deal, stage → design_complete
7. Closer reviews in KinOS or opens Sales Mode link

**Aurora webhooks are GET requests with data in URL query parameters (not POST with JSON body).**

### 5.5 Proposal & Pricing Flow

Design data → pricing engine (base PPW × system + adders - discounts + dealer fee) → lender terms → ITC → finalize → snapshot → advance

### 5.6 Submission Flow (KinOS → Quickbase)

All gates checked → deal data compiled → submitted to Quickbase → intake review → approval/rejection

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

| Action | Method | Endpoint |
|--------|--------|----------|
| Create project | POST | /tenants/{tid}/projects |
| Update project | PUT | /tenants/{tid}/projects/{pid} |
| Get/Update consumption profile | GET/PUT | /tenants/{tid}/projects/{pid}/consumption_profile |
| Create design request | POST | /tenants/{tid}/design_requests |
| Get design request | GET | /tenants/{tid}/design_requests/{id} |
| Accept design | POST | /tenants/{tid}/design_requests/{id}/accept |
| Get design summary | GET | /tenants/{tid}/designs/{did}/summary |
| Get design assets | GET | /tenants/{tid}/designs/{did}/assets |
| List modules | GET | /tenants/{tid}/modules |
| List inverters | GET | /tenants/{tid}/inverters |

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

| Epic | Name                           | Status      | Notes                                                                                           |
| ---- | ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| 0    | Infrastructure                 | ✅ Complete | Supabase, GitHub, Vercel, schema deployed                                                       |
| 1    | Auth & User System             | ✅ Complete | Supabase Auth, proxy.ts (Next.js 16), RepCard user sync                                         |
| 2    | RepCard Integration            | ✅ Complete | Connector webhook, contact/deal creation, user sync                                             |
| 3    | Pipeline & Deal Management     | ✅ Complete | Kanban, drag-drop, 19 stages, realtime, dashboard, deal detail                                  |
| 4    | Leads Management               | ✅ Complete | Leads list, lead detail page, notes, attachments, CSV import, filter presets                    |
| 5    | Calendar & Appointments        | ✅ Complete | 7 RepCard webhook routes, appointments table, calendar (day/week/month/list), dashboard widgets |
| 6    | Aurora Design Integration      | 📋 Planned  | Consumption form, design requests, Aurora API/webhooks, Sales Mode                              |
| 7    | Proposal & Pricing Engine      | 📋 Planned  |                                                                                                 |
| 8    | Financing & Lender Integration | 📋 Planned  |                                                                                                 |
| 9    | Document Signing               | 📋 Planned  |                                                                                                 |
| 10   | Submission & Gating Engine     | 📋 Planned  |                                                                                                 |
| 11   | Admin Panel                    | 📋 Planned  |                                                                                                 |
| 12   | Reports & Analytics            | 📋 Planned  |                                                                                                 |

---

## 10. Key Architecture Decisions

| Decision              | Resolution                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| Next.js version       | 16 (App Router). Middleware renamed to proxy.ts.                            |
| Auth strategy         | Supabase Auth + RLS. No self-registration. Admin creates accounts.          |
| Client component data | API routes, NOT direct server action imports                                |
| RepCard lead flow     | Manual push via connector (not automatic webhook)                           |
| Pipeline scope        | KinOS ends at intake_approved. Install tracking = Quickbase.                |
| Aurora integration    | API for actions + webhooks for reactions. Both needed.                       |
| Aurora project timing | Create at consumption step, not appointment (don't waste API on no-shows)   |
| Aurora auto-accept    | auto_accept=true on design requests (reduce closer manual steps)            |
| Equipment ownership   | Split: Aurora owns catalog, KinOS owns business logic/pricing               |
| Document signing      | PandaDoc primary, SignNow fallback                                          |
| Commission flow       | KinOS → Quickbase → Sequifi/CaptiveIQ (no direct push)                      |
| Launch strategy       | Full cutover from Enerflo. New deals in KinOS, old deals finish in Enerflo. |
| Pricing engine        | Typed TypeScript service with Big.js, not configurable function graph       |

---

## 11. Open Items / Future Work

- [ ] Epic 6: Aurora integration (consumption, design requests, webhooks, Sales Mode)
- [ ] Add missing user fields: kin_id, job_title, sequifi_id, captiveiq_id, quickbase_record_id
- [ ] Genability/UtilityAPI integration for utility rate lookup (Option B)
- [ ] v2: Installs tab — read-only Quickbase install progress visibility
- [ ] Data retention/archival strategy (year 2+)
- [ ] Reporting indexes (add when building reports)
- [ ] Review request tracking (Google reviews)
- [ ] Change order workflow (post-v1)
