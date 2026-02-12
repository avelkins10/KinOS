# Design Queue & Aurora Workflow — Research & Future Planning

> **Created:** 2026-02-11
> **Context:** Discovered during Epic 6 implementation that KIN Home uses an in-house design team workflow through Enerflo, not Aurora's external design team API.

---

## Current State: How Design Requests Work Today (Enerflo)

### Flow
1. **Closer requests design** in Enerflo deal
2. **Enerflo fires webhook** → Zapier (`hooks.zapier.com/hooks/catch/10520398/3c2sijc/`)
3. **Zapier sends** Slack message to design team + logs to Google Sheets
4. **Design appears** in Enerflo's "Design Requests" page under "Incoming" tab
5. **Designer clicks "Start"** → request moves to "In Progress", timer begins
6. **Designer clicks "Design in Aurora"** → opens Aurora v2 editor for that project
7. **Designer builds design** in Aurora (roof tracing, panel placement, simulation)
8. **Designer clicks "Sync" in Enerflo** → pulls design data from Aurora back into Enerflo
9. **Design marked "Completed"** → all data visible on the completed design page

### Enerflo Design Request Webhook Event
- Event: `design-request.created.design-team`
- Full payload captured in project files (see `enerflo-payload-analysis.md` context)

### Enerflo Design Request Payload — Key Fields
```
designRequest.id                    - UUID
designRequest.deal                  - Enerflo deal UUID
designRequest.queue                 - Design queue UUID (da341adc-d2b3-4784-acf9-86e247ea4804)
designRequest.assignedTo            - null initially (unassigned)
designRequest.title                 - "{address} Design {N}"
designRequest.status                - "NEW" → "IN_PROGRESS" → "COMPLETED"
designRequest.requestedAt           - ISO timestamp
designRequest.roofMaterial          - "ASPHALT_SHINGLES", etc.
designRequest.mountingType          - "ROOF" / "GROUND"
designRequest.priority              - 10 (numeric)
designRequest.notes                 - free text from closer
designRequest.revisionOf            - UUID if this is a redesign
designRequest.layoutImage           - null until synced
designRequest.options.targetOffset  - percentage
designRequest.options.maxFitSetting - "INCLUDE_ALL_ROOFS"

designRequest.consumption.annualConsumption    - 27950
designRequest.consumption.consumption[]        - 12-month array [2050, 2100, ...]
designRequest.consumption.bills[]              - 12-month estimated bills
designRequest.consumption.annualBill           - 3589.00
designRequest.consumption.averageMonthlyBill   - 299.08

designRequest.utility.id            - UUID
designRequest.utility.name          - "Lakeland Electric"
designRequest.utility.genabilityId  - 102

designRequest.consumption.tariff.tariffCode    - "RS"
designRequest.consumption.tariff.tariffName    - "Residential"
designRequest.consumption.estimatedRate        - 0.1078 ($/kWh)
designRequest.consumption.postSolarTariff      - different tariff for NEM

designRequest.availableModules[]     - pre-configured equipment list
designRequest.availableInverters[]   - pre-configured equipment list
designRequest.availableBatteries[]   - pre-configured (empty in sample)
designRequest.batteryCount           - 0

customer.*                           - full customer record with address, phone, email
```

### Design Completed — Data Available After "Sync"
```
System:
  system_size_dc       - 7.79 kW
  panel_count          - 19
  offset               - 99.98%
  annual_production    - 9,997.9 kWh

Panels:
  manufacturer         - "Hanwha Q Cells"
  model                - "Q.PEAK DUO BLK ML-G10.C+ 410W"
  wattage              - 410 watts

Inverter:
  manufacturer         - "SolarEdge"
  model                - "DCA USE11400H-USSKBEZ8 (7600W)"

Battery:
  manufacturer         - "N/A" or actual
  model                - "N/A" or actual (e.g., "SolarEdge: BAT-10K1P, 9.7 kWh")
  purpose              - "Backup" / "Self-Consumption" / none

Arrays (per roof face):
  array_number         - 1, 2, 3, 4
  panel_count          - panels on this face
  pitch                - degrees (e.g., 20)
  azimuth              - degrees (e.g., 270.32)
  solar_access         - percentage
  production           - kWh for this array
```

### Enerflo Design Queue UI Features
- **Left sidebar:** Incoming (count badge), Completed, Cancelled, All
- **List view:** Customer name, address, design title, rep name, date, avg kWh, monthly bill, target offset, due date
- **Timer:** Shows time since designer started (10min, 19min, 49min, 1hr 12min, etc.)
- **Status badges:** Completed (green), Expedited (orange), In Progress (blue)
- **Design detail page:** Solar design image (toggles: Solar Design / Map), General Info sidebar, Equipment section, Utility Information section, Customer Consumption with bar charts, monthly bill bar chart
- **Action buttons:** Edit Design, Design in Aurora (opens Aurora editor), Sync (pulls data from Aurora)
- **Designer avatar** with initials shown on list items

---

## Schema Gaps for Full Design Queue

### Fields we have on `deals` table:
✅ system_size_kw, panel_count, panel_model, inverter_model, battery_model
✅ annual_production_kwh, offset_percentage
✅ aurora_project_id, aurora_design_id, aurora_design_request_id
✅ design_status, design_request_type, design_requested_at, design_completed_at
✅ target_offset, roof_material, monthly_kwh (JSONB), annual_kwh
✅ utility_company, utility_tariff, monthly_bill

