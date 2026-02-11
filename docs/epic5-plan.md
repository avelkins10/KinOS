# Epic 5: RepCard Webhooks, Appointments & Calendar

## Context

KinOS is a Next.js 16 App Router + Supabase CRM replacing Enerflo for KIN Home (solar).
Epics 0-4 complete (infrastructure, auth, RepCard connector, pipeline/deals, leads management).
Database has 43+ tables live at Supabase project tmfbggewmqcwryhzgrct.

Currently only the `appointment_set` event is wired (via RepCard connector → creates contact + deal).
RepCard has 7 separate webhooks configured, each firing to its own URL. All 7 need handlers.

Appointment data currently lives as flat fields on the `deals` table, but contacts can have
multiple appointments over time (reschedules, no-shows, cancellations). Closers need to see
appointment history before walking into a sit.

## Part 1: Appointments Table (Migration 007)

### New table: `appointments`

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),

  -- RepCard IDs
  repcard_appointment_id INTEGER UNIQUE,

  -- People
  closer_id UUID REFERENCES users(id),
  setter_id UUID REFERENCES users(id),

  -- Schedule
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,

  -- Status & Outcome
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'completed', 'no_show',
    'cancelled', 'rescheduled'
  )),
  outcome TEXT,
  outcome_id INTEGER,
  outcome_notes TEXT,

  -- Notes from RepCard
  notes TEXT,

  -- Attachments from RepCard (photos, utility bills sent with appointment)
  repcard_attachments JSONB DEFAULT '[]',

  -- Metadata
  appointment_type TEXT DEFAULT 'in_home' CHECK (appointment_type IN (
    'in_home', 'virtual', 'phone', 'follow_up'
  )),
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_appointments_contact ON appointments(contact_id);
CREATE INDEX idx_appointments_deal ON appointments(deal_id);
CREATE INDEX idx_appointments_closer ON appointments(closer_id);
CREATE INDEX idx_appointments_setter ON appointments(setter_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_start);
CREATE INDEX idx_appointments_repcard ON appointments(repcard_appointment_id);
CREATE INDEX idx_appointments_active ON appointments(closer_id, scheduled_start) WHERE is_active = true;
CREATE INDEX idx_appointments_company_date ON appointments(company_id, scheduled_start) WHERE is_active = true;
```

Also add to `deals` table:
```sql
ALTER TABLE deals ADD COLUMN active_appointment_id UUID REFERENCES appointments(id);
```

Also add to `contacts` table:
```sql
ALTER TABLE contacts ADD COLUMN repcard_status TEXT;
```

RLS policies: Same pattern as deals — company isolation, role-based visibility.

## Part 2: RepCard Webhook Handlers (7 routes)

All routes follow the same pattern:
1. Parse and validate payload
2. Log to `webhook_events` table
3. Look up or create related records
4. Update KinOS data
5. Return 200

### Route structure:
```
app/api/webhooks/repcard/
  appointment-set/route.ts
  appointment-update/route.ts
  appointment-outcome/route.ts
  closer-update/route.ts
  status-changed/route.ts
  contact-type-changed/route.ts
  door-knocked/route.ts
```

### Shared utilities:
```
lib/integrations/repcard/
  webhook-types.ts
  webhook-utils.ts
