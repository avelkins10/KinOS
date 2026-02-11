# KinOS Project Knowledge Base

> Last updated: 2026-02-10
> This is the single source of truth for the KinOS project.

---

## 1. What is KinOS?

KinOS is a custom solar CRM replacing Enerflo for KIN Home Solar. It manages the full deal lifecycle from lead intake through installation submission.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
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
| Supabase Region | (check dashboard) | |
| Vercel | TBD | Not deployed yet |
| RepCard API | https://app.repcard.com/api/ | x-api-key auth |
| Aurora API | https://docs.aurorasolar.com | Bearer token auth |

---

## 3. Database Schema

**Migration file:** `kinos-migration-v1.sql` (1,744 lines)
**Status:** ✅ Deployed to Supabase (2026-02-10)

### Table Summary (43 tables):

**Org Hierarchy:** companies, offices, teams, roles
**Users:** users, user_lender_credentials, user_integration_settings
**CRM Core:** contacts, deals, proposals, proposal_arrays, proposal_adders, proposal_discounts
**Equipment:** equipment, equipment_market_availability
**Financing:** lenders, lender_products, financing_applications, financing_status_history
**Pricing:** installer_markets, pricing_configs, adder_templates, adder_scope_rules
**Documents:** document_templates, document_envelopes
**Gates:** gate_definitions, gate_completions
**Files:** attachments
**Notes:** notes, note_edits
**History/Audit:** deal_stage_history, deal_assignment_history, contact_change_history, deal_snapshots, audit_log
**Integrations:** webhook_events, integration_sync_log, aurora_pricing_syncs, repcard_sync_state
**Activity:** activities, notifications
**Commissions:** commission_structures, deal_commissions

### Key Schema Features:
- `updated_by UUID` on all major tables
- `deleted_at` / `deleted_by` soft deletes on: contacts, deals, proposals, attachments, notes, financing_applications, document_envelopes
- Postgres triggers: auto `updated_at`, auto `deal_number` generation (KIN-2026-00001), auto stage history, auto assignment history, auto contact change tracking
- 37 RLS policies: company isolation, soft-delete filtering, admin-only audit tables
- Deal number format: `KIN-{YEAR}-{SEQUENCE}` (auto-generated)

---

## 4. Deal Lifecycle (Pipeline Stages)

```
new_lead → appointment_set → appointment_sat → design_requested →
design_complete → proposal_sent → proposal_accepted → financing_applied →
financing_approved → stips_pending → stips_cleared → contract_sent →
contract_signed → submission_ready → submitted → intake_approved
                                                 → intake_rejected
Also: cancelled, lost
```

---

## 5. Data Flow Architecture

### 5.1 Lead Intake (RepCard → KinOS)

**Trigger:** Rep manually clicks "Send to KinOS" button in RepCard Connectors.

**RepCard Connector Config:**
- Connector Type: Custom
- Type: Web
- Method: POST
- Title: "Send to KinOS"
- URL: `https://{kinos-domain}/api/webhooks/repcard/create-lead`

**Fields sent from RepCard:**

Contact Fields:
- customers.id (RepCard customer ID)
- customers.firstName
- customers.lastName
- customers.email
- customers.countryCode
- customers.phoneNumber
- customers.fullPhoneNumber
- customers.type (Contact Type)
- customers.address
- customers.state
- customers.city (if available)
- customers.zip (if available)

User Fields:
- user.id (RepCard user ID)
- user.firstName
- user.lastName
- user.email
- user.jobTitle

**KinOS webhook handler should:**
1. Validate the payload
2. Look up or create the contact (match on repcard_customer_id or phone+email)
3. Look up the KinOS user by repcard_user_id
4. Create a deal at stage `new_lead`, assigned to that user as closer
5. Log the webhook event
6. Return 200 OK

### 5.2 User Sync (RepCard → KinOS)

RepCard is the source of truth for users (reps). KinOS syncs users via:
- RepCard GET /api/users/minimal (bulk sync)
- RepCard GET /api/users/{id}/details (individual)
- RepCard PUT /api/users/{id} (update)
- RepCard POST /api/users/{id}/unlink (remove)
- RepCard PUT /api/users/{id}/activate-deactivate

**RepCard API Auth:** Header `x-api-key: {api_key}`

### 5.3 Design Flow (KinOS → Aurora)

