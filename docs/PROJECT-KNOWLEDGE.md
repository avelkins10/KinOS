# KinOS Project Knowledge Base

> Last updated: 2026-02-11
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
- RepCard (lead intake, user sync)
- Aurora Solar (design, proposals, financing)
- PandaDoc / SignNow (document signing)
- Quickbase (submission/installation tracking)
- LightReach, GoodLeap, Mosaic, etc. (lender APIs)

---

## 2. Infrastructure

| Resource | URL/ID | Notes |
|----------|--------|-------|
| GitHub Repo | https://github.com/avelkins10/KinOS.git | Private |
| Supabase Project | https://tmfbggewmqcwryhzgrct.supabase.co | Project ref: tmfbggewmqcwryhzgrct |
| Vercel | https://kin-os-one.vercel.app | Deployed, auto-deploys from GitHub |
| RepCard API | https://app.repcard.com/api/ | x-api-key auth |
| Aurora API | https://docs.aurorasolar.com | Bearer token auth |

---

## 3. Database Schema

**Migration file:** `kinos-migration-v1.sql` (1,744 lines)
**Status:** ✅ Deployed to Supabase (2026-02-10)
**Additional migrations:** 002 (get_user_company_id function), 003 (seed test data), 005 (stage fix), 006 (filter_presets + workflow tables)

### Table Summary (43+ tables):

**Org Hierarchy:** companies, offices, teams, roles
**Users:** users, user_lender_credentials, user_integration_settings
**CRM Core:** contacts, deals, proposals, proposal_arrays, proposal_adders, proposal_discounts
**Equipment:** equipment, equipment_market_availability
**Financing:** lenders, lender_products, financing_applications, financing_status_history
**Pricing:** installer_markets, pricing_configs, adder_templates, adder_scope_rules
**Documents:** document_templates, document_envelopes
**Gates:** gate_definitions, gate_completions
**Workflow:** workflow_step_definitions, deal_workflow_progress
**Files:** attachments
**Notes:** notes, note_edits
**History/Audit:** deal_stage_history, deal_assignment_history, contact_change_history, deal_snapshots, audit_log
**Integrations:** webhook_events, integration_sync_log, aurora_pricing_syncs, repcard_sync_state
**Activity:** activities, notifications
**Commissions:** commission_structures, deal_commissions
**UI:** filter_presets

### Key Schema Features:
- `updated_by UUID` on all major tables
- `deleted_at` / `deleted_by` soft deletes on: contacts, deals, proposals, attachments, notes, financing_applications, document_envelopes
- Postgres triggers: auto `updated_at`, auto `deal_number` generation (KIN-2026-00001), auto stage history, auto assignment history, auto contact change tracking
- 37 RLS policies: company isolation, soft-delete filtering, admin-only audit tables
- Deal number format: `KIN-{YEAR}-{SEQUENCE}` (auto-generated)

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

**Important:** KinOS pipeline ENDS at intake_approved. Everything after (install scheduling, permitting, inspection, PTO) lives in Quickbase. A future v2 "Installs" tab will provide read-only visibility into Quickbase install progress.

---

## 5. Data Flow Architecture

### 5.1 Lead Intake (RepCard → KinOS)

**Trigger:** Rep manually clicks "Send to KinOS" button in RepCard Connectors.

**RepCard Connector Config:**
- Connector Type: Custom
- Type: Web
- Method: POST
- Title: "Send to KinOS"
- URL: `https://kin-os-one.vercel.app/api/webhooks/repcard/create-lead`

**Fields sent from RepCard:**

Contact Fields:
- customers.id (RepCard customer ID)
- customers.firstName, lastName, email, phoneNumber, fullPhoneNumber, countryCode
- customers.address, city, state, zip
- customers.type (Contact Type), statusId

User Fields:
- user.id, firstName, lastName, email, jobTitle

**KinOS webhook handler:**
1. Validates payload
2. Looks up or creates contact (match on repcard_customer_id or phone+email)
3. Looks up KinOS user by repcard_user_id
4. Creates deal at stage `new_lead`
5. Logs webhook event
6. Returns 200 OK