```

### Handler details:

#### 1. appointment-set (update existing handler)
**Payload shape:** Appointment-based (top-level `id` = appointment ID, has `closer`, `contact`, appointment time fields)
**Action:**
- Upsert contact by `repcard_customer_id` (payload.contact.id) or phone+email match
- Look up closer by `closer.id` → `users.repcard_user_id`
- Look up setter by `contact.user.id` → `users.repcard_user_id`
- Create `appointments` record with `status: 'scheduled'`
- Create deal at stage `new_lead` with `active_appointment_id`
- Also populate deal's flat appointment fields for backward compat
- Store RepCard `appointment_attachment[]` URLs on appointment record

#### 2. appointment-update
**Payload shape:** Same as appointment-set
**Action:**
- Find appointment by `repcard_appointment_id = payload.id`
- If not found, treat as new appointment-set (idempotent)
- Update: `scheduled_start`, `scheduled_end`, `timezone`, `location`, `notes`
- Update deal's flat appointment fields
- Log activity: "Appointment rescheduled to {new_time}"

#### 3. appointment-outcome
**Payload shape:** Same structure, `appointment_status_id` and `appointment_status_title` have values
**Action:**
- Find appointment by `repcard_appointment_id = payload.id`
- Update: `outcome`, `outcome_id`, map `appointment_status_title` to `status`:
  - Contains "Sale" or "Signed" → `status: 'completed'`
  - Contains "No Show" → `status: 'no_show'`
  - Contains "Cancel" → `status: 'cancelled'`
  - Contains "Reschedule" → `status: 'rescheduled'`
  - Otherwise → `status: 'completed'` with outcome text stored
- Update deal `appointment_outcome` and `appointment_outcome_id`
- If completed/sale and deal is at `appointment_set` → advance deal to `appointment_sat`
- Log activity: "Appointment outcome: {outcome_title}"

#### 4. closer-update
**Payload shape:** Same as appointment-set, `closer` object is the NEW closer
**Action:**
- Find appointment by `repcard_appointment_id = payload.id`
- Find deal by `repcard_appointment_id = payload.id`
- Look up new closer by `closer.id` → `users.repcard_user_id`
- Update appointment `closer_id`
- Update deal `closer_id`
- Log to `deal_assignment_history`
- Log activity: "Closer reassigned to {closer_name}"

#### 5. status-changed
**Payload shape:** Contact-based (top-level `id` = RepCard customer ID, flat contact object, NO closer, NO appointment fields)
**Action:**
- Find contact by `repcard_customer_id = payload.id`
- Update contact `repcard_status = payload.status` (e.g. "Active", "Signed", "Appointment Scheduled")
- Log to `contact_change_history`
- Log activity: "RepCard status changed to {status}"

#### 6. contact-type-changed
**Payload shape:** Contact-based (same as status-changed)
**Action:**
- Find contact by `repcard_customer_id = payload.id`
- Map RepCard type to KinOS:
  - typeId 1 "Lead" → 'lead'
  - typeId 2 "Customer" → 'customer'
  - typeId 3 "Recruit" → 'other'
  - typeId 4 "Other" → 'other'
- Update contact `contact_type`
- If deal data present (system_size_kw, net_price, etc.), update deal fields
- Log to `contact_change_history`
- Log activity: "Contact type changed to {type}"

#### 7. door-knocked
**Payload shape:** TBD (likely contact-based or minimal)
**Action:**
- Find or create contact if new
- Log activity: "Door knocked at {address}"
- Low priority — setter activity tracking

### Webhook payload TypeScript types:

```typescript
// Appointment-based events
interface RepCardAppointmentPayload {
  id: number;                           // RepCard appointment ID
  title: string;
  appointment_link: string;
  appointment_location: string;
  notes: string;
  appointment_attachment: string[] | null;
  closer: RepCardUser;
  appointment_status_id: number | null;
  appointment_status_title: string;
  start_at_timezone: string;
  end_at_timezone: string;
  duration: number;
  appt_start_time_local: string;        // "2026-02-12 18:00:00"
  appt_end_time_local: string;
  appt_start_time: string;              // UTC
  appt_end_time: string;
  appt_start_time_with_offset: string;  // "2026-02-11 02:00:00+00:00"
  appt_end_time_with_offset: string;
  start_date_utc: string;
  start_time_utc: string;
  start_date_local: string;
  start_time_local: string;
  end_date_utc: string;
  end_date_local: string;
  end_time_utc: string;
  end_time_local: string;
  remind_at: string;
  remind_text: string;
  contact: RepCardContactNested;
  user: RepCardUser;                    // setter/creator
  created_at: string;
  updated_at: string;
}

// Contact-based events
interface RepCardContactPayload {
  id: number;                           // RepCard customer/contact ID
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  type: string;                         // "Lead", "Customer"
  typeId: number;                       // 1=Lead, 2=Customer, 3=Recruit, 4=Other
  status: string;                       // "Active", "Signed", etc.
  latitude: string;
  longitude: string;
  fullAddress: string;
  owner: RepCardUser;
  user: RepCardUser;
  notes: string;
  allNotes: string[];
  qb_record_id: number | null;
  both_spouses_present: boolean | null;
  system_size_kw: number | null;
  gross_price: number | null;
  net_price: number | null;
  gross_ppw: number | null;
  net_ppw: number | null;
  kca_project: number | null;
  kca_system_size_kw: number | null;
  countryCode: string;
  createdAt: string;
  contactSource: string | null;
}

interface RepCardUser {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  companyAccountNumber: string;
  jobTitle: string;
  companyWebsite: string;
  industry: string;
  role: string;
  badgeNo: string;
  location: string;                     // Region name
  team: string;
  image: string;
  companyId: number;
  createdAt: string;
}

