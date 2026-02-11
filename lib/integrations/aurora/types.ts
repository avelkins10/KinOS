// lib/integrations/aurora/types.ts

// --- Input Types ---

export interface CreateProjectInput {
  name: string;
  external_provider_id?: string; // KinOS deal ID for reverse lookup
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
  monthly_energy?: number[]; // Array of 12 monthly kWh values
  annual_energy?: number; // Total annual kWh
  utility_id?: string;
  tariff_id?: string;
}

export interface CreateDesignRequestInput {
  project_id: string;
  sla?: number; // SLA in minutes (default 180 for 3hr)
  auto_accept?: boolean; // Auto-accept completed designs (default true)
  notes?: string;
  preferred_module_id?: string;
  preferred_inverter_id?: string;
  target_offset?: number; // e.g. 105 for 105%
  mounting_type?: "roof" | "ground";
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
    design_id?: string; // Populated when design is complete
    status: "pending" | "in_progress" | "completed" | "rejected" | "accepted";
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
    system_size_watts: number; // Convert to kW: / 1000
    annual_energy_production: number; // kWh
    offset: number; // Decimal, e.g. 1.05 = 105%
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
  status: "completed";
}

export interface AuroraWebhookDesignRequestRejected {
  design_request_id: string;
  status: "rejected";
}

export interface AuroraWebhookPerformanceSimulation {
  design_id: string;
  job_id: string;
  status: "completed" | "failed";
}