### 5.2 RepCard Webhook Events (7 events — only 1 wired currently)

| Event | Status | Handler |
|-------|--------|---------|
| appointment_set (via connector) | ✅ Wired | Creates contact + deal |
| appointment_update | ❌ Not wired | Should update deal appointment fields |
| appointment_outcome | ❌ Not wired | Should update deal appointment_outcome |
| closer_update | ❌ Not wired | Should reassign deal closer |
| status_changed | ❌ Not wired | Should update contact repcard_status |
| contact_type_changed | ❌ Not wired | Should update contact contact_type |
| door_knocked | ❌ Not wired | Log activity (low priority) |

### 5.3 User Sync (RepCard → KinOS)

RepCard is source of truth for users (reps). KinOS syncs via:
- RepCard GET /api/users/minimal (bulk sync)
- RepCard GET /api/users/{id}/details (individual)
- RepCard PUT /api/users/{id} (update, push KIN ID to externalId)

**RepCard API Auth:** Header `x-api-key: {api_key}`

### 5.4 Design Flow (KinOS → Aurora)

1. Closer enters consumption data (monthly bill, annual kWh)
2. Closer clicks "Request Design"
3. KinOS creates Aurora project via API (address, consumption profile)
4. Aurora designs system (async)
5. Aurora webhook fires `design_complete`
6. KinOS pulls design data (arrays, production, panel layout)
7. Closer builds proposal from design data

### 5.5 Proposal & Pricing Flow

1. Design data populates proposal (system size, panel count, production)
2. Pricing engine calculates: base PPW × system size + adders - discounts + dealer fee = gross price
3. Closer selects lender + product → financing terms applied
4. Federal rebate (ITC) calculated
5. Proposal finalized → snapshot taken → deal advances

### 5.6 Financing Flow

1. Closer selects lender and product on proposal
2. Financing application created and submitted to lender API
3. Status tracked: submitted → pending → approved/denied
4. Stips tracked as JSONB array
5. Welcome call / lender-specific gates checked

### 5.7 Document Signing Flow

1. Contract generated from PandaDoc/SignNow template
2. Merge fields populated from deal + proposal data
3. Sent to homeowner for signature
4. Webhook fires on signature events
5. Signed document URL stored

### 5.8 Submission Flow (KinOS → Quickbase)

