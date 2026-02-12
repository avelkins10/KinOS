# KinOS — Vision, Current State & Roadmap
### February 12, 2026

---

## 1. What Is KinOS?

KinOS is KIN Home's custom solar sales platform, replacing Enerflo. It manages every deal from the moment a RepCard appointment lands through design, financing, contracting, and submission to the Quickbase operations team.

**The pitch:** KIN Home pays $7,000–$15,000/month for Enerflo. KinOS replaces it for ~$40–150/month in infrastructure costs, while being purpose-built for how KIN actually operates — not a generic platform with features you'll never use.

### What KinOS IS:
- The deal lifecycle management platform (appointment → submission)
- The margin/pricing management layer (PPW, adders, dealer fees, commissions)
- The configurable deal submission gating engine (nothing gets submitted until every box is checked)
- The integration hub connecting RepCard, Aurora, lenders, doc signing, Quickbase, Sequifi, and Twilio

### What KinOS IS NOT:
- A canvassing tool (RepCard handles door-knocking and lead capture)
- A design tool (Aurora handles solar design and proposals)
- A proposal generator (Aurora generates the customer-facing proposal)
- An operations/project management tool (Quickbase handles post-submission: install, permitting, inspection, PTO)

### The Ecosystem:
```
RepCard (canvassing) → KinOS (sales CRM) → Quickbase (ops/install)
                          ↕                      ↕
                      Aurora (design)        Sequifi/CaptiveIQ (commissions)
                      Lender APIs            Arrivy (site surveys + field mgmt)
                      PandaDoc/SignNow
                      Twilio (notifications)
```

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16 (App Router) | TypeScript strict, Tailwind CSS, shadcn/ui |
| Backend | Supabase | Postgres + Auth + RLS + Storage + Edge Functions |
| Hosting | Vercel | Auto-deploys from main branch |
| Auth | Supabase Auth | Email/password, no self-registration, admin creates accounts |
| Middleware | proxy.ts | Next.js 16 pattern (NOT middleware.ts) |
| Package Manager | pnpm | — |

### Infrastructure:
| Resource | URL/ID |
|----------|--------|
| GitHub | github.com/avelkins10/KinOS (private) |
| Supabase | tmfbggewmqcwryhzgrct.supabase.co |
| Vercel (v0 design) | v0-kin-os-crm-design.vercel.app |
| Vercel (production) | kin-os-one.vercel.app |
| RepCard API | app.repcard.com/api/ |
| Aurora API | api.aurorasolar.com |
| Aurora Tenant | 034b1c47-310a-460f-9d5d-b625dd354f12 |

---

## 3. The Deal Lifecycle (19 Pipeline Stages)

This is the heart of KinOS. Every deal flows through these stages:

```
new_lead
  → appointment_set
    → appointment_sat
      → design_requested
        → design_complete
          → proposal_sent
            → proposal_accepted
              → financing_applied
                → financing_approved
                  → stips_pending
                    → stips_cleared
                      → contract_sent
                        → contract_signed
                          → submission_ready
                            → submitted
                              → intake_approved
                              → intake_rejected

Also: cancelled, lost
```

**Key rules:**
- Pipeline ENDS at intake_approved. Everything after lives in Quickbase.
- Terminal stages: intake_approved, cancelled, lost
- Revivable: lost → appointment_set (deals can come back to life)
- Backward allowed: design_complete/proposal_sent → design_requested (redesign flow)
- Each stage transition is logged in deal_stage_history with who/when/why

---

## 4. What's Built (Epics 0–6 Complete)

### Epic 0: Infrastructure ✅
- Supabase client setup (browser, server, admin)
- Environment variables, TypeScript types from live schema
- Folder structure, middleware (proxy.ts)

### Epic 1: Authentication & User System ✅
- Email/password login via Supabase Auth
- Role-based access (admin, closer, office_manager, setter, viewer)
- Auth context provider, session management
- RepCard user sync

