# KinOS — Future Feature Explainers
### Reference Document for All Build Agents
### Last Updated: February 12, 2026

> **Purpose:** Every AI agent (Cursor, Claude Code, Traycer) working on KinOS should read this document before building anything. Each feature section explains WHAT it is, WHY it matters, WHAT it touches, and HOW current code should be built to support it. Build with the end in mind.

---

## Table of Contents

1. [Epic 8: Financing Step](#epic-8-financing-step)
2. [Epic 9: Contracting & Document Signing](#epic-9-contracting--document-signing)
3. [Epic 10: Submission & Quickbase Integration](#epic-10-submission--quickbase-integration)
4. [Epic 11: Admin Settings Suite](#epic-11-admin-settings-suite)
5. [Epic 12: Reports & Analytics](#epic-12-reports--analytics)
6. [Post-Sale Pipeline & Quickbase Bidirectional Sync](#post-sale-pipeline--quickbase-bidirectional-sync)
7. [Equipment Configuration & Aurora Sync](#equipment-configuration--aurora-sync)
8. [Pricing Engine Admin & Transparency](#pricing-engine-admin--transparency)
9. [Lender API Direct Integrations](#lender-api-direct-integrations)
10. [Document Signing (PandaDoc/SignNow)](#document-signing-pandacocsignnow)
11. [Commission Push (Sequifi/CaptiveIQ)](#commission-push-sequificaptiveiq)
12. [Notifications & Communication Layer](#notifications--communication-layer)
13. [Design Queue (Enerflo Replacement)](#design-queue-enerflo-replacement)
14. [Customer Portal](#customer-portal)
15. [Mobile Experience](#mobile-experience)
16. [Change Order Management](#change-order-management)

---

## Epic 8: Financing Step

### What It Is
After a proposal is finalized, the closer submits a financing application to the selected lender. This step tracks the application through approval, manages stipulations (stips), and handles document uploads required by the lender.

### Why It Matters
Financing is where deals die or survive. A slow stip response = lost deal. Visibility into financing status is the #1 thing closers and managers care about mid-pipeline. Enerflo's financing step is clunky and doesn't surface stip deadlines or lender-specific requirements well.

### What It Touches
- **Tables:** financing_applications, deals (stage transitions), attachments (stip uploads), activities (logging), gate_completions
- **Existing code:** Finalized proposal provides lender_id, lender_product_id, pricing data. `lib/actions/proposals.ts` finalizeProposal() is the entry point.
- **Future dependency:** Lender API integrations (see below) will eventually auto-submit applications. For now, this is manual submission tracking.

### Key Behaviors
- Show lender + product from finalized proposal (read-only at this point)
- "Submit Application" button creates financing_application record
- Status tracking: submitted → conditional_approval → approved / denied
- Stips section: list of required documents with upload capability
- Each stip has: name, status (pending/uploaded/approved/rejected), due date, file attachment
- Deal auto-advances: financing_applied → financing_approved when approval received
- Stips flow: stips_pending → stips_cleared when all stips approved
- Notifications to closer when stip is requested or rejected

### Build Constraints for Current Code
- financing_applications table already exists in schema — use it, don't create a new one
- Stip documents go to Supabase Storage (attachments bucket already created in migration 008)
- Lender-specific stip templates could be stored in gate_definitions or a new stip_templates table
- When building lender API integrations later, the manual submission should become an API call — design the action layer so the submission function can be swapped from manual → API without UI changes

### What KinOS Does Better Than Enerflo
- Stip deadline tracking with countdown timers
- Auto-notify closer when a stip is uploaded but not yet reviewed
- Dashboard widget: "Deals waiting on stips" with aging indicators
- Lender-specific stip checklists pre-populated based on product selected

---

## Epic 9: Contracting & Document Signing

### What It Is
After financing is approved and stips are cleared, the closer sends a contract for the homeowner to sign. This step tracks contract status and eventually integrates with PandaDoc or SignNow for digital signatures.

### Why It Matters
Contracts are the legal commitment. A deal isn't real until it's signed. Tracking contract status (sent, viewed, signed) prevents deals from stalling in the "I sent it but they haven't signed" limbo.

### What It Touches
- **Tables:** document_envelopes, document_templates, deals (stage transitions), activities
- **Existing code:** document_envelopes and document_templates tables exist in schema
- **Future dependency:** PandaDoc or SignNow API integration (see below)

### Key Behaviors (Phase 1 — Manual Tracking)
- Contract status: draft → sent → viewed → signed
- Manual status update by closer or admin
- Deal advances: contract_sent → contract_signed on signature
- Upload signed contract PDF to attachments

### Key Behaviors (Phase 2 — API Integration)
- Generate contract from template with merge fields (customer name, address, system size, pricing, lender terms)
- Send via PandaDoc/SignNow API
- Webhook receives signature events → auto-advance deal stage
- Signed document auto-stored in Supabase Storage
- Audit trail: who signed, when, IP address, document hash

### Build Constraints for Current Code
- document_envelopes already has: provider, provider_envelope_id, status, signed_at, metadata
- document_templates already has: provider, template_id, merge_fields, category
- Design the manual tracking so it uses the same table structure the API integration will use
- Merge fields should pull from the same data the proposal summary card displays — don't create a separate data pipeline

### What KinOS Does Better Than Enerflo
- Contract merge fields auto-populated from proposal data (no manual entry)
- Real-time signature status (webhook-driven, not polling)
- Multiple signers support (homeowner + co-signer)
- Contract template versioning (admin can update templates without breaking existing envelopes)

---

## Epic 10: Submission & Quickbase Integration

### What It Is
The final sales step. Once all gates pass (design complete, financing approved, stips cleared, contract signed, utility bill uploaded, ID verified, manager approved), the deal is submitted to Quickbase for the operations team to begin installation.

### Why It Matters
This is where KinOS hands off to Quickbase. The submission must be bulletproof — every required field present, every document attached, every approval logged. A bad submission = ops team sends it back = delays = unhappy customer.

### What It Touches
- **Tables:** deals (stage → submitted/intake_approved/intake_rejected), gate_definitions, gate_completions, all deal-related tables for payload assembly
- **Existing code:** gate_definitions and gate_completions tables exist. workflow_step_definitions exist.
- **External:** Quickbase API for creating/updating records
- **Reference:** See `enerflo-payload-analysis.md` and `schema-updates-from-enerflo.md` for Enerflo's submission payload structure (compatibility target)

### Key Behaviors
- Pre-submission checklist: query all gate_definitions, show completion status
- Block submission if any required gate is incomplete
- "Submit" button assembles full deal payload and pushes to Quickbase API
- Creates a frozen snapshot of the deal at submission time (deal_snapshots table — see db-audit.md recommendations)
- Deal advances: submission_ready → submitted
- Quickbase responds with acceptance → intake_approved, or rejection with reasons → intake_rejected
- Rejection reasons displayed to closer with ability to fix and resubmit

### Quickbase Payload (from Enerflo analysis)
The submission payload must include:
- Customer info (name, email, phone, address)
- System specs (size, panels, inverters, production, offset)
- Pricing (gross, net, PPW, adders, dealer fee)
- Financing (lender, product, approval number, terms)
- Contract (signed date, envelope ID)
- Closer/setter info
- Office/team
- All uploaded documents (utility bill, ID, contract, stip docs)
- KinOS deal number as external reference

### Build Constraints for Current Code
- The submission payload structure should be defined as a TypeScript interface NOW, even before Quickbase integration is built
- Every field the payload needs should be validated during the gate check, not at submission time
- deal_snapshots table should be created in a migration — this is critical for "what did the deal look like when we submitted it?" questions
- Quickbase record ID should be stored on the deal (quickbase_record_id field already exists on contacts — needs equivalent on deals)

### What KinOS Does Better Than Enerflo
- Visual gate checklist with real-time completion status
- Impossible to submit an incomplete deal (gating engine enforces)
- Frozen snapshots preserve submission state even if deal is later edited
- Rejection reasons from Quickbase displayed inline with fix-and-resubmit flow

---

## Epic 11: Admin Settings Suite

### What It Is
A comprehensive admin panel for managing all configurable aspects of KinOS without developer intervention.

### Sections
1. **Users** — CRUD, role assignment, activate/deactivate, office/team assignment
2. **Offices** — CRUD, assign managers, configure office-specific settings
3. **Teams** — CRUD within offices, assign team leads
4. **Lenders** — CRUD lenders + products, set dealer fees, state availability
5. **Pricing** — Base PPW per market, min/max bounds, pricing config management
6. **Equipment** — See [Equipment Configuration](#equipment-configuration--aurora-sync) below
7. **Adders** — CRUD adder templates, scope rules, categories
8. **Gates** — Gate definitions, required vs optional, ordering
9. **Workflow** — Step definitions, ordering, gate assignments per step
10. **Integrations** — Webhook URLs, API status, sync logs, connection health

### Why It Matters
Austin shouldn't need a developer to change base PPW, add a new lender product, or deactivate a user. Every business rule that changes quarterly should be admin-configurable.

### Build Constraints for Current Code
- All admin pages should check role_category = 'admin' before rendering
- Every admin action should log to activities table with change details
- Settings should have an audit trail: who changed what, when, previous value
- Pricing changes should require confirmation ("This will affect all new proposals in FL market. Continue?")

---

## Post-Sale Pipeline & Quickbase Bidirectional Sync

### What It Is
After a deal is submitted and accepted (intake_approved), the closer currently goes blind. They don't know if the install is scheduled, if permitting is delayed, if inspection passed. This feature gives closers visibility into post-sale project status by pulling milestone data from Quickbase and displaying it on the deal detail page.

**This is NOT replacing Quickbase for ops.** Quickbase remains the system of record for installation, permitting, and PTO. KinOS becomes a read window with limited write-back actions.

### Why It Matters
- Closers get 5-10 calls/week from customers asking "when is my install?" — they currently have to log into Quickbase or call HQ
- When a customer texts their closer to cancel, the closer has no way to flag it in the system without calling HQ
- Change orders (additional panels, different equipment, adder adjustments) require closer involvement but they're not in the loop
- Reducing HQ call volume by giving closers self-service access to project status = operational efficiency

### What It Touches
- **New tables:** project_milestones (or extend deal_stage_history for post-sale stages), change_orders
- **Existing tables:** deals (add quickbase_project_id, post_sale_status fields), activities, notifications
- **External:** Quickbase API (bidirectional — read milestones, write closer actions)
- **UI:** New "Post-Sale" tab on deal detail page, post-sale timeline component, change order management

### Post-Sale Milestones to Track (from Quickbase)
```
intake_approved → site_survey_scheduled → site_survey_complete →
  permit_submitted → permit_approved → install_scheduled →
  install_complete → inspection_scheduled → inspection_passed →
  pto_submitted → pto_approved → project_complete
```

### Closer Actions (write back to Quickbase)
- **Cancel deal** — closer can initiate cancellation, triggers notification to ops + HQ, requires reason
- **Respond to change order** — view proposed changes (new adders, equipment swaps), approve/reject with notes
- **Flag issue** — "Customer is unhappy about timeline" / "Customer mentioned they're moving" — creates task in Quickbase
- **Update customer contact info** — phone/email changes push to Quickbase
- **Request reschedule** — closer can request install date change on behalf of customer

### Notification Triggers (Quickbase → KinOS)
- Install date scheduled/changed
- Permit approved/denied
- Inspection passed/failed
- PTO approved
- Change order requested by ops/design team
- Customer called HQ (disposition notes)
- Project cancelled by HQ
- Milestone delayed beyond SLA

### Sync Architecture
```
Quickbase (system of record)
    ↕ API (polling or webhook)
KinOS (read mirror + limited write-back)
    ↓
Closer sees timeline + can take actions
    ↓
Actions push back to Quickbase via API
```

**Sync frequency:** Poll every 15 min for milestone updates, or Quickbase webhook if available. Closer actions push immediately.

### Build Constraints for Current Code
- deals table needs: quickbase_project_id (TEXT), post_sale_status (TEXT)
- The post-sale timeline should be a SEPARATE component from the sales pipeline kanban — different stages, different UX
- Notifications infrastructure (see below) is a prerequisite for this feature
- Change order management needs its own table and workflow — don't try to shoehorn it into the existing proposal system
- Keep the read/write boundary clear: KinOS can READ any Quickbase field, but can only WRITE specific closer actions

### What KinOS Does Better Than Enerflo
- Enerflo doesn't show post-sale status AT ALL — closers are completely blind
- Self-service cancellation reduces HQ call volume
- Change order workflow keeps closers in the loop instead of surprising them
- Proactive notifications instead of reactive "let me check for you" calls

---

## Equipment Configuration & Aurora Sync

### What It Is
An admin settings page that mirrors Aurora's equipment catalog and layers KinOS business logic on top. Admins can see every panel, inverter, and battery available in Aurora, and configure market availability, pricing rules, and adder triggers per equipment type.

### Why It Matters
Currently, equipment configuration is scattered: Aurora has the catalog, KinOS has pricing rules, and the connection between "which panels are approved for FL" and "what adders apply when you use Enphase" is tribal knowledge. This centralizes it.

### What It Touches
- **New tables:** equipment (or equipment_catalog), equipment_market_availability
- **Existing tables:** adder_templates (equipment-triggered adders), adder_scope_rules
- **External:** Aurora API (GET equipment/components endpoints)
- **UI:** Settings → Equipment page with catalog browser, market toggles, pricing overrides

### Key Behaviors
- **Sync from Aurora:** Pull available panels, inverters, batteries via Aurora API. Display with specs (wattage, efficiency, dimensions, manufacturer).
- **Market scoping:** Admin toggles which equipment is approved per installer market. "REC Alpha panels: approved in CA, not approved in FL."
- **Pricing overrides:** Set equipment-specific adders. "Enphase microinverters add $0.15/W in all markets." These feed into adder_scope_rules.
- **Preferred equipment per market:** When KinOS creates an Aurora project, it can pass preferred_panels parameter to guide the designer.
- **Spec sheets/datasheets:** Link to manufacturer PDFs for sales reference.
- **Discontinuation:** Mark equipment as discontinued → warning on any deal still using it.

### Build Constraints for Current Code
- adder_scope_rules already supports equipment-based triggers (equipment_model field) — this UI just makes it configurable
- Don't duplicate Aurora's full component database. Store: model name, manufacturer, type (panel/inverter/battery), wattage, key specs, aurora_component_id. Let Aurora be the detail source.
- Equipment sync should be scheduled (daily) or manual trigger, not real-time — Aurora's catalog doesn't change often
- The design request form already has panel/inverter fields — these should eventually become dropdowns populated from the equipment catalog instead of free text

### What KinOS Does Better Than Enerflo
- Enerflo has no equipment visibility — designers pick what they want in Aurora with no guardrails
- Market-scoped equipment prevents "we don't install that panel in FL" mistakes
- Equipment-linked adders auto-apply without closer having to remember

---

## Pricing Engine Admin & Transparency

### What It Is
An admin settings page that visualizes exactly how KinOS calculates pricing, so there's zero guesswork about how numbers are derived. Includes a test mode where you can plug in hypothetical deal parameters and see the full pricing waterfall.

### Why It Matters
The pricing engine (`lib/utils/pricing.ts`) is pure functions — great for code, but invisible to business users. When a manager asks "why is this deal $3.50/W?" they should be able to see the exact waterfall, not ask a developer to read code.

### What It Touches
- **Existing code:** `lib/utils/pricing.ts` (read-only display of the logic), pricing_configs, adder_templates, adder_scope_rules, lender_products
- **UI:** Settings → Pricing Engine page

### Key Behaviors
1. **Waterfall Visualization:** Show the full calculation flow as a visual diagram:
   ```
   Base PPW × System Watts = Base Cost
   + Equipment Adders (auto-applied based on equipment)
   + System Adders (auto-applied based on system size, state, lender)
   + Value Adders (manually toggled by closer)
   + Sales Tax (if applicable)
   ÷ Dealer Fee Factor (gross-up for lender fee)
   - Discounts
   - Rebates
   = Gross Cost
   - ITC (30%)
   = Net Cost
   → Monthly Payment (based on lender product terms)
   ```

2. **Active Configuration Display:**
   - Current base PPW per market with min/max bounds
   - Active adder templates grouped by category
   - Active scope rules with trigger conditions explained in plain English
   - Lender products with dealer fee structures

3. **Test Mode / Pricing Sandbox:**
   - Input: state, system size (kW), panel model, inverter model, lender, product
   - Output: full waterfall calculation with every line item shown
   - "What if" toggles: add/remove adders, change PPW, switch lenders
   - Compare mode: see two configurations side by side

4. **Audit Trail:**
   - When was base PPW last changed? By who? Previous value?
   - When were adder amounts updated?
   - Pricing config version history

### Build Constraints for Current Code
- The pricing functions in `lib/utils/pricing.ts` are pure — the admin page reads from the same config data, runs the same functions, and displays the results. No separate pricing logic.
- Consider adding a `pricing_change_log` table to track config changes (who changed base PPW from $3.10 to $3.25 on what date)
- The test mode should use the exact same `calculatePricing()` function the proposal builder uses — guaranteeing what you see in test mode matches what happens in production

### What KinOS Does Better Than Enerflo
- Enerflo's pricing is a black box — you set numbers and hope they're right
- Test mode catches mistakes BEFORE they hit real proposals
- Audit trail answers "who changed the pricing and when" without digging through logs
- Visual waterfall makes it easy to train new managers on how pricing works

---

## Lender API Direct Integrations

### What It Is
Direct API connections to each of KIN Home's lender partners, enabling one-click financing submission, real-time status updates, and automated stip management directly from KinOS.

### Lenders (6 confirmed with API access)
1. **GoodLeap** — Loans + TPO products
2. **LightReach / Palmetto** — TPO/lease
3. **Sunlight** — Loans
4. **Dividend** — Loans
5. **Enfin (Qcells)** — TPO
6. **Skylight** — Loans

### Why It Matters
Currently, closers submit financing applications by logging into each lender's portal separately. With API integration: click "Submit" in KinOS → application goes directly to lender → approval/denial comes back automatically → stips populate automatically.

### Architecture
```
KinOS Proposal (finalized)
    ↓ Submit Financing
Lender Integration Layer (provider-agnostic adapter pattern)
    ↓ Normalized API call
Specific Lender Adapter (GoodLeap, LightReach, etc.)
    ↓ Lender-specific API format
Lender API
    ↓ Response
Adapter normalizes response
    ↓
financing_applications table updated
    ↓
Deal stage auto-advances
```

### Provider-Agnostic Design
Each lender adapter implements the same interface:
```typescript
interface LenderAdapter {
  submitApplication(deal: Deal, proposal: Proposal): Promise<ApplicationResult>
  getApplicationStatus(applicationId: string): Promise<StatusResult>
  getStipulations(applicationId: string): Promise<StipResult[]>
  uploadStipDocument(applicationId: string, doc: File): Promise<UploadResult>
  cancelApplication(applicationId: string): Promise<void>
}
```

### What It Touches
- **Existing tables:** financing_applications, user_lender_credentials, lenders, lender_products
- **New code:** `lib/integrations/lenders/` directory with adapter per lender
- **External:** Each lender's API (credentials stored in user_lender_credentials, encrypted)

### Build Constraints for Current Code
- user_lender_credentials table already exists — it stores per-user login credentials for each lender portal
- The financing step (Epic 8) should be built with a pluggable submission function: manual now, API later
- lender_products already has fields for rates, terms, dealer fees — these should match what the lender API expects
- Each lender has different auth (OAuth, API key, username/password) — the adapter pattern handles this

### What KinOS Does Better Than Enerflo
- One-click submission instead of logging into 6 different portals
- Real-time status without refreshing lender portals
- Stips auto-populate and track deadlines
- Lender credential management per user (not shared logins)

---

## Document Signing (PandaDoc/SignNow)

### What It Is
Integrated digital contract signing. Generate contracts from templates with auto-filled merge fields, send for signature, track signing status, and auto-store signed documents.

### Why It Matters
Contract generation is currently manual — someone fills in a template, emails it, waits. Integration means: click "Send Contract" → document generates with all deal data pre-filled → customer gets signing link → signed doc auto-stored → deal advances.

### What It Touches
- **Existing tables:** document_envelopes, document_templates
- **External:** PandaDoc or SignNow API (TBD which provider)
- **Existing data:** Proposal summary data provides all merge fields

### Merge Fields (auto-populated from deal)
- Customer: name, email, phone, address
- System: size, panels, inverters, production, offset
- Pricing: gross cost, net cost, PPW, monthly payment, adders, dealer fee, ITC
- Financing: lender, product, terms, approval number
- Company: KIN Home info, office, closer name

### Build Constraints for Current Code
- document_templates.merge_fields should be a JSONB map of field_name → data_path (e.g., "customer_name" → "contact.first_name + contact.last_name")
- The proposal summary card already displays all the data that merge fields need — use the same data fetching
- Design templates to be provider-agnostic: the template defines merge fields, the provider adapter handles API specifics

---

## Commission Push (Sequifi/CaptiveIQ)

### What It Is
When a deal reaches specific milestones (contract signed, install complete, PTO), push commission data to Sequifi or CaptiveIQ for automatic commission calculation and payment.

### Why It Matters
Commissions are currently tracked manually or in spreadsheets. Errors = unhappy reps. Automation = accurate, fast, transparent.

### What It Touches
- **Existing tables:** commission_structures (already in schema), deals, users
- **New tables:** commission_events (log of what was pushed and when)
- **External:** Sequifi API and/or CaptiveIQ API
- **User fields:** sequifi_id, captiveiq_id on users table (noted as missing in schema, tracked for future migration)

### Commission Triggers
- Contract signed → closer commission earned
- Install complete → setter override earned
- PTO approved → final commission release
- Deal cancelled after contract → clawback event

### Build Constraints for Current Code
- commission_structures table exists but isn't populated — needs admin UI (Epic 11)
- Users table is missing sequifi_id and captiveiq_id — these are tracked in db-audit.md for a future migration
- Commission calculations should pull from the finalized proposal's pricing data — don't recalculate

---

## Notifications & Communication Layer

### What It Is
Multi-channel notification system: in-app notifications, email, and SMS (via Twilio). Triggered by deal events, system events, and user actions.

### Why It Matters
Closers need to know when their design is complete, when financing is approved, when a customer calls HQ. Managers need to know when a deal is stuck or a gate is overdue. Without notifications, people have to constantly check the app.

### What It Touches
- **Existing tables:** notifications (already in schema with user_id, type, title, message, read_at, action_url)
- **New tables:** notification_preferences (per-user channel preferences), notification_templates
- **External:** Twilio (SMS), SendGrid/SES (email)

### Notification Events
- Design complete → closer
- Financing approved/denied → closer
- Stip requested → closer
- Contract signed → closer + manager
- Deal stuck > 48hrs at stage → manager
- Customer called HQ → closer
- Change order requested → closer
- New lead assigned → closer/setter
- Gate overdue → closer + manager
- Deal cancelled → closer + setter + manager

### Build Constraints for Current Code
- notifications table already exists — use it for in-app notifications
- Every notification should be created as a database record first, THEN dispatched to external channels — never rely solely on email/SMS
- action_url on notifications should deep-link to the relevant deal/page
- Notification preferences should default to all-on, user can mute specific categories

---

## Design Queue (Enerflo Replacement)

### What It Is
A queue/dashboard for the in-house design team to pick up design requests, prioritize work, and track their throughput. Replaces Enerflo's Design Requests portal.

### Why It Matters
Designers currently use Enerflo as their work queue. When KinOS replaces Enerflo, designers need a place to see incoming design requests, claim them, and mark them complete. Without this, the design team has no workflow tool.

### What It Touches
- **Existing tables:** deals (filtered to design_requested stage), contacts, users
- **Existing code:** Aurora integration (design requests, results)
- **UI:** New route: /design-queue (restricted to design team role or admin)

### Key Behaviors
- Queue view: all deals at design_requested stage, sorted by priority/age
- Claim: designer claims a deal, assigns themselves
- Open in Aurora: one-click link to Aurora project
- Mark complete: when design is done in Aurora, designer marks it in KinOS (or webhook auto-updates)
- Priority indicators: rush jobs, large systems, VIP customers
- Throughput metrics: designs completed today/week, avg turnaround time

### Build Constraints for Current Code
- This is essentially a filtered view of the deals pipeline — not a new data model
- Design team needs its own role (currently not in the 5 roles — may need a 'designer' role)
- The Aurora webhook for design_request_completed already auto-advances deals — the design queue just provides the human workflow around it

---

## Customer Portal

### What It Is
A customer-facing web portal where homeowners can track their solar project status, view documents, upload requested files, and communicate with their closer.

### Why It Matters
Customers call HQ or text their closer constantly asking "what's happening with my project?" A self-service portal reduces this by 70%+ and improves customer satisfaction.

### Key Features
- Project timeline: visual progress from sale through PTO
- Document center: view/download contract, proposals, utility bill receipts
- Upload center: submit utility bills, ID photos, HOA approvals
- Messaging: in-app communication with closer (logged to communication_log)
- Status notifications: email/SMS when milestones are reached

### Build Constraints for Current Code
- Customer auth is separate from employee auth — needs its own Supabase Auth flow
- Customer should only see THEIR deal(s) — strong RLS enforcement
- communication_log table (migration 014) supports this — messages between customer and closer
- The portal reads from the same deal data the CRM displays — no separate data model

---

## Mobile Experience

### What It Is
A responsive, mobile-optimized version of KinOS focused on the closer's day-to-day needs: checking deal status, updating contact info, viewing design results, and receiving notifications.

### Why It Matters
Closers are in the field. They're at kitchen tables, in trucks, at appointments. They need quick access on their phone — not a desktop-only app.

### Priority Screens (Mobile)
1. Dashboard with deal counts and alerts
2. Deal list with search/filter
3. Deal detail with stage info and one-tap actions
4. Notification center
5. Calendar/appointments

### Build Constraints for Current Code
- shadcn/ui + Tailwind CSS already supports responsive design — this is primarily CSS/layout work
- Consider a PWA (Progressive Web App) approach for installability without app store
- Mobile-specific interactions: swipe to advance stage, tap-to-call customer, pull-to-refresh

---

## Change Order Management

### What It Is
A formal workflow for handling post-sale changes to a deal: additional panels, equipment swaps, pricing adjustments, adder additions/removals. Change orders can be initiated by ops, design team, or closer, and require appropriate approvals.

### Why It Matters
Change orders are currently handled via phone calls and emails. There's no audit trail, pricing doesn't auto-adjust, and commission impacts aren't tracked. This creates disputes and errors.

### What It Touches
- **New tables:** change_orders, change_order_items
- **Existing tables:** deals, proposals, deal_adders, activities, notifications
- **Integration:** Quickbase (change orders may originate from ops)

### Key Behaviors
- Change order request: what changed, why, who requested
- Pricing impact: auto-calculate how the change affects gross cost, net cost, monthly payment, commission
- Approval workflow: requires closer approval (if pricing changes), manager approval (if above threshold)
- Apply: once approved, updates deal data + creates new proposal version
- Notification: all stakeholders notified of change and impact
- Audit trail: full history of what changed, who approved, old vs new values

### Build Constraints for Current Code
- The pricing engine already supports recalculation — change orders should trigger a recalc with the modified inputs
- Don't modify the original proposal — create a new version or a change_order_adjustments record
- Commission impact needs to be calculated and flagged (possible clawback or additional commission)
- This feature depends on: post-sale pipeline visibility, notifications, and the pricing engine being accessible programmatically

---

## Site Survey & Arrivy Integration

### What It Is
Before a deal can be submitted, a site survey must be scheduled and completed. KinOS integrates with Arrivy (KIN Home's field management platform) to schedule site surveys, show surveyor availability, track survey status, and give closers full control — schedule, reschedule, cancel, and monitor progress without calling HQ.

Arrivy is also used for install scheduling post-sale, making this integration foundational for future post-sale pipeline visibility.

### Why It Matters
- Site surveys are a submission gate — deal can't move to submission_ready without a completed survey
- Closers currently call HQ to schedule surveys, then have no visibility into status
- Cancellations and reschedules require phone calls or emails — slow and error-prone
- Survey results (photos, measurements, notes) affect final system design and pricing — closers need to see them

### Where It Fits in the Pipeline
```
...contract_signed → site_survey_scheduled → site_survey_complete → submission_ready → submitted...
```
Site survey must be **scheduled** (not completed) before a deal can be submitted. The survey happens in parallel with or after submission — it doesn't block it.

### What It Touches
- **Existing tables:** deals (add arrivy_task_id, site_survey_status, site_survey_date, site_survey_notes), gate_definitions (new gate: "Site Survey Complete"), gate_completions
- **New tables (if needed):** site_surveys (or just fields on deals — TBD based on complexity)
- **External:** Arrivy API (task creation, availability, status, cancellation)
- **UI:** Site Survey step in deal workflow, survey status card on deal detail

### Arrivy API Capabilities (to research)
- **Availability:** GET available time slots for surveyors in a region
- **Schedule:** POST create task/job with customer info, address, time slot
- **Status:** GET task status (scheduled, en_route, started, completed, cancelled)
- **Reschedule:** PUT update task date/time
- **Cancel:** DELETE/PUT cancel task
- **Webhooks:** Task status change notifications (if supported)
- **Results:** Survey photos, notes, measurements (if returned via API)

### Key Behaviors
1. **Schedule Survey** — Closer clicks "Schedule Site Survey" on deal detail
   - Shows available time slots from Arrivy API (filtered by region/address)
   - Closer selects slot, confirms with customer
   - Creates Arrivy task with customer info + address auto-filled from deal
   - Stores arrivy_task_id on deal, status → site_survey_scheduled
   
2. **View Status** — Survey status card on deal detail shows:
   - Scheduled date/time
   - Assigned surveyor name
   - Current status (scheduled, en_route, in_progress, completed)
   - Real-time updates via Arrivy webhook or polling

3. **Reschedule** — Closer can reschedule from deal detail
   - Shows new available slots
   - Updates Arrivy task
   - Logs reschedule in activities with reason

4. **Cancel** — Closer can cancel survey
   - Cancels Arrivy task
   - Logs cancellation with reason
   - Status reverts, gate uncompletes

5. **Complete** — When survey is done:
   - Arrivy webhook/status update → deal status updates
   - Survey results (photos, notes) stored on deal or in attachments
   - Gate auto-completes: "Site Survey Complete"
   - Deal eligible to advance to submission_ready

6. **Notifications** — Closer gets notified:
   - Survey scheduled confirmation
   - Surveyor en route
   - Survey completed (with results link)
   - Survey cancelled or rescheduled by ops

### Build Constraints for Current Code
- Site survey is a GATE requiring **scheduled** status, not completed. The deal can advance to submission_ready once a survey is on the books — it doesn't have to be done yet. Add "Site Survey Scheduled" to gate_definitions seed data.
- Arrivy integration follows the same adapter pattern as lender integrations — abstract the Arrivy-specific API behind a field service interface
- Survey scheduling UI should show a calendar/slot picker — similar to the appointment calendar already built (Epic 5)
- Customer info + address passed to Arrivy should come from the deal's contact data — same source as Aurora project creation
- Since Arrivy also handles installs, design the integration layer to support multiple task types (survey, install, inspection) — not just surveys

### Future Extension (Post-Sale)
Once the Arrivy integration is built for site surveys, extending it to show install scheduling status in the post-sale pipeline is straightforward:
- Same API, same adapter, different task type
- Install scheduled/completed milestones come from Arrivy the same way survey milestones do
- This is a key piece of the post-sale visibility feature

### What KinOS Does Better Than Enerflo
- Enerflo has no site survey integration — it's entirely manual
- Self-service scheduling eliminates HQ phone calls
- Closer can reschedule/cancel without involving anyone else
- Survey status visible on deal detail — no "let me check on that for you"
- Results (photos, notes) attached to the deal automatically

---

## Cross-Cutting Concerns

### For ALL Future Features:

1. **Audit everything.** Every action, every change, every decision should be logged with who/what/when. Use the activities table for user-visible events and a dedicated audit_log for system-level tracking.

2. **Notifications are universal.** Every feature that changes deal state or requires user attention should emit a notification. Build the notification infrastructure early (Epic 8 timeframe) so all subsequent features can use it.

3. **Role-based access everywhere.** Every new page, every new action should check the user's role. Don't bolt on permissions later — build them in from day one.

4. **Mobile-first thinking.** Even before the mobile epic, every component should be built with responsive layouts. Don't create desktop-only patterns that need complete rewrites later.

5. **Provider-agnostic integrations.** Every external integration (lenders, doc signing, notifications) should use an adapter pattern. The business logic doesn't care if it's PandaDoc or SignNow — it cares that a contract was sent and signed.

6. **Offline resilience.** Closers in the field may have spotty internet. Critical actions (saving a deal, submitting a form) should queue and retry, not fail silently. Consider optimistic UI updates with background sync.

7. **Data snapshots at key moments.** When a deal reaches a milestone (proposal finalized, contract signed, submitted), capture a frozen snapshot. This prevents "what did it look like when we submitted?" confusion.
