# Epic 6: Aurora Solar Integration — Implementation Plan

> **Branch:** `epic-6-aurora-integration`
> **Depends on:** Epics 0–5 complete, Aurora env vars in Vercel
> **Goal:** Closers can enter consumption, request designs, see results, and open Sales Mode — all from KinOS deal detail page.

---

## Pre-Flight Checklist (Austin does manually)

- [ ] Add Aurora env vars to Vercel AND `.env.local`:
  ```
  AURORA_TENANT_ID=034b1c47-310a-460f-9d5d-b625dd354f12
  AURORA_API_KEY=rk_prod_8ce392b2ec0f3043291c62a4
  AURORA_API_VERSION=2024.05
  AURORA_API_URL=https://api.aurorasolar.com
  ```
- [ ] Add webhook secret for Aurora webhook verification:
  ```
  AURORA_WEBHOOK_SECRET=<generate-a-random-string>
  ```
- [ ] Branch exists: `git checkout epic-6-aurora-integration`

---

## Part 1: Migration (010_aurora_design_fields.sql)

**File:** `docs/migrations/010_aurora_design_fields.sql`

```sql
-- ============================================================
-- Migration 010: Aurora Design Integration Fields
-- Epic 6: Add aurora_design_request_id + design_status tracking
-- ============================================================

-- 1. Add missing Aurora tracking field to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS aurora_design_request_id TEXT;

-- 2. Add design status tracking (Aurora design requests go through states)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_status TEXT CHECK (design_status IN (
  'not_started',
  'consumption_entered',
  'project_created',
  'design_requested',
  'design_in_progress',
  'design_completed',
  'design_rejected',
  'design_accepted'
));
ALTER TABLE deals ALTER COLUMN design_status SET DEFAULT 'not_started';

-- 3. Add consumption fields to deals (closer enters these before design request)
-- NOTE: Many consumption fields already exist on contacts table. These on deals
-- capture the per-deal snapshot (customer may have multiple deals / change usage).
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_kwh JSONB;  -- [jan, feb, ..., dec] array of 12 numbers
ALTER TABLE deals ADD COLUMN IF NOT EXISTS annual_kwh NUMERIC(10,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS utility_company TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS utility_tariff TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS monthly_bill NUMERIC(10,2);  -- average monthly electric bill

-- 4. Add design request metadata
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_request_type TEXT CHECK (design_request_type IN (
  'design_team',    -- Aurora design team builds it
  'auto_designer',  -- Aurora AutoDesigner
  'sales_mode'      -- Closer builds in Sales Mode
));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_requested_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_completed_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS design_request_notes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS target_offset NUMERIC(5,2) DEFAULT 105;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS roof_material TEXT;

-- 5. Add Sales Mode deep link (stored after design complete for quick access)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS aurora_sales_mode_url TEXT;

-- 6. Index for looking up deals by Aurora IDs (webhook handlers need this)
CREATE INDEX IF NOT EXISTS idx_deals_aurora_design_request ON deals(aurora_design_request_id);
CREATE INDEX IF NOT EXISTS idx_deals_aurora_project ON deals(aurora_project_id);
CREATE INDEX IF NOT EXISTS idx_deals_design_status ON deals(design_status);

-- 7. Update the v_deal_detail view to include new fields
-- (Drop and recreate since adding columns to a view requires this)
DROP VIEW IF EXISTS v_deal_detail;
CREATE VIEW v_deal_detail AS
SELECT
  d.*,
  c.first_name AS contact_first_name,
  c.last_name AS contact_last_name,
  c.email AS contact_email,
  c.phone AS contact_phone,
  c.address AS contact_address,
  c.city AS contact_city,
  c.state AS contact_state,
  c.zip AS contact_zip,
  c.latitude AS contact_latitude,
  c.longitude AS contact_longitude,
  c.utility_company AS contact_utility_company,
  c.annual_usage_kwh AS contact_annual_usage_kwh,
  c.monthly_electric_bill AS contact_monthly_electric_bill,
  c.monthly_usage_kwh AS contact_monthly_usage_kwh,
  closer.first_name AS closer_first_name,
  closer.last_name AS closer_last_name,
  closer.email AS closer_email,
  setter.first_name AS setter_first_name,
  setter.last_name AS setter_last_name,
  setter.email AS setter_email,
  o.name AS office_name,
  t.name AS team_name,
  l.name AS lender_name,
  lp.name AS lender_product_name
FROM deals d
LEFT JOIN contacts c ON d.contact_id = c.id
LEFT JOIN users closer ON d.closer_id = closer.id
LEFT JOIN users setter ON d.setter_id = setter.id
LEFT JOIN offices o ON d.office_id = o.id
LEFT JOIN teams t ON d.team_id = t.id
LEFT JOIN lenders l ON d.lender_id = l.id
LEFT JOIN lender_products lp ON d.lender_product_id = lp.id
WHERE d.deleted_at IS NULL;
```