### Fields we need to add:
- panel_manufacturer (TEXT)
- panel_wattage (INTEGER)
- inverter_manufacturer (TEXT)
- battery_manufacturer (TEXT)
- battery_purpose (TEXT — 'backup', 'self_consumption', null)
- battery_count (INTEGER)
- design_arrays (JSONB — array of {array_number, panel_count, pitch, azimuth, solar_access, production_kwh})
- design_layout_image_url (TEXT — panel layout image from Aurora)
- design_started_at (TIMESTAMPTZ — when designer clicks Start)
- design_assigned_to (UUID FK → users — designer assignment)
- design_time_minutes (INTEGER — calculated from start to complete)
- design_priority (INTEGER — for queue ordering)
- design_revision_of (UUID FK → self — if this is a redesign, points to original deal or design request)

### New table needed (future): `design_requests`
For a proper design queue, we'll want a separate table rather than overloading the deals table:
```
design_requests:
  id UUID PK
  deal_id UUID FK → deals
  company_id UUID FK → companies
  requested_by UUID FK → users (closer)
  assigned_to UUID FK → users (designer) NULL
  status TEXT ('new', 'in_progress', 'completed', 'cancelled')
  priority INTEGER DEFAULT 10
  target_offset NUMERIC
  mounting_type TEXT
  roof_material TEXT
  notes TEXT
  revision_of UUID FK → design_requests (self-ref)
  started_at TIMESTAMPTZ
  completed_at TIMESTAMPTZ
  cancelled_at TIMESTAMPTZ
  design_time_minutes INTEGER
  layout_image_url TEXT
  design_data JSONB (arrays, equipment, production — snapshot at completion)
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
```

---

## Epic 6 Decision: Design Team Path

**Decision:** For Epic 6 (current), the "Design Team" option should NOT call `auroraClient.createDesignRequest()`. That sends the request to Aurora's external design team, which is not KIN Home's workflow.

**Instead, "Design Team" should:**
1. Create the Aurora project if not exists (via API — we need the project in Aurora for the designer to open)
2. Update deal: `design_status = 'design_requested'`, `stage = 'design_requested'`
3. Log activity
4. Send notification (Slack via Zapier for now, internal KinOS notification later)

**"Sales Mode" stays as-is** — opens Aurora for the closer to self-design.

**"Request Expert Design" (Aurora's team)** — keep as a backup/premium option, clearly labeled as outsourced.

---

## Future Epic: KinOS Design Queue (Epic 10+)

### Goal
Replace Enerflo's Design Requests page with a native KinOS design queue that your in-house design team uses.

### Features
1. **Design Queue Page** (`/design-requests`)
   - Tabs: Incoming, In Progress, Completed, Cancelled, All
   - List view with: customer, address, rep, date, consumption summary, timer, priority
   - Badge count on Incoming tab
   - Search/filter by designer, priority, date range

2. **Design Request Detail Page** (`/design-requests/[id]`)
   - Customer info header
   - Solar design image (toggle: Solar Design / Map view)
   - General Info sidebar: target offset, mounting type, roof material, sq footage, notes
   - Equipment section: modules, inverters, batteries (from company-configured list)
   - Utility Information: avg bill, annual bill, rate, provider, tariff
   - Consumption chart: monthly kWh bar chart + monthly bill bar chart
   - Action buttons: Start, Open in Aurora, Sync from Aurora, Complete, Cancel

3. **Designer Workflow**
   - Click "Start" → assigns to self, starts timer, moves to In Progress
   - Click "Open in Aurora" → opens `v2.aurorasolar.com/projects/{aurora_project_id}/system-design`
   - Designer builds in Aurora
   - Click "Sync from Aurora" → KinOS calls Aurora API to pull design summary, arrays, equipment, production
   - Click "Complete" → marks done, stops timer, updates deal with design data, notifies closer

4. **Sync from Aurora**
   - Call Aurora API: `GET /projects/{pid}/designs` → get latest design
   - Call Aurora API: `GET /designs/{did}/summary` → system size, production, offset
   - Call Aurora API: `GET /designs/{did}/assets` → panel layout image
   - Parse arrays, equipment, production data
   - Save to design_requests.design_data (JSONB snapshot)
   - Update deals table with latest design fields

5. **Notifications**
   - Closer → designer: "New design request for {address}"
   - Designer → closer: "Design completed for {address}" (with key metrics)
   - Slack integration (direct, not Zapier) for team channel notifications
   - Push notification for mobile

6. **Revision/Redesign Flow**
   - "Request Redesign" creates a new design_request with `revision_of` pointing to previous
   - Previous design data preserved for history
   - New request goes to Incoming queue

### Dependencies
- `design_requests` table (new migration)
- Aurora API: design summary, assets, arrays endpoints
- Company-level equipment configuration (available modules/inverters/batteries)
- Genability or UtilityAPI integration for utility/tariff lookup (enriches consumption data)
- Designer role in KinOS user system

### Nice-to-Haves
- Auto-assign based on designer workload
- Priority rules (expedited flag, deal value thresholds)
- SLA tracking with overdue alerts
- Design time analytics (avg time per designer, per complexity)
- Satellite image thumbnail on queue list (from Aurora or Google Maps)

---

## Utility/Tariff Data — Genability Integration (Also Future)

The Enerflo payload includes rich Genability data:
- Utility provider name + ID
- Tariff code, name, effective date
- Estimated rate ($/kWh)
- Post-solar tariff (for NEM calculations)
- Monthly estimated bills, energy costs, fixed costs, minimum costs

This data comes from **Genability** (now part of Arcadia). KinOS will need this for:
- Accurate bill savings calculations in proposals
- Utility rate lookups during consumption entry
- Post-solar tariff selection for NEM modeling

**Note:** Austin had an Arcadia tab open in his browser — may already have access to Genability.