### Epic 2: RepCard Integration ✅
- 7 webhook handlers for RepCard events:
  - appointment-set, appointment-update, appointment-outcome
  - status-change, contact-type-change, closer-update
- Contact/deal auto-creation from webhooks
- User sync between RepCard and KinOS

### Epic 3: Pipeline & Deal Management ✅
- Kanban board with drag-drop stage transitions
- 19-stage pipeline with validation rules
- Real-time updates via Supabase Realtime
- Dashboard with live stats
- Deal detail page with all relations

### Epic 4: Leads Management ✅
- Leads list with search, filtering, pagination
- Lead detail page
- Notes, attachments, CSV import
- Filter presets

### Epic 5: Calendar & Appointments ✅
- Appointments table with full CRUD
- Calendar views: day, week, month, list
- Dashboard appointment widgets
- All 7 RepCard webhook routes feeding appointment data

### Epic 6: Aurora Design Integration ✅
- Aurora API client (project creation, consumption profiles, design requests)
- Aurora service layer
- Webhook handlers (GET-based, query params)
- UI: ConsumptionForm, DesignRequestForm, DesignResultsCard, DesignStatusBadge
- Deal workflow: consumption step → design request → design results display
- Three design paths supported:
  1. In-house design team (primary — designer works in Aurora, results sync back)
  2. Sales Mode self-design (closer designs in Aurora directly)
  3. Expert Design via Aurora's team (API-based, backup option)

---

## 5. What's Built But Needs Production Data (Epic 7)

### Epic 7: Proposal & Pricing Engine ✅ (code complete, needs real data)

**Pricing Engine** (`lib/utils/pricing.ts`):
- Pure TypeScript with Big.js for money math
- Full waterfall: base PPW × watts → + adders → + dealer fee → - discounts → = gross → - ITC → = net → monthly payment
- Goal-seek: type a target gross cost and PPW auto-calculates backwards
- All functions are pure with unit tests

**Proposal Builder UI:**
- Multiple proposals per deal (compare GoodLeap vs LightReach side by side)
- Pricing card with PPW input, min/max slider, goal-seek toggle
- Adders card: auto-applied (locked, system-triggered) + manual toggle (closer picks)
- Financing card: lender/product dropdowns, dealer fee display, monthly payment
- Summary card: full waterfall breakdown
- Save draft / Finalize / Unfinalize (admin only) / Duplicate

**Server Actions:**
- createProposal, updateProposal, finalizeProposal, unfinalizeProposal, deleteProposal, duplicateProposal
- getActivePricingConfig (office → market → company waterfall)
- getAdderTemplatesForDeal (scope rules evaluated against deal context)
- getLendersWithProducts (filtered by state availability)

**What needs real data before go-live:**
- Lender product rates/terms/dealer fees (currently placeholder)
- Base PPW per market (seeded as FL=$3.10, CA=$3.50, default=$3.25 — needs verification)
- Adder amounts (seeded from Enerflo screenshots — needs Austin to verify current)

---

## 6. Database State

### Current: 48 tables + 2 views
- Base migration (kinos-migration-v1.sql): 38 tables
- Migrations 002–013 applied
- Migration 013 added `deal_adders` table
- Migration 014 drafted (deal_tags + communication_log) — NOT yet applied

### Production Seed v4 (ready to load):
- 1 company (KIN Home), 2 offices (FL, CA), 5 roles, 2 teams, 5 users
- 10 lenders, 12 products, 3 pricing configs
- 36 adder templates across 8 categories with 13 scope rules
- 9 workflow steps, 11 gate definitions
- 7 contacts (FL/CA/TX), 7 deals across pipeline stages

### Key tables by domain:
**Core:** companies, offices, roles, teams, users
**CRM:** contacts, deals, deal_stage_history, deal_assignment_history, notes, activities, attachments
**Pipeline:** workflow_step_definitions, gate_definitions, gate_completions, deal_workflow_progress
**Pricing:** pricing_configs, installer_markets, adder_templates, adder_scope_rules, deal_adders
**Proposals:** proposals, proposal_adders, proposal_discounts
**Financing:** lenders, lender_products, financing_applications, user_lender_credentials
**Documents:** document_templates, document_envelopes
**Integrations:** webhook_events, integration_sync_log, repcard_sync_state, aurora_pricing_syncs
**Calendar:** appointments, filter_presets