**IMPORTANT:** The existing v_deal_detail view has 94 columns. Before running this migration, first check the EXACT current view definition with:
```sql
SELECT pg_get_viewdef('v_deal_detail', true);
```
Then recreate it with all existing columns PLUS the new ones. The SQL above is a starting template — the actual view must match the live definition exactly.

**Run this migration** via Supabase SQL Editor.

---

## Part 2: Aurora API Client

**File:** `lib/integrations/aurora/client.ts`

Create a typed Aurora API client. All Aurora calls go through this.

```typescript
// lib/integrations/aurora/client.ts

const AURORA_API_URL = process.env.AURORA_API_URL || 'https://api.aurorasolar.com';
const AURORA_API_KEY = process.env.AURORA_API_KEY!;
const AURORA_API_VERSION = process.env.AURORA_API_VERSION || '2024.05';
const AURORA_TENANT_ID = process.env.AURORA_TENANT_ID!;

interface AuroraRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

async function auroraFetch<T = unknown>({ method, path, body }: AuroraRequestOptions): Promise<T> {
  const url = `${AURORA_API_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${AURORA_API_KEY}`,
      'X-Aurora-Api-Version': AURORA_API_VERSION,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Aurora API ${method} ${path} failed (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

// Helper to build tenant-scoped paths
function tenantPath(path: string): string {
  return `/tenants/${AURORA_TENANT_ID}${path}`;
}

export const auroraClient = {
  // === PROJECTS ===
  createProject(data: CreateProjectInput) {
    return auroraFetch<AuroraProject>({
      method: 'POST',
      path: tenantPath('/projects'),
      body: { project: data },
    });
  },

  getProject(projectId: string) {
    return auroraFetch<AuroraProject>({
      method: 'GET',
      path: tenantPath(`/projects/${projectId}`),
    });
  },

  // === CONSUMPTION PROFILE ===
  getConsumptionProfile(projectId: string) {
    return auroraFetch<AuroraConsumptionProfile>({
      method: 'GET',
      path: tenantPath(`/projects/${projectId}/consumption_profile`),
    });
  },

  updateConsumptionProfile(projectId: string, data: UpdateConsumptionInput) {
    return auroraFetch<AuroraConsumptionProfile>({
      method: 'PUT',
      path: tenantPath(`/projects/${projectId}/consumption_profile`),
      body: { consumption_profile: data },
    });
  },

  // === DESIGN REQUESTS ===
  createDesignRequest(data: CreateDesignRequestInput) {
    return auroraFetch<AuroraDesignRequest>({
      method: 'POST',
      path: tenantPath('/design_requests'),
      body: { design_request: data },
    });
  },

  getDesignRequest(designRequestId: string) {
    return auroraFetch<AuroraDesignRequest>({
      method: 'GET',
      path: tenantPath(`/design_requests/${designRequestId}`),
    });
  },

  acceptDesignRequest(designRequestId: string) {
    return auroraFetch<AuroraDesignRequest>({
      method: 'POST',
      path: tenantPath(`/design_requests/${designRequestId}/accept`),
    });
  },

  // === DESIGNS ===
  getDesignSummary(designId: string) {
    return auroraFetch<AuroraDesignSummary>({
      method: 'GET',
      path: tenantPath(`/designs/${designId}/summary`),
    });
  },

  getDesignAssets(designId: string) {
    return auroraFetch<AuroraDesignAssets>({
      method: 'GET',
      path: tenantPath(`/designs/${designId}/assets`),
    });
  },

  // === EQUIPMENT CATALOG ===
  listModules(params?: { per_page?: number }) {
    const query = params?.per_page ? `?per_page=${params.per_page}` : '';
    return auroraFetch<{ modules: AuroraModule[] }>({
      method: 'GET',
      path: tenantPath(`/modules${query}`),
    });
  },

  listInverters(params?: { per_page?: number }) {
    const query = params?.per_page ? `?per_page=${params.per_page}` : '';
    return auroraFetch<{ inverters: AuroraInverter[] }>({
      method: 'GET',
      path: tenantPath(`/inverters${query}`),
    });
  },
};
```

**File:** `lib/integrations/aurora/types.ts`

```typescript
// lib/integrations/aurora/types.ts

// --- Input Types ---

export interface CreateProjectInput {
  name: string;
  external_provider_id?: string;  // KinOS deal ID for reverse lookup
  customer_salutation?: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email?: string;
  customer_phone?: string;
  street_address_1: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  preferred_module_id?: string;
  preferred_inverter_id?: string;
}

export interface UpdateConsumptionInput {
  monthly_energy?: number[];       // Array of 12 monthly kWh values
  annual_energy?: number;          // Total annual kWh
  utility_id?: string;
  tariff_id?: string;
}

export interface CreateDesignRequestInput {
  project_id: string;
  sla?: number;                    // SLA in minutes (default 180 for 3hr)
  auto_accept?: boolean;           // Auto-accept completed designs (default true)
  notes?: string;
  preferred_module_id?: string;
  preferred_inverter_id?: string;
  target_offset?: number;          // e.g. 105 for 105%
  mounting_type?: 'roof' | 'ground';
  roof_material?: string;
}

// --- Response Types ---

export interface AuroraProject {
  project: {
    id: string;
    name: string;
    external_provider_id?: string;
    status: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email?: string;
    street_address_1: string;
    city: string;
    state: string;
    zip_code: string;
    latitude: number;
    longitude: number;
    created_at: string;
  };
}

export interface AuroraConsumptionProfile {
  consumption_profile: {
    id: string;
    project_id: string;
    monthly_energy: number[];
    annual_energy: number;
    utility_id?: string;
    tariff_id?: string;
  };
}

export interface AuroraDesignRequest {
  design_request: {
    id: string;
    project_id: string;
    design_id?: string;            // Populated when design is complete
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'accepted';
    sla: number;
    auto_accept: boolean;
    notes?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface AuroraDesignSummary {
  design: {
    id: string;
    project_id: string;
    system_size_watts: number;       // Convert to kW: / 1000
    annual_energy_production: number; // kWh
    offset: number;                  // Decimal, e.g. 1.05 = 105%
    module_count: number;
    module: {
      id: string;
      manufacturer: string;
      model: string;
      wattage: number;
    };
    inverter?: {
      id: string;
      manufacturer: string;
      model: string;
    };
    storage?: {
      manufacturer: string;
      model: string;
      count: number;
    };
    arrays: Array<{
      id: string;
      azimuth: number;
      tilt: number;
      module_count: number;
    }>;
  };
}

export interface AuroraDesignAssets {
  assets: {
    irradiance_map_url?: string;
    panel_layout_url?: string;
    three_d_url?: string;
  };
}

export interface AuroraModule {
  id: string;
  manufacturer: string;
  model: string;
  wattage: number;
  type: string;
}

export interface AuroraInverter {
  id: string;
  manufacturer: string;
  model: string;
  type: string;
}

// --- Webhook Event Types ---
// Aurora webhooks are GET requests with data in URL query parameters

export interface AuroraWebhookDesignRequestCompleted {
  design_request_id: string;
  status: 'completed';
}

export interface AuroraWebhookDesignRequestRejected {
  design_request_id: string;
  status: 'rejected';
}

export interface AuroraWebhookPerformanceSimulation {
  design_id: string;
  job_id: string;
  status: 'completed' | 'failed';
}
```

---

## Part 3: Aurora Service Layer (Business Logic)

**File:** `lib/integrations/aurora/service.ts`

This contains the orchestration functions that the API routes and UI call.

```typescript
// lib/integrations/aurora/service.ts

import { auroraClient } from './client';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Create an Aurora project for a deal.
 * Called when closer first enters consumption data or clicks "Request Design".
 * Idempotent — if aurora_project_id already exists, returns it.
 */
export async function createAuroraProject(dealId: string): Promise<string> {
  // 1. Get deal with contact data
  const { data: deal, error } = await supabaseAdmin
    .from('deals')
    .select('*, contacts(*)')
    .eq('id', dealId)
    .single();

  if (error || !deal) throw new Error(`Deal ${dealId} not found`);

  // 2. If project already exists, return it
  if (deal.aurora_project_id) return deal.aurora_project_id;

  const contact = deal.contacts;
  if (!contact) throw new Error(`Deal ${dealId} has no contact`);

  // 3. Create Aurora project
  const result = await auroraClient.createProject({
    name: `${contact.first_name} ${contact.last_name} - ${deal.deal_number}`,
    external_provider_id: deal.id,
    customer_first_name: contact.first_name,
    customer_last_name: contact.last_name,
    customer_email: contact.email || undefined,
    customer_phone: contact.phone || undefined,
    street_address_1: contact.address || '',
    city: contact.city || '',
    state: contact.state || '',
    zip_code: contact.zip || '',
    latitude: contact.latitude || undefined,
    longitude: contact.longitude || undefined,
  });

  const auroraProjectId = result.project.id;

  // 4. Store Aurora project ID on deal
  await supabaseAdmin
    .from('deals')
    .update({
      aurora_project_id: auroraProjectId,
      design_status: 'project_created',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  // 5. Log activity
  await supabaseAdmin.from('activities').insert({
    deal_id: dealId,
    company_id: deal.company_id,
    activity_type: 'aurora_project_created',
    description: 'Aurora project created',
    metadata: { aurora_project_id: auroraProjectId },
  });

  return auroraProjectId;
}

/**
 * Save consumption data to both KinOS deal and Aurora project.
 * Called from the consumption form on the deal detail page.
 */
export async function saveConsumptionProfile(
  dealId: string,
  data: {
    monthly_kwh: number[];       // 12 values
    annual_kwh: number;
    utility_company?: string;
    utility_tariff?: string;
    monthly_bill?: number;
  }
) {
  // 1. Ensure Aurora project exists
  const auroraProjectId = await createAuroraProject(dealId);

  // 2. Push consumption to Aurora
  await auroraClient.updateConsumptionProfile(auroraProjectId, {
    monthly_energy: data.monthly_kwh,
    annual_energy: data.annual_kwh,
  });

  // 3. Save to KinOS deal
  await supabaseAdmin
    .from('deals')
    .update({
      monthly_kwh: data.monthly_kwh,
      annual_kwh: data.annual_kwh,
      utility_company: data.utility_company,
      utility_tariff: data.utility_tariff,
      monthly_bill: data.monthly_bill,
      design_status: 'consumption_entered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  return { aurora_project_id: auroraProjectId };
}

/**
 * Submit a design request to Aurora.
 * Called when closer clicks "Request Design" after entering consumption.
 */
export async function submitDesignRequest(
  dealId: string,
  options: {
    design_request_type: 'design_team' | 'auto_designer' | 'sales_mode';
    target_offset?: number;
    preferred_module_id?: string;
    preferred_inverter_id?: string;
    mounting_type?: 'roof' | 'ground';
    roof_material?: string;
    notes?: string;
    requested_by: string;  // user ID
  }
) {
  // 1. Get deal to verify state
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('aurora_project_id, design_status, deal_number, contact_id, company_id')
    .eq('id', dealId)
    .single();

  if (!deal) throw new Error(`Deal ${dealId} not found`);
  if (!deal.aurora_project_id) throw new Error('Aurora project must be created first');

  // 2. For Sales Mode, just return the deep link — no design request needed
  if (options.design_request_type === 'sales_mode') {
    const salesModeUrl = `https://v2.aurorasolar.com/projects/${deal.aurora_project_id}`;
    await supabaseAdmin
      .from('deals')
      .update({
        design_request_type: 'sales_mode',
        design_status: 'design_requested',
        aurora_sales_mode_url: salesModeUrl,
        stage: 'design_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    return { sales_mode_url: salesModeUrl };
  }

  // 3. Submit design request to Aurora
  const result = await auroraClient.createDesignRequest({
    project_id: deal.aurora_project_id,
    sla: 180,                          // 3 hour SLA
    auto_accept: true,                 // Auto-accept when design completes
    notes: options.notes || '',
    preferred_module_id: options.preferred_module_id,
    preferred_inverter_id: options.preferred_inverter_id,
    target_offset: options.target_offset || 105,
    mounting_type: options.mounting_type,
    roof_material: options.roof_material,
  });

  const designRequestId = result.design_request.id;

  // 4. Update deal
  await supabaseAdmin
    .from('deals')
    .update({
      aurora_design_request_id: designRequestId,
      design_request_type: options.design_request_type,
      design_status: 'design_requested',
      design_requested_at: new Date().toISOString(),
      design_request_notes: options.notes,
      target_offset: options.target_offset || 105,
      roof_material: options.roof_material,
      stage: 'design_requested',
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  // 5. Log activity
  await supabaseAdmin.from('activities').insert({
    deal_id: dealId,
    company_id: deal.company_id,
    activity_type: 'design_requested',
    description: `Design requested (${options.design_request_type})`,
    metadata: {
      aurora_design_request_id: designRequestId,
      requested_by: options.requested_by,
      type: options.design_request_type,
    },
  });

  return { design_request_id: designRequestId };
}

/**
 * Handle Aurora design_request_completed webhook.
 * Pulls design summary from Aurora, updates deal, advances stage.
 */
export async function handleDesignCompleted(designRequestId: string) {
  // 1. Find KinOS deal by aurora_design_request_id
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('id, aurora_project_id, company_id, closer_id, contact_id')
    .eq('aurora_design_request_id', designRequestId)
    .single();

  if (!deal) {
    console.error(`No deal found for design_request_id: ${designRequestId}`);
    return;
  }

  // 2. Get design request to find the design_id
  const designRequest = await auroraClient.getDesignRequest(designRequestId);
  const designId = designRequest.design_request.design_id;

  if (!designId) {
    console.error(`Design request ${designRequestId} completed but no design_id`);
    return;
  }

  // 3. Pull design summary from Aurora
  const designSummary = await auroraClient.getDesignSummary(designId);
  const design = designSummary.design;

  // 4. Pull design assets (panel layout image)
  let panelLayoutUrl: string | null = null;
  try {
    const assets = await auroraClient.getDesignAssets(designId);
    panelLayoutUrl = assets.assets?.panel_layout_url || null;
  } catch (e) {
    console.warn('Could not fetch design assets:', e);
  }

  // 5. Build Sales Mode URL
  const salesModeUrl = `https://v2.aurorasolar.com/projects/${deal.aurora_project_id}/designs/${designId}/e-proposal/overview`;

  // 6. Update deal with design results
  await supabaseAdmin
    .from('deals')
    .update({
      aurora_design_id: designId,
      system_size_kw: design.system_size_watts / 1000,
      panel_count: design.module_count,
      panel_model: `${design.module.manufacturer} ${design.module.model}`,
      inverter_model: design.inverter
        ? `${design.inverter.manufacturer} ${design.inverter.model}`
        : null,
      battery_model: design.storage
        ? `${design.storage.manufacturer} ${design.storage.model}`
        : null,
      battery_count: design.storage?.count || 0,
      annual_production_kwh: design.annual_energy_production,
      offset_percentage: design.offset * 100,  // Convert 1.05 → 105
      aurora_sales_mode_url: salesModeUrl,
      design_status: 'design_completed',
      design_completed_at: new Date().toISOString(),
      stage: 'design_complete',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deal.id);

  // 7. Create notification for closer
  if (deal.closer_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: deal.closer_id,
      company_id: deal.company_id,
      type: 'design_complete',
      title: 'Design Complete',
      message: `${(design.system_size_watts / 1000).toFixed(2)} kW system ready for review`,
      metadata: { deal_id: deal.id, design_id: designId },
    });
  }

  // 8. Log activity
  await supabaseAdmin.from('activities').insert({
    deal_id: deal.id,
    company_id: deal.company_id,
    activity_type: 'design_complete',
    description: `Design complete: ${(design.system_size_watts / 1000).toFixed(2)} kW, ${design.module_count} panels, ${design.annual_energy_production.toLocaleString()} kWh/yr`,
    metadata: {
      design_id: designId,
      system_size_kw: design.system_size_watts / 1000,
      panel_count: design.module_count,
      annual_production: design.annual_energy_production,
      offset: design.offset,
    },
  });

  // 9. Log webhook event
  await supabaseAdmin.from('webhook_events').insert({
    source: 'aurora',
    event_type: 'design_request_completed',
    payload: { design_request_id: designRequestId, design_id: designId },
    status: 'processed',
  });
}

/**
 * Handle Aurora design_request_rejected webhook.
 */
export async function handleDesignRejected(designRequestId: string, reason?: string) {
  const { data: deal } = await supabaseAdmin
    .from('deals')
    .select('id, company_id, closer_id')
    .eq('aurora_design_request_id', designRequestId)
    .single();

  if (!deal) {
    console.error(`No deal found for rejected design_request_id: ${designRequestId}`);
    return;
  }

  await supabaseAdmin
    .from('deals')
    .update({
      design_status: 'design_rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deal.id);

  // Notify closer
  if (deal.closer_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: deal.closer_id,
      company_id: deal.company_id,
      type: 'design_rejected',
      title: 'Design Rejected',
      message: reason || 'Design request was rejected. Please review and resubmit.',
      metadata: { deal_id: deal.id },
    });
  }

  await supabaseAdmin.from('activities').insert({
    deal_id: deal.id,
    company_id: deal.company_id,
    activity_type: 'design_rejected',
    description: `Design rejected${reason ? ': ' + reason : ''}`,
    metadata: { design_request_id: designRequestId, reason },
  });

  await supabaseAdmin.from('webhook_events').insert({
    source: 'aurora',
    event_type: 'design_request_rejected',
    payload: { design_request_id: designRequestId, reason },
    status: 'processed',
  });
}
```

---

## Part 4: Aurora Webhook Route Handlers

**CRITICAL:** Aurora webhooks are **GET requests** with data in **URL query parameters**. NOT POST with JSON body.

**File:** `app/api/webhooks/aurora/design-request-completed/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleDesignCompleted } from '@/lib/integrations/aurora/service';

export async function GET(request: NextRequest) {
  try {
    // Aurora sends data as query params on GET request
    const searchParams = request.nextUrl.searchParams;
    const designRequestId = searchParams.get('design_request_id');
    const status = searchParams.get('status');

    // Verify webhook token (Aurora sends this in header)
    const token = request.headers.get('x-aurora-webhook-token');
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!designRequestId || status !== 'completed') {
      return NextResponse.json({ error: 'Missing or invalid params' }, { status: 400 });
    }

    // Process async — return 200 immediately to Aurora
    // (Aurora has 10 second timeout)
    handleDesignCompleted(designRequestId).catch(err => {
      console.error('Error handling design completed:', err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Aurora webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**File:** `app/api/webhooks/aurora/design-request-rejected/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleDesignRejected } from '@/lib/integrations/aurora/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const designRequestId = searchParams.get('design_request_id');
    const status = searchParams.get('status');

    const token = request.headers.get('x-aurora-webhook-token');
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!designRequestId || status !== 'rejected') {
      return NextResponse.json({ error: 'Missing or invalid params' }, { status: 400 });
    }

    handleDesignRejected(designRequestId).catch(err => {
      console.error('Error handling design rejected:', err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Aurora webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**File:** `app/api/webhooks/aurora/performance-simulation/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auroraClient } from '@/lib/integrations/aurora/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const designId = searchParams.get('design_id');
    const status = searchParams.get('status');

    const token = request.headers.get('x-aurora-webhook-token');
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!designId || status !== 'completed') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Pull updated design summary with simulation results
    (async () => {
      try {
        const summary = await auroraClient.getDesignSummary(designId);
        const design = summary.design;

        await supabaseAdmin
          .from('deals')
          .update({
            annual_production_kwh: design.annual_energy_production,
            offset_percentage: design.offset * 100,
            updated_at: new Date().toISOString(),
          })
          .eq('aurora_design_id', designId);

        await supabaseAdmin.from('webhook_events').insert({
          source: 'aurora',
          event_type: 'performance_simulation_completed',
          payload: { design_id: designId },
          status: 'processed',
        });
      } catch (err) {
        console.error('Error handling perf simulation:', err);
      }
    })();

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Aurora webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## Part 5: API Routes for UI

**File:** `app/api/deals/[id]/aurora/route.ts`

Handles all Aurora actions from the deal detail page.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAuroraProject, saveConsumptionProfile, submitDesignRequest } from '@/lib/integrations/aurora/service';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();
    const { action } = body;

    // Auth check
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'create_project': {
        const projectId = await createAuroraProject(dealId);
        return NextResponse.json({ aurora_project_id: projectId });
      }

      case 'save_consumption': {
        const result = await saveConsumptionProfile(dealId, {
          monthly_kwh: body.monthly_kwh,
          annual_kwh: body.annual_kwh,
          utility_company: body.utility_company,
          utility_tariff: body.utility_tariff,
          monthly_bill: body.monthly_bill,
        });
        return NextResponse.json(result);
      }

      case 'submit_design_request': {
        const result = await submitDesignRequest(dealId, {
          design_request_type: body.design_request_type,
          target_offset: body.target_offset,
          preferred_module_id: body.preferred_module_id,
          preferred_inverter_id: body.preferred_inverter_id,
          mounting_type: body.mounting_type,
          roof_material: body.roof_material,
          notes: body.notes,
          requested_by: user.id,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Aurora API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
```

---

## Part 6: UI Components

### 6A: Consumption Form

**File:** `components/deals/consumption-form.tsx`

A card/step in the deal detail workflow. Shows:
- Monthly kWh input fields (12 months) with bar chart preview
- Annual total (auto-calculated from monthly OR manual entry)
- Average monthly bill ($)
- Utility company (text input — Genability/UtilityAPI integration deferred)
- "Save & Continue" button → calls `POST /api/deals/[id]/aurora` with action `save_consumption`

**Key UX:**
- Pre-fill from contact record if `contacts.monthly_usage_kwh` or `contacts.annual_usage_kwh` exists
- Real-time bar chart updates as closer types monthly values
- Annual total auto-sums if closer enters monthly, or distributes evenly if closer enters annual only
- Show the closer a visual they can turn the screen and show the homeowner

### 6B: Design Request Form

**File:** `components/deals/design-request-form.tsx`

A modal/drawer that opens from "Request Design" button. Shows:
- Design request type: Design Team / Sales Mode (radio cards)
- Target offset: % input (default 105)
- Mounting type: Roof / Ground (visual selector with icons)
- Roof material: visual selector (common options: Asphalt Shingles, Tile, Metal, etc.)
- Notes for designer: textarea
- "Submit Design Request" button → calls `POST /api/deals/[id]/aurora` with action `submit_design_request`

**Key UX:**
- Only enabled after consumption data is saved
- Design Team path submits to Aurora API
- Sales Mode path just returns the Aurora deeplink URL and opens it
- Show loading/submitted state after submit
- Disable re-submit if design already requested (show status instead)

### 6C: Design Results Card

**File:** `components/deals/design-results-card.tsx`

Displayed on the deal detail page after `design_status = 'design_completed'`. Shows:
- **System overview:** System size (kW), panel count, panel model, inverter model
- **Production:** Annual kWh, monthly breakdown (if available), offset %
- **Panel layout image:** From Aurora design assets (if available)
- **Key numbers large and scannable:** kW in big font, offset in color-coded badge
- **Action buttons:**
  - "Open Sales Mode" → opens Aurora deep link in new tab
  - "Request Redesign" → re-opens design request form, deal back to `design_requested`

### 6D: Design Status Indicator

**File:** `components/deals/design-status-badge.tsx`

Small badge/indicator shown on deal cards in pipeline view and deal detail header:
- `not_started` → gray "No Design"
- `consumption_entered` → blue "Ready for Design"
- `design_requested` → yellow "Design Pending" (with time since request)
- `design_completed` → green "Design Complete"
- `design_rejected` → red "Design Rejected"

### 6E: Deal Detail Integration

**Modify:** `app/deals/[id]/page.tsx` (or wherever the deal detail tabs/stepper lives)

Add Aurora section to the deal detail workflow stepper:
- Step 2 (Consumption) → renders `<ConsumptionForm />`
- Step 3 (Design) → renders `<DesignRequestForm />` or `<DesignResultsCard />` depending on design_status
- "Open in Sales Mode" button in header when `aurora_sales_mode_url` exists

---

## Part 7: Aurora Webhook Configuration (Austin does in Aurora Dashboard)

After deploying the webhook routes, configure these in Aurora:

1. **Go to:** Aurora Dashboard → Settings → API → Webhook Subscriptions
2. **Add subscriptions:**

| Event | URL Template | Auth |
|-------|-------------|------|
| design_request_completed | `https://kin-os-one.vercel.app/api/webhooks/aurora/design-request-completed?design_request_id=<DESIGN_REQUEST_ID>&status=<STATUS>` | Header: `x-aurora-webhook-token: {your_secret}` |
| design_request_rejected | `https://kin-os-one.vercel.app/api/webhooks/aurora/design-request-rejected?design_request_id=<DESIGN_REQUEST_ID>&status=<STATUS>` | Header: `x-aurora-webhook-token: {your_secret}` |
| performance_simulation_job_completed | `https://kin-os-one.vercel.app/api/webhooks/aurora/performance-simulation?design_id=<DESIGN_ID>&job_id=<JOB_ID>&status=<STATUS>` | Header: `x-aurora-webhook-token: {your_secret}` |

---

## Build Order (Sequential)

The agent should build these in order. Each step depends on the previous.

1. **Migration** — Run 010 migration in Supabase
2. **Aurora types** — `lib/integrations/aurora/types.ts`
3. **Aurora client** — `lib/integrations/aurora/client.ts`
4. **Aurora service** — `lib/integrations/aurora/service.ts`
5. **Webhook routes** — 3 GET route handlers
6. **Deal Aurora API route** — `app/api/deals/[id]/aurora/route.ts`
7. **UI: Consumption form** — `components/deals/consumption-form.tsx`
8. **UI: Design request form** — `components/deals/design-request-form.tsx`
9. **UI: Design results card** — `components/deals/design-results-card.tsx`
10. **UI: Design status badge** — `components/deals/design-status-badge.tsx`
11. **UI: Wire into deal detail page** — integrate components into deal workflow
12. **Regenerate Supabase types** — `pnpm exec supabase gen types typescript --project-id tmfbggewmqcwryhzgrct > lib/supabase/database.types.ts`
13. **Update docs** — Update PROJECT-KNOWLEDGE.md and db-audit.md per rules

---

## What's Explicitly NOT in This Epic

- **Utility rate lookup** (Genability/UtilityAPI) — deferred. Closer manually enters utility company name.
- **Equipment admin page** — deferred to Epic 7 or admin epic. Design request form uses text fields for now, not Aurora catalog dropdowns.
- **Pricing sync to Aurora** — deferred to Epic 7 (Proposal & Pricing Engine). Design data comes back, but pricing push happens later.
- **Aurora proposal PDF/web proposal** — deferred to Epic 7.
- **Financing webhooks** — deferred to Epic 8.
- **Agreement webhooks** — deferred to Epic 9.

---

## Testing Checklist

- [ ] Consumption form saves to deal and pushes to Aurora
- [ ] Design request creates project + design request in Aurora
- [ ] Aurora webhook fires and design results appear on deal
- [ ] Rejection webhook updates deal status and notifies closer
- [ ] Sales Mode button opens correct Aurora URL
- [ ] Design results display correct: kW, panels, production, offset
- [ ] Pipeline kanban shows design status badges
- [ ] Deal stage auto-advances: design_requested → design_complete
- [ ] Request redesign works (new design request on existing project)

**Test with Aurora instant-complete addresses:**
- 901 Mears Ct, Stanford, CA 94305 (should complete instantly)
- 600 Montgomery St, San Francisco, CA 94111 (should reject — TransAmerica Pyramid)