1. Closer enters consumption data (monthly bill, annual kWh, utility company)
2. Closer clicks "Request Design"
3. KinOS creates Aurora project via API (address, consumption profile)
4. Aurora designs the system (async)
5. Aurora webhook fires `design_complete`
6. KinOS pulls design data (arrays, production, panel layout)
7. Closer builds proposal from design data

**Aurora Consumption Profile:**
- Option A (v1): Pass annual_usage_kwh or monthly bill amount. Aurora auto-detects utility and rate from address.
- Option B (future): Use Genability/UtilityAPI for explicit utility lookup, rate selection, monthly consumption breakdown.

**Schema fields for consumption:**
- contacts: utility_company, monthly_electric_bill, annual_usage_kwh, monthly_usage_kwh (JSONB), utility_rate_kwh, utility_tariff_code, genability_utility_id
- proposals: monthly_consumption_kwh (JSONB snapshot), utility_name, utility_rate_kwh, post_solar_rate_kwh

### 5.4 Proposal & Pricing Flow

1. Design data populates proposal (system size, panel count, production)
2. Pricing engine calculates: base PPW × system size + adders - discounts + dealer fee = gross price
3. Closer selects lender + product → financing terms applied
4. Federal rebate (ITC) calculated
5. Proposal finalized → snapshot taken → deal advances

**Per-array design data stored in `proposal_arrays` table:**
- Each roof array: module count, pitch, azimuth, TSRF, solar access, solar access by month
- Matches Enerflo's array structure for Quickbase submission compatibility

### 5.5 Financing Flow

1. Closer selects lender and product on proposal
2. Financing application created
3. Application submitted to lender API
4. Status tracked: submitted → pending → approved/denied
5. Stips (stipulations) tracked as JSONB array
6. Welcome call / lender-specific gates checked

### 5.6 Document Signing Flow

1. Contract generated from template (PandaDoc/SignNow)
2. Merge fields populated from deal + proposal data
3. Sent to homeowner for signature
4. Webhook fires on signature events
5. Signed document URL stored

### 5.7 Submission Flow (KinOS → Quickbase)

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

### RepCard User Object:
```json
{
  "id": 26682,
  "firstName": "Jitender",
  "lastName": "Thakur",
  "dob": null,
  "email": "jitender@repcard.com",
  "username": "jitenderthakur",
  "address": "",
  "office": "India Office",
  "team": "Backend",
  "jobTitle": "Product Architect",
  "phoneNumber": "+918447554882",
  "image": "https://s3-ap-southeast-2.amazonaws.com/repcard/users/...",
  "rating": "0.0",
  "bio": "...",
  "companyName": "RepCard",
  "badgeId": "5C6762",
  "qrCode": ""
}
```

### RepCard Customer Object:
```json
{
  "id": 25997808,
  "fullName": "RepCard Demo",
  "firstName": "RepCard",
  "lastName": "Demo",
  "email": "",
  "countryCode": "+1",
  "phoneNumber": "1234567890",
  "companyName": "RepCard",
  "statusId": 173325,
  "address": "3820 E Main St #2",
  "address2": null,
  "state": "AZ",
  "city": "Mesa",
  "zip": null,
  "latitude": "55.34",
  "longitude": "34.22",
  "externalId": null,
  "type": 2,
  "userId": 26682,
  "ownerId": 26682,
  "contactSource": "API"
}
```

### RepCard Connector Configuration:
- Located in RepCard admin under Connectors → Add Connector
- Connector Type: Custom
- Type: Web (or Mobile)
- Method: GET or POST
- Fields available: Contact fields (id, name, email, phone, address, etc.) + User fields (id, name, email, role, etc.)
- Each field can be toggled on/off for the payload

---

## 7. Enerflo Payload Structure (Reference)

Enerflo's deal.projectSubmitted webhook payload structure (for Quickbase submission compatibility):

```
payload.deal:
  - state, shortCode, files[], salesRep
  - projectAddress: {lat, lng, city, line1, state, postalCode}
  - hasDesign, hasSignedContract, hasFinancing, etc. (gate flags)

payload.customer:
  - firstName, lastName

payload.proposal:
  - pricingOutputs: full pricing waterfall (basePPW, adders, dealerFee, gross, net, ITC)
  - financeMethod, financeProduct, downPayment
  - consumption: [12 monthly kWh values]
  - utility: {name, genabilityId, rate, tariff}
  - module: {name, manufacturer, wattage, degradation}

payload.design:
  - arrays[]: per-array data (pitch, azimuth, TSRF, solar_access, module_count)
  - systemSize, annualProduction
```