---

## 7. What's Next (Epics 8–12 + Future Features)

> **Full feature explainers for every item below are in `docs/future-features.md`.** All AI agents should reference that doc before building.

### Epic 8: Financing Step
- Submit financing application from finalized proposal
- Track approval status, manage stips with upload + deadlines
- Deal auto-advances through financing stages
- Foundation for lender API integrations (manual first, API later)

### Epic 9: Contracting & Document Signing
- Contract status tracking (draft → sent → viewed → signed)
- Manual tracking first, PandaDoc/SignNow integration later
- Merge fields auto-populate from proposal data

### Epic 10: Submission & Quickbase Integration
- Gate enforcement: nothing submits until every checkbox passes
- Frozen deal snapshot at submission time
- Quickbase API push with full payload
- Rejection handling with fix-and-resubmit flow

### Epic 11: Admin Settings Suite
- Users, Offices, Teams, Lenders, Pricing, Equipment, Adders, Gates, Workflow, Integrations
- Everything business-configurable without developer intervention
- Audit trail on all config changes

### Epic 12: Reports & Analytics
- Pipeline velocity, close rates, revenue tracking
- Financing approval rates by lender
- Filterable by date range, office, closer

### Major Future Features (documented in docs/future-features.md):
- **Post-Sale Pipeline** — Bidirectional Quickbase sync, closer visibility into install/permit/PTO milestones, closer actions (cancel, change order response, reschedule)
- **Site Survey & Arrivy Integration** — Schedule/reschedule/cancel site surveys via Arrivy API, survey status on deal detail, gate requirement (scheduled) before submission. Arrivy also handles installs — foundation for post-sale field visibility.
- **Equipment Configuration** — Aurora catalog mirror with market scoping, pricing overrides, adder triggers
- **Pricing Engine Admin** — Visual waterfall, sandbox/test mode, audit trail
- **Lender API Integrations** — One-click financing submission to all 6 lender partners
- **Change Order Management** — Formal workflow for post-sale deal changes with pricing impact and approval chains
- **Notifications** — In-app + email + SMS via Twilio, triggered by deal events
- **Design Queue** — Enerflo design portal replacement for the in-house design team
- **Customer Portal** — Self-service project tracking for homeowners
- **Commission Push** — Sequifi/CaptiveIQ auto-push on deal milestones
- **Mobile Experience** — PWA-first responsive design for closers in the field

---

## 8. Key Architecture Decisions Made

1. **Aurora owns equipment catalog, KinOS mirrors it with business logic.** Aurora has 10K+ component models — we don't duplicate the specs database. But KinOS syncs the catalog and adds market availability rules, pricing overrides, and adder triggers. Admin sees all equipment in Settings → Equipment with full control over what's approved per market.

2. **KinOS shows the FULL deal lifecycle — sales AND post-sale.** Quickbase remains the ops system of record for installation, permitting, and PTO. But KinOS pulls milestone data from Quickbase so closers can see post-sale status, initiate cancellations, respond to change orders, and receive project notifications. Bidirectional sync: read milestones from Quickbase, push closer actions back.

