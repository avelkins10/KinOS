# KinOS — Build Epics

> Execute in order. Each epic builds on the last.
> Reference: /docs/PROJECT-KNOWLEDGE.md, /docs/kinos-migration-v1.sql
>
> Supabase URL: https://tmfbggewmqcwryhzgrct.supabase.co
> Supabase Ref: tmfbggewmqcwryhzgrct

---

## Epic 0: Project Foundation and Supabase Integration

### Goal
Set up Supabase client, environment variables, TypeScript types from database, and folder structure. Fix mock data to match actual pipeline stages.

### Tasks

1. Install dependencies: pnpm add @supabase/supabase-js @supabase/ssr; pnpm add -D supabase

2. Create .env.local and .env.example with: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, REPCARD_API_KEY

3. Create Supabase client utilities:
   - lib/supabase/client.ts — Browser client (anon key)
   - lib/supabase/server.ts — Server client (cookie-based auth)
   - lib/supabase/admin.ts — Service role client (webhooks, bypasses RLS)

4. Generate TypeScript types: npx supabase gen types typescript --project-id tmfbggewmqcwryhzgrct > lib/supabase/database.types.ts

5. Create folder structure:
   - lib/actions/ (auth.ts, deals.ts, leads.ts, contacts.ts, users.ts)
   - lib/types/index.ts
   - app/api/webhooks/repcard/route.ts
   - app/api/webhooks/aurora/route.ts
   - app/(auth)/login/page.tsx and layout.tsx
   - middleware.ts at project root

