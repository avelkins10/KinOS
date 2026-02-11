# Aurora Solar Integration Research & Epic 6 Planning

## Credentials

- **Tenant:** KIN Home
- **Tenant ID:** `034b1c47-310a-460f-9d5d-b625dd354f12`
- **Standard Key:** `sk_prod_5e9cc118a6e24ed265607bc4` (admin/manual use)
- **Restricted Key (KinOS):** `rk_prod_8ce392b2ec0f3243291c62a4` (app use)
- **API Version:** 2024.05 (latest)
- **API Base URL:** `https://api.aurorasolar.com`
- **Sandbox URL:** `https://api-sandbox.aurorasolar.com`

### Env Vars for Vercel:
```
AURORA_TENANT_ID=034b1c47-310a-460f-9d5d-b625dd354f12
AURORA_API_KEY=rk_prod_8ce392b2ec0f3243291c62a4
AURORA_API_VERSION=2024.05
AURORA_API_URL=https://api.aurorasolar.com
```

---

## Aurora API Endpoints (Key Ones for KinOS)

### Project Management
- `POST /tenants/{tenant_id}/projects` — Create project (customer info, address, lat/lng)
- `GET /tenants/{tenant_id}/projects/{project_id}` — Retrieve project
- `PUT /tenants/{tenant_id}/projects/{project_id}` — Update project

### Consumption Profile
- `GET /tenants/{tenant_id}/projects/{project_id}/consumption_profile` — Retrieve
- `PUT /tenants/{tenant_id}/projects/{project_id}/consumption_profile` — Update (monthly_energy array of 12 months, utility info)

### Design Requests (Aurora Site Modeling Service)
- `POST /tenants/{tenant_id}/design_requests` — Create design request
- `GET /tenants/{tenant_id}/design_requests/{id}` — Retrieve design request
- `GET /tenants/{tenant_id}/design_requests` — List design requests
- Accept design request endpoint (auto-accept or manual)

### Designs
- `GET /tenants/{tenant_id}/designs/{design_id}/summary` — Design summary (system size, panels, production, offset)
- `GET /tenants/{tenant_id}/designs/{design_id}` — Full design details
- `GET /tenants/{tenant_id}/designs/{design_id}/assets` — Design assets (screenshots, DXF)

### AutoDesigner
- `POST /tenants/{tenant_id}/designs/{design_id}/auto_designer` — Run AutoDesigner
- `GET /tenants/{tenant_id}/designs/{design_id}/auto_designer/{job_id}` — Status

### Performance Simulation
- Run and retrieve performance simulation results

### Pricing
- Aurora has pricing APIs for calculating system pricing

### Financing
- Integrated lenders (GoodLeap, LightReach) through Aurora
- `financier_contract_status_changed` webhook for status updates

### Agreements (Doc Signing)
- `agreement_status_changed` webhook (sent, viewed, signed, canceled, declined, error)

---

## Aurora Webhook Events (Full Catalog)

Aurora webhooks are **GET requests** with data in URL query parameters (NOT POST with JSON body like RepCard).

### Pipeline-Critical Events:
| Event | URL Params | KinOS Action |
|---|---|---|
| `design_request_created` | `design_request_id`, `source` | Deal → `design_requested`, store aurora_design_request_id |
| `design_request_completed` | `design_request_id`, `status` | Deal → `design_complete`, fetch design summary from API |
| `design_request_rejected` | `design_request_id`, `status` | Log rejection, notify closer, deal stays at `design_requested` |
| `performance_simulation_job_completed` | `design_id`, `job_id`, `status` | Store production estimates on deal (needed for Quickbase) |
| `web_proposal_url_created` | `design_id`, `source` | Fetch proposal URL, make available on deal |
| `proposal_pdf_generation_job_completed` | `design_id`, `job_id`, `status` | Store PDF, attach to deal |
| `financier_contract_status_changed` | `financing_id`, `external_provider_status`, `design_id` | Map GoodLeap/LightReach status → financing stages |
| `agreement_status_changed` | `project_id`, `agreement_id`, `status` | `sent`→`contract_sent`, `signed`→`contract_signed` |

### Nice-to-Have Events:
| Event | URL Params | KinOS Action |
|---|---|---|
| `project_created` | `project_id`, `source` | Confirm project creation |
| `project_status_changed` | `project_id`, `status` | General tracking |
| `project_changed` | `project_id`, `source`, `attributes` | Sync changes back |
| `auto_designer_job_completed` | `design_id`, `job_id`, `status` | AutoDesigner finished |
| `design_created` | `project_id`, `design_id`, `source` | New design created |
| `imagery_lidar_completed` | `project_id`, `status` | Imagery ready |
| `consumption_profile_changed` | `project_id` | Sync consumption changes |
| `ahj_lookup_completed` | `project_id`, `ahj_id`, `status` | AHJ assigned |