3. **Three design paths** instead of one. In-house team (primary), Sales Mode (self-service), Expert Design (Aurora's team). Flexible based on deal complexity.

4. **Pricing engine is pure functions WITH admin transparency.** No database calls inside the calculation — load data, pass it in, get numbers out. AND an admin Settings → Pricing Engine page visualizes the full waterfall, shows active rules in plain English, and has a test/sandbox mode to verify pricing before it hits real proposals.

5. **Adder scope rules** auto-evaluate against deal context. Small system? Auto-add the small system adder. Selected LightReach? Auto-add TPO adder. Closer doesn't have to remember.

6. **Multi-proposal per deal.** Closers can build 2-3 proposals with different lenders and compare side-by-side. "Here's what it looks like with GoodLeap vs LightReach."

7. **Gate engine is configurable.** Admin defines what gates must be passed before submission. Not hardcoded — can change per market or as business rules evolve.

8. **Aurora webhooks are GET requests** with data in URL query params, not POST with JSON body. This is unusual and important for webhook handler implementation.

9. **Provider-agnostic integration pattern.** Every external integration (lenders, doc signing, notifications) uses an adapter interface. Business logic doesn't care which provider — it cares that the action happened. Swap PandaDoc for SignNow without touching UI code.

10. **Build with the end in mind.** Every feature has a documented future-feature explainer (see `docs/future-features.md`). Current code is designed to support features 3-6 months out, not just today's epic. All AI agents reference these docs before building.

---

## 9. Project Files That Need Updating

These files in the codebase are behind what we've actually built/decided:

| File | Issue | What Needs to Change |
|------|-------|---------------------|
| `docs/PROJECT-KNOWLEDGE.md` | Says 47 tables, dated 2026-02-11 | Update to 48 tables (deal_adders from migration 013), note seed v4, note migration 014 drafted |
| `docs/db-audit.md` | Missing migration 013-014 | Add deal_adders table, add migration 014 entry |
| `CLAUDE.md` | Says "Epics 0-5 complete, Epic 6 next" | Should say Epics 0-7 complete, Epic 8 next |
| `.cursor/rules/kinos.mdc` | Same stale epic status | Same update needed |
| `docs/TRAYCER-EPICS.md` | Future epics list Aurora as "F1" | Aurora is done (Epic 6). Needs restructure. |
| `docs/blueprint.md` | Says "Next.js 14" in header | Actually Next.js 16 |

### Files that ARE current:
- `docs/schema-reference.md` — updated to 48 tables, 912 columns
- `docs/epic-7-plan-final.md` — accurate implementation plan
- `docs/aurora-research-epic6-planning.md` — accurate research doc
- `prod-seed-v4.sql` — ready to load

---

## 10. Immediate Action Items

1. **Create Austin's auth user** in Supabase Dashboard (austin@kinhome.com)
2. **Run prod-seed-v4.sql** in production Supabase SQL Editor
3. **Verify seed** — count queries to confirm all data landed
4. **Apply migration 014** — save file + run (deal_tags + communication_log → 50 tables)
5. **Update stale project files** (see table above) — have Claude Code do this
6. **Verify lender product rates** — seed has placeholder values
7. **Start Epic 8** (Financing) or tackle admin pages

---

## 11. What Makes KinOS Better Than Enerflo

This isn't just a clone. Things we're doing differently:

- **Post-sale visibility** — Enerflo goes dark after submission. KinOS shows closers the full project lifecycle from sale through PTO, with actionable controls.
- **Auto-applying adders based on deal context** — Enerflo requires manual selection. KinOS evaluates scope rules and pre-populates. Fewer mistakes, faster proposals.
- **Goal-seek pricing** — Type the gross cost you want, PPW auto-calculates. Closers think in total cost, not $/W.
- **Multi-proposal comparison** — Build multiple proposals with different lenders side-by-side. Enerflo can't do this.
- **Pricing transparency** — Admin can see exactly how pricing works, test scenarios, and audit changes. No black box.
- **Equipment configuration** — See everything Aurora offers, control what's approved per market, tie equipment to pricing rules. Enerflo has zero equipment visibility.
- **Configurable gates** — Admin controls what blocks submission. No developer needed to change business rules.
- **Change order workflow** — Formal process with pricing impact, approvals, and audit trail. Not phone calls and emails.
- **Real-time pipeline** — Supabase Realtime means the kanban updates live. No refresh needed.
- **Built for closers in the field** — Mobile-first, notification-driven, self-service status checks.
- **Purpose-built for KIN** — No wasted features. Every screen is designed for how KIN actually sells solar.
- **$150/mo vs $15,000/mo** — 99% cost reduction with a better product.