interface RepCardContactNested {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  typeId: number;
  status: string;
  latitude: string;
  longitude: string;
  fullAddress: string;
  owner: RepCardUser;
  user: RepCardUser;
  notes: string;
  allNotes: string[];
  countryCode: string;
  createdAt: string;
  contactSource: string | null;
  qb_record_id: number | null;
  both_spouses_present: boolean | null;
  system_size_kw: number | null;
  gross_price: number | null;
  net_price: number | null;
  gross_ppw: number | null;
  net_ppw: number | null;
  kca_project: number | null;
  kca_system_size_kw: number | null;
  attachment: string[] | null;
  latestAttachment: string;
  soloAttachment: string | null;
  appointmentNotes: string[];
  appointmentLatestNotes: string | null;
}
```

## Part 3: Appointments Server Actions

```typescript
// lib/actions/appointments.ts

getContactAppointments(contactId: string): Promise<Appointment[]>
getDealAppointments(dealId: string): Promise<Appointment[]>
getCloserAppointments(closerId: string, dateRange: { start: Date, end: Date }): Promise<Appointment[]>
getAppointments(filters: {
  closerId?: string,
  setterId?: string,
  officeId?: string,
  dateRange: { start: Date, end: Date },
  status?: string[],
}): Promise<Appointment[]>
getTodaysAppointments(): Promise<Appointment[]>
getUpcomingAppointments(userId: string, days?: number): Promise<Appointment[]>
createAppointment(data: CreateAppointmentInput): Promise<Appointment>
updateAppointment(id: string, data: UpdateAppointmentInput): Promise<Appointment>
cancelAppointment(id: string, reason?: string): Promise<Appointment>
```

## Part 4: Calendar Page

### Route: `app/(crm)/calendar/page.tsx`

**Views:**
- Day view: Time slots 7am-9pm, appointments as blocks
- Week view: 7-day grid with appointment blocks
- Month view: Calendar grid with appointment count per day
- List view: Upcoming appointments table

**Features:**
- Role-based: Closers see their appointments, managers see office/team
- Color coding: blue=scheduled, green=completed, red=no-show, gray=cancelled, yellow=rescheduled
- Click appointment → modal with details (contact info, address, notes, appointment count for this contact)
- "View Contact" / "View Deal" links
- Today indicator + current time marker
- Filter by: closer, office, status, date range

**Components:**
```
components/calendar/
  calendar-view.tsx
  day-view.tsx
  week-view.tsx
  month-view.tsx
  appointment-list.tsx
  appointment-card.tsx
  appointment-detail-modal.tsx
  calendar-filters.tsx
```

Build custom with CSS grid — do NOT use FullCalendar (heavy, license issues).
Consider @schedule-x/react (lightweight, MIT) or pure custom.

## Part 5: Appointment Section on Lead Detail

### Update: `components/leads/detail/appointments-section.tsx`

**Display:**
- Active appointment at top (highlighted):
  - Date, time, timezone, closer name, location (maps link), status badge
- Appointment history below:
  - Count badge: "4 appointments"
  - Each row: date, time, status badge (color), outcome text, closer, setter
  - Sorted newest first
- "New Appointment" button for manual creation

## Part 6: Dashboard Appointment Widgets

**Closer dashboard:**
- "Today's Appointments" card: count + next appointment time + mini list

**Manager dashboard:**
- "Today's Appointments" count across office
- Appointment outcomes summary (completed, no-show, rescheduled counts)

## Part 7: Update Existing create-lead Handler

Refactor `app/api/webhooks/repcard/create-lead/route.ts`:
1. Also create `appointments` record
2. Set `deal.active_appointment_id`
3. Store RepCard attachment URLs on appointment
4. Share code with other handlers via `webhook-utils.ts`
5. Keep `/create-lead` as alias or redirect to `/appointment-set`

## Migrations

### 007_appointments_table.sql
- Create `appointments` table with indexes and RLS
- Add `active_appointment_id UUID REFERENCES appointments(id)` to `deals`
- Add `repcard_status TEXT` to `contacts`

## Important Patterns

- Use API routes (not direct server action imports) in client components
- All webhook handlers use Supabase admin client (service role key) — no auth context
- Webhook handlers must be idempotent (same payload twice = same result)
- Store times as TIMESTAMPTZ in UTC, display in user's timezone
- Use `appt_start_time_with_offset` from RepCard for storage (includes UTC offset)
- Log all webhook events to `webhook_events` table
- Do NOT create files in ~/.traycer/ — skip artifact instructions