### Full Event List:
- agreement_status_changed
- ahj_lookup_completed
- ai_roof_job_completed
- app_status_changed
- asset_created
- auto_designer_job_completed
- consumption_profile_changed
- design_created
- design_deleted
- design_request_completed
- design_request_created
- design_request_rejected
- eagleview_design_request_created
- eagleview_design_request_status_changed
- financier_contract_status_changed
- fire_pathway_placement_job_completed
- imagery_lidar_completed
- milestone_created
- milestone_shared
- order_created
- panel_irradiance_analysis_job_completed
- performance_simulation_job_completed
- plan_set_request_status_changed
- project_changed
- project_created
- project_deleted
- project_status_changed
- proposal_pdf_generation_job_completed
- site_survey_requested
- site_survey_status_changed
- web_proposal_url_created

### Webhook Configuration Notes:
- URL Template based — you define the URL with `<PARAM>` placeholders
- Supports Header-based Token Auth or Basic Auth
- GET requests (not POST!)
- 10 second timeout, 5 retries with exponential backoff
- Max 5 subscriptions per event per tenant
- Filters available to only fire on specific statuses
- Auto-disables after 48 hours of failures (100+ attempts)

---

## KinOS ↔ Aurora Flow

### When to Create Aurora Project:
- **Trigger:** When closer first opens/works a deal (not on appointment_set)
- **Reason:** No wasted API calls on no-shows
- **Data passed:** Customer name, email, phone, address, lat/lng from contact record
- **Stored:** `deals.aurora_project_id`

### Step-by-Step Deal Flow:

1. **RepCard: appointment_set** → creates deal at `new_lead`
2. **RepCard: appointment_outcome (Sale)** → deal moves to `appointment_sat`
3. **Closer opens deal in KinOS** → Aurora project created automatically
4. **Consumption step:** Closer enters utility info in KinOS form
   - KinOS uses Aurora Utility API to populate utility company/tariff dropdowns by address
   - Closer enters/confirms monthly kWh usage (12 months)
   - KinOS pushes to Aurora via `PUT consumption_profile`
   - Chart preview shows monthly usage in real-time
5. **Design step — TWO PATHS:**
   - **Path A: Design Request** — Closer fills out design request form (panel, inverter, batteries, design type, target offset, mounting, roof material, notes) → KinOS calls `POST design_requests` → Aurora design team builds 3D model → `design_request_completed` webhook → KinOS pulls design summary → deal moves to `design_complete`
   - **Path B: Sales Mode** — Closer/designer clicks "Sales Mode" → opens Aurora directly at `https://app.aurorasolar.com/projects/{project_id}` → does design themselves → design data syncs back
6. **Design results displayed** in KinOS: satellite image with panels, system size kW, production kWh, offset %, panel count/type, inverter info
7. **Closer reviews:** "Request Changes" or proceed to Proposal
8. **Proposal step:** Generate proposal using design data + pricing
9. **Financing step:** Lender-dependent (Aurora integrated lenders or direct)
10. **Contract step:** Doc signing (Aurora agreements or external)
11. **Submission gates checked** → `submission_ready` → `submitted` → `intake_approved`

---

## Equipment Configuration

### Concept:
Admin configures approved equipment in KinOS Settings page. Equipment IDs map to Aurora's equipment catalog. When closer fills out design request, dropdowns only show approved equipment. Prevents mismatches.

### Equipment Types:
- **Solar Panels/Modules** — e.g., Q.PEAK DUO BLK ML-G10.C+ 410
- **Inverters** — e.g., SolarEdge SE10000H-US Wave (240V) (2024)
- **Batteries** — optional add-ons
- **Mounting Types** — Roof, Ground, Pergola
- **Roof Materials** — Asphalt Rolled, Asphalt Shingles, Clay Tile, Concrete Tile, Flat Gravel, Flat Membrane, Flat (Other), Metal (Other), Metal Shingle, Metal Standing Seam, Wood Shake

### Implementation:
- `equipment_catalog` table or settings JSONB on `companies` table
- Admin UI: Settings → Equipment → Add/Remove approved panels, inverters, batteries
- Pull available equipment from Aurora API
- Store Aurora equipment IDs + display names
- Design request form dropdowns populated from this config
- If company switches from Q.PEAK to REC panels, update once in settings → all future design requests use correct equipment

---

## Design Request Form Fields (from Enerflo Screenshot)