1. All gates checked (utility bill uploaded, contract signed, financing cleared, etc.)
2. Deal data compiled (matches Enerflo's Quickbase payload structure)
3. Submitted to Quickbase
4. Snapshot taken at submission time
5. Intake team reviews in Quickbase
6. Approval/rejection flows back

---

## 6. RepCard API Reference

Base URL: `https://app.repcard.com/api`
Auth: `x-api-key` header

### Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/minimal?company_id={id}&per_page={n}&search={q} | List users |
| GET | /users/{id}/details | Get user details |
| PUT | /users/{id} | Update user |
| POST | /users/{id}/unlink | Remove user |
| PUT | /users/{id}/activate-deactivate | Activate/deactivate user |
| GET | /customers/{id} | Get customer |
| GET | /customers/{id}/attachments?per_page={n} | Get customer attachments |

### Key RepCard fields:

**User:** id, firstName, lastName, email, username, office, team, jobTitle, phoneNumber, badgeId, externalId
**Customer:** id, firstName, lastName, email, phoneNumber, address, city, state, zip, latitude, longitude, statusId, statusTitle, type, userId, ownerId, contactSource

### RepCard Connector Config:
- Located in RepCard admin → Connectors → Add Connector
- Each field can be toggled on/off for the payload
- See repcard-setup.md for full field list

---

## 7. Enerflo Payload Structure (Reference)

See enerflo-payload-analysis.md for full field-by-field comparison.
See schema-updates-from-enerflo.md for schema gaps identified and resolved.

Key: Enerflo's deal.projectSubmitted webhook structure is the template for Quickbase submission compatibility. All critical fields are mapped in the v1 schema.

---

## 8. Aurora Solar API Endpoints (Planned)

| Action | Method | Endpoint | When |
|--------|--------|----------|------|
| Create project | POST | /tenants/{tid}/projects | "Request Design" |
| Create consumption profile | POST | /tenants/{tid}/projects/{pid}/consumption_profiles | With project |
| Create design request | POST | /tenants/{tid}/projects/{pid}/design_requests | After consumption |
| Get designs | GET | /tenants/{tid}/projects/{pid}/designs | On webhook/poll |
| Get design summary | GET | /tenants/{tid}/designs/{did}/summary | Design complete |
| Get design assets | GET | /tenants/{tid}/designs/{did}/assets | Panel layout |
| Get/Set pricing | GET/PUT | /tenants/{tid}/designs/{did}/pricing | Pricing sync |
| Manage adders | POST/DELETE | /tenants/{tid}/designs/{did}/pricing/adders | Pricing sync |
| Get financings | GET | /tenants/{tid}/projects/{pid}/financings | After pricing |
| Get web proposal | GET | /tenants/{tid}/projects/{pid}/web_proposals | Shareable URL |
| Webhooks | — | Configured in Aurora | design_complete, etc. |

---

## 9. Epic Completion Status

| Epic | Name | Status | Notes |
|------|------|--------|-------|
| 0 | Infrastructure | ✅ Complete | Supabase, GitHub, Vercel, schema deployed |
| 1 | Auth & User System | ✅ Complete | Supabase Auth, proxy.ts (Next.js 16), RepCard user sync |
| 2 | RepCard Integration | ✅ Complete | Connector webhook, contact/deal creation, user sync |
| 3 | Pipeline & Deal Management | ✅ Complete | Kanban, drag-drop, 19 stages, realtime, dashboard, deal detail |
| 4 | Leads Management | 🔄 In Progress | Leads list, lead detail, notes, attachments, CSV import |
| 5 | Calendar & Appointments | 📋 Planned | |
| 6 | Aurora Design Integration | 📋 Planned | |
| 7 | Proposal & Pricing Engine | 📋 Planned | |
| 8 | Financing & Lender Integration | 📋 Planned | |
| 9 | Document Signing | 📋 Planned | |
| 10 | Submission & Gating Engine | 📋 Planned | |
| 11 | Admin Panel | 📋 Planned | |
| 12 | Reports & Analytics | 📋 Planned | |

---

## 10. Key Architecture Decisions

| Decision | Resolution |
|----------|-----------|
| Next.js version | 16 (App Router). Middleware renamed to proxy.ts. |
| Auth strategy | Supabase Auth + RLS. No self-registration. Admin creates accounts. |
| Client component data | API routes, NOT direct server action imports |
| RepCard lead flow | Manual push via connector (not automatic webhook) |
| Pipeline scope | KinOS ends at intake_approved. Install tracking = Quickbase. |
| Aurora integration | API + webhooks, no iframe. KinOS = pricing brain, Aurora = design layer. |
| Equipment ownership | Split: Aurora owns catalog, KinOS owns business logic/pricing |
| Document signing | PandaDoc primary, SignNow fallback |
| Commission flow | KinOS → Quickbase → Sequifi/CaptiveIQ (no direct push) |
| Launch strategy | Full cutover from Enerflo. New deals in KinOS, old deals finish in Enerflo. |
| Pricing engine | Typed TypeScript service with Big.js, not configurable function graph |
| v2 Installs tab | Read-only visibility into Quickbase install progress for closers |

---

## 11. Open Items / Future Work

- [ ] Wire remaining 6 RepCard webhook events
- [ ] Genability/UtilityAPI integration for utility rate lookup (Option B)
- [ ] v2: Installs tab — read-only Quickbase install progress visibility
- [ ] Data retention/archival strategy (year 2+)
- [ ] Reporting indexes (add when building reports)
- [ ] Review request tracking (Google reviews)
- [ ] Change order workflow (post-v1)