6. Create middleware.ts: refresh Supabase auth session, redirect unauthenticated to /login, allow /api/webhooks/* and /login without auth

7. Fix lib/mock-data.ts DealStage to: new_lead, design_requested, design_complete, proposal, financing, contracting, pre_intake, submitted, intake_approved. Update STAGE_LABELS, STAGE_COLORS, and all mock deal stage values.

### Acceptance Criteria
- Supabase types generate from live database
- All three clients importable without errors
- Middleware redirects unauthenticated users
- Webhooks accessible without auth
- DealStage has exactly 9 values
- App builds and deploys

---

## Epic 1: Authentication and User Management

### Goal
Email/password login via Supabase Auth. Dashboard scoped to company. Sidebar shows real user. Admin section role-gated.

### Tasks

1. Build login page (app/(auth)/login/page.tsx): email+password form, signInWithPassword(), redirect to /, dark theme

2. Auth server actions (lib/actions/auth.ts): signIn(), signOut(), getSession(), getCurrentUser() which returns user profile from users table joined with office and company

3. Auth context provider (components/providers/auth-provider.tsx): wraps CRM layout, fetches user profile via auth.uid() -> users.auth_id, exposes userId/companyId/role/firstName/lastName/officeId

4. Update CRM layout to wrap in auth provider, redirect if no session

5. Update sidebar: real user name/role from context, Admin section only for admin/manager, sign out button

6. Create RLS helper in Supabase SQL Editor:
   CREATE OR REPLACE FUNCTION public.get_user_company_id() RETURNS UUID AS $$ SELECT company_id FROM public.users WHERE auth_id = auth.uid() $$ LANGUAGE sql SECURITY DEFINER STABLE;

7. Seed 2-3 test users in Supabase Auth + users table (1 admin, 1 closer, 1 manager)

### Acceptance Criteria
- Login works, dashboard loads
- Unauthenticated redirected to /login
- Sidebar shows real user info
- Admin nav role-gated
- Sign out works
- Cross-company data blocked by RLS

---

## Epic 2: RepCard Webhook — Lead Intake

### Goal
POST from RepCard creates contact + deal at new_lead stage.

### Reference: /docs/PROJECT-KNOWLEDGE.md — RepCard to KinOS Lead Intake

### Tasks

1. Build app/api/webhooks/repcard/route.ts: validate x-api-key, parse RepCard payload (customer_id, first_name, last_name, email, phone, address, city, state, zip, user_id, user_first_name, user_last_name), use admin Supabase client

2. Upsert contact: check repcard_customer_id, update if exists (trigger logs changes), insert if new with contact_source='repcard', type='lead'

3. Match RepCard user to KinOS user by repcard_user_id, fallback by name+company

4. Create deal: contact_id, company_id, stage='new_lead', closer_id, setter_id, deal_source='repcard', install address from contact. Triggers auto-generate deal_number and log stage history.

5. Responses: 200 success with dealId/contactId/dealNumber, 400 validation, 401 bad key, 500 error

### Acceptance Criteria
- Valid POST creates contact + deal
- Duplicate customer_id updates existing contact
- contact_change_history logs updates
- Deal has auto deal_number and stage_history entry
- 401 for bad key, 400 for missing fields

---

## Epic 3: Wire Leads Page to Real Data

### Goal
Leads page shows real Supabase data with role-based visibility.

### Tasks

1. Server action getLeads(): deals WHERE stage='new_lead', JOIN contacts+users, role-based filtering (closer sees own, manager sees office, admin sees all), search by name/phone/email, pagination

2. Update app/(crm)/leads/page.tsx: replace mock data, loading skeleton, empty state

3. Lead click -> /deals/[dealId]

4. Sidebar lead count from real data

### Acceptance Criteria
- Real data displayed, role-filtered, searchable, clickable, with empty state

---

## Epic 4: Wire Deals Pipeline to Real Data

### Goal
Kanban and dashboard show real deals across all 9 stages.

### Tasks

1. getDealsByStage(): grouped by stage for Kanban, JOIN contacts+users+offices
2. getDeal(): single deal with ALL relations (contact, closer, setter, office, proposals with adders/arrays, financing_applications, document_envelopes, attachments, gate_completions, deal_stage_history, notes)
3. getDashboardStats(): deals this month, close rate, avg deal size, monthly revenue, pipeline summary counts/values, financing alerts, recent activity from stage history

4. Update Deals page with real Kanban data
5. Update Dashboard with real stats
6. Update Deal Detail with getDeal()

### Acceptance Criteria
- Kanban shows real deals in 9 columns
- Dashboard stats from real data
- Deal detail loads with all relations
- Role-based visibility

---

## Epic 5: Deal Stepper — Assignment and Consumption

### Goal
First two workflow steps save to Supabase.

### Tasks

1. Deal Assignment step: edit customer info (name, email, phone), install address, setter/closer dropdowns, office. Save to contacts + deals tables.

2. Consumption step: monthly bill ($), annual kWh, utility company. Save to contacts utility fields.

3. Step completion via gate_completions table. Stepper icons from real completion status.

4. Server actions: updateDealAssignment(), updateConsumption(), getStepCompletions(), completeStep()

### Acceptance Criteria
- Assignment loads/saves real data
- Consumption loads/saves real data
- Completion persists across refreshes
- Stepper icons correct

---

## Epic 6: Design Request (Aurora Placeholder)

### Goal
Request design from Designs step. Moves deal to design_requested. Aurora API later.

### Tasks
1. Designs step: show address+consumption, "Request Design" button
2. requestDesign() creates record, transitions to design_requested
3. Admin can manually mark complete (for testing)
4. Complete moves to design_complete

---

## Epic 7: Proposal Builder

### Goal
Build proposal with PPW pricing, adders, lender selection, payment calc.

### Tasks
1. Proposal step: design data, PPW input, adder toggles from adder_templates, lender/product dropdowns from lenders/lender_products, monthly payment calc
2. Pricing engine (lib/utils/pricing.ts): calculateBaseCost, calculateAdderTotal, calculateGrossCost, calculateNetCost, calculateDealerFee, calculateMonthlyPayment, calculateCommission — all pure functions with unit tests
3. Server actions: createProposal, updateProposal, finalizeProposal, getAdderTemplates, getLendersAndProducts
4. Finalize sets active_proposal_id, moves to proposal stage

---

## Epic 8: Financing Step

### Goal
Submit financing app, track status, manage stips.

### Tasks
1. Show lender+product from proposal, Submit Application button
2. Status display, stips section with upload
3. Server actions: submitFinancingApplication, updateFinancingStatus, stip CRUD
4. Deal moves to financing on submission

---

## Epic 9: Contracting (Placeholder)

### Goal
Track contract status. Full signing integration later.

### Tasks
1. Contract status tracking (draft, sent, viewed, signed)
2. Manual status update
3. Deal moves to contracting

---

## Epic 10: Pre-Intake, Submission, and Admin Pages

### Tasks
1. Welcome Call step — lender checklist via gate_completions
2. Pre-Intake Checklist — gate_definitions query, blocks if incomplete
3. Project Submission — validate all steps, move to submitted
4. Admin Users — CRUD, roles, activate/deactivate
5. Admin Offices — CRUD
6. Admin Lenders — CRUD lenders + products
7. Admin Pricing — base PPW, equipment
8. Admin Gates — gate definitions
9. Admin Integrations — webhook URLs, API status

---

## Epic 11: Reports

### Tasks
1. Pipeline velocity (avg days per stage)
2. Close rate by closer/office/month
3. Revenue by closer/office/month
4. Deal count by source
5. Financing approval rate by lender
6. Date range + office + closer filters

---

## Future Epics

- F1: Aurora Solar API
- F2: Lender APIs (GoodLeap, Mosaic, Sunlight, etc.)
- F3: PandaDoc/SignNow contracts
- F4: Quickbase submission
- F5: RepCard user sync
- F6: File uploads
- F7: Notifications
- F8: Mobile responsiveness