- Design Request Type: Design Team / AutoDesigner / Sales Mode
- Title: auto-generated from address
- Consumption Profile: dropdown (select existing or create new)
- Panel: dropdown (from approved equipment config)
- Inverter: dropdown (from approved equipment config)
- Batteries: optional, + Add Battery
- Design Priority: Standard / Expedited
- Design Type: Max Fit / Energy
- Target Offset: % input (default 105%)
- Mounting Type: Roof / Ground / Pergola (visual selector with images)
- Roof Material: visual selector with images (11 options)
- Notes for Designer: textarea

---

## Test Addresses (Aurora Sandbox)

These addresses instantly complete design requests without using credits:

| Address | Description |
|---|---|
| 901 Mears Ct, Stanford, CA 94305, USA | Gabled roof with dormer and vertical fold |
| 634 Mirada Ave, Stanford, CA 94305, USA | Simple hipped roof |
| 419 10th Ave, Belmar, NJ 07719, USA | Gabled roof |
| 7126 Casita Dr, Magnolia, TX 77354, USA | Roof with dormers |

Rejection test address:
| 600 Montgomery St, San Francisco, CA 94111 | TransAmerica Pyramid (commercial, gets rejected) |

---

## UX Principles for All Epics

### For Closers in the Field:
- Big touch targets, clear visual progress, minimal clicks
- Often on tablet in homeowner's kitchen
- Consumption form should feel like a clean card, not a spreadsheet
- Design request should be a guided flow, not a wall of dropdowns
- Key numbers (kW, production, offset) scannable at a glance

### For Design Results:
- Satellite image with panel overlay should be prominent
- Key metrics (system size, production, offset) large and scannable
- "Sales Mode" / "Request Changes" as obvious action buttons
- Equipment details (panel count/type, inverter) in supporting detail

### For Calendar:
- Closers glance at phone and instantly know: where next, homeowner name, reschedule count
- Color-coded status at a glance
- One tap to navigate (maps link)

### For Consumption Step:
- Clean utility bill entry form
- Real-time chart preview showing monthly usage as closer enters data
- Closer can show homeowner "here's what you're using now" on screen
- Builds trust, sells the conversation

### General:
- Modern, clean aesthetic (not Enerflo-era dense modals)
- shadcn/ui component library for consistency
- Mobile-responsive (closers use tablets and phones)
- Dark/light mode support
- Loading states and optimistic updates for snappy feel
- Toast notifications for async operations (design request submitted, etc.)

---

## Epic 6 Scope (Draft)

### Part 1: Aurora Project Auto-Creation
- When closer opens deal → create Aurora project via API
- Store `aurora_project_id` on deal
- Pass customer info + address from contact

### Part 2: Consumption Form
- New consumption step UI in deal detail
- Aurora Utility API for utility company/tariff lookups by address
- Monthly kWh input (12 months) with chart preview
- Push to Aurora consumption profile API on save
- Store locally on deal for KinOS display

### Part 3: Design Request Form
- Modal/drawer with guided flow
- Equipment dropdowns from configured catalog
- All fields from Enerflo modal (panel, inverter, batteries, priority, type, offset, mounting, roof material, notes)
- Submit → Aurora API → store design_request_id on deal
- Deal stage → `design_requested`

### Part 4: Sales Mode Link
- "Open in Sales Mode" button → opens Aurora directly
- URL: `https://app.aurorasolar.com/projects/{aurora_project_id}`

### Part 5: Aurora Webhook Handlers
- `design_request_completed` → pull design summary, deal → `design_complete`
- `design_request_rejected` → notify closer, log activity
- `performance_simulation_job_completed` → store production data
- GET route handlers (query params, not POST body)

### Part 6: Design Results Display
- Design card on deal detail: satellite image, system size, production, offset, panels, inverters
- "Request Changes" and "Sales Mode" action buttons
- Design history (if multiple designs)

### Part 7: Equipment Configuration
- Admin Settings → Equipment page
- Pull available equipment from Aurora API
- Add/remove approved panels, inverters, batteries
- Stored in KinOS, used in design request form

### Part 8: Migration
- Add `aurora_project_id UUID` to deals table
- Add `aurora_design_id UUID` to deals table
- Add `aurora_design_request_id UUID` to deals table
- Add consumption profile fields to deals (monthly_kwh JSONB, utility_company, tariff, etc.)
- Equipment catalog table or company settings

---

## Decisions Deferred to Later Epics

- **Financing integration:** Whether to use Aurora's integrated lenders (GoodLeap, LightReach) or handle directly. Lender-dependent. (Epic 8)
- **Doc signing:** Whether to use Aurora's agreement system or external (DocuSign/PandaDoc). (Epic 9)
- **Proposal generation:** Whether to use Aurora's proposal PDF/web proposal or build custom. (Epic 7)
- **Performance simulation data to Quickbase:** What exactly needs to pass. (Epic 10)