### Key Enerflo Fields Mapped to KinOS:

| Enerflo Field | KinOS Table.Column |
|---------------|-------------------|
| deal.shortCode | deals.enerflo_short_code |
| deal.projectAddress | deals.install_address, install_city, install_state, install_zip |
| customer.firstName/lastName | contacts.first_name, contacts.last_name |
| proposal.pricingOutputs.basePPW | proposals.base_ppw |
| proposal.pricingOutputs.grossCost | proposals.gross_cost |
| proposal.pricingOutputs.netCost | proposals.net_cost |
| proposal.downPayment | proposals.down_payment |
| proposal.consumption | proposals.monthly_consumption_kwh |
| proposal.utility.rate | proposals.utility_rate_kwh |
| proposal.financeProduct | proposals.financing_product_name |
| design.arrays[] | proposal_arrays (one row per array) |
| proposal.federalRebateBase | proposals.federal_rebate_base |
| proposal.federalRebateTotal | proposals.federal_rebate_amount |
| adder.dynamicInputs | proposal_adders.dynamic_inputs |
| files[].category | attachments.category |

---

## 8. Aurora Solar API Endpoints (Planned)

| Action | Method | Endpoint | When |
|--------|--------|----------|------|
| Create project | POST | /tenants/{tid}/projects | Closer clicks "Request Design" |
| Create consumption profile | POST | /tenants/{tid}/projects/{pid}/consumption_profiles | With project creation |
| Create design request | POST | /tenants/{tid}/projects/{pid}/design_requests | After consumption profile |
| Get designs | GET | /tenants/{tid}/projects/{pid}/designs | On webhook or poll |
| Get design summary | GET | /tenants/{tid}/designs/{did}/summary | After design complete |
| Get design assets | GET | /tenants/{tid}/designs/{did}/assets | Pull panel layout image |
| Get pricing | GET | /tenants/{tid}/projects/{pid}/designs/{did}/pricing | After design complete |
| Get financings | GET | /tenants/{tid}/projects/{pid}/financings | After pricing configured |
| Get agreements | GET | /tenants/{tid}/projects/{pid}/agreements | After proposal sent |
| Get web proposal | GET | /tenants/{tid}/projects/{pid}/web_proposals | Generate shareable URL |
| Webhooks | — | Configured in Aurora | design_complete, proposal_accepted, agreement_signed |

Aurora consumption profile accepts:
- Annual kWh estimate (Aurora extrapolates monthly)
- Monthly average bill in $ (Aurora converts using detected utility rate)
- 12 monthly bill entries
- UtilityAPI interval data (15/30/60 min intervals)

Aurora auto-detects utility company and rate from project address.

---

## 9. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Next.js 14 + Supabase + Vercel | Best fit for team size, rapid development, realtime needs |
| 2026-02-09 | TypeScript everywhere | Type safety across full stack |
| 2026-02-10 | Run full migration upfront | Multiple AI agents need stable schema to build against |
| 2026-02-10 | Manual lead push from RepCard (not auto) | Keeps pipeline clean, prevents junk leads |
| 2026-02-10 | Utility/consumption Option A for v1 | Closer enters bill amount, Aurora handles utility detection. Schema ready for Option B (Genability) later |
| 2026-02-10 | Install address on deals (separate from contact) | Project address may differ from customer mailing address |
| 2026-02-10 | Per-array design data table | Matches Enerflo's Quickbase submission structure |
| 2026-02-10 | Soft deletes everywhere | Audit trail requirement, nothing truly deleted |
| 2026-02-10 | Postgres triggers for history | Database-level enforcement, can't be bypassed by app code |

---

## 10. Open Items / Future Work

- [ ] Genability/UtilityAPI integration for utility rate lookup (Option B)
- [ ] Panel degradation rate on equipment table
- [ ] Monthly consumption storage on equipment (inverter AC output, etc.)
- [ ] Data retention/archival strategy (year 2+)
- [ ] Proposal versioning (draft → finalized handles most cases)
- [ ] Reporting indexes (add when building reports)
- [ ] Review request tracking (Google reviews)
- [ ] Roof material snapshot on proposals
