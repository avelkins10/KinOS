/**
 * Aurora Solar API client.
 * Base URL: https://api.aurorasolar.com
 * Auth: Bearer token + X-Aurora-Api-Version
 */

import type {
  CreateProjectInput,
  UpdateConsumptionInput,
  CreateDesignRequestInput,
  AuroraProject,
  AuroraConsumptionProfile,
  AuroraDesignRequest,
  AuroraDesignSummary,
  AuroraDesignAssets,
  AuroraModule,
  AuroraInverter,
} from "./types";

const AURORA_API_URL =
  process.env.AURORA_API_URL || "https://api.aurorasolar.com";
const AURORA_API_KEY = process.env.AURORA_API_KEY!;
const AURORA_API_VERSION = process.env.AURORA_API_VERSION || "2024.05";
const AURORA_TENANT_ID = process.env.AURORA_TENANT_ID!;

interface AuroraRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
}

async function auroraFetch<T = unknown>({
  method,
  path,
  body,
}: AuroraRequestOptions): Promise<T> {
  const url = `${AURORA_API_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${AURORA_API_KEY}`,
      "X-Aurora-Api-Version": AURORA_API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Aurora API ${method} ${path} failed (${response.status}): ${error}`,
    );
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
      method: "POST",
      path: tenantPath("/projects"),
      body: { project: data },
    });
  },

  getProject(projectId: string) {
    return auroraFetch<AuroraProject>({
      method: "GET",
      path: tenantPath(`/projects/${projectId}`),
    });
  },

  // === CONSUMPTION PROFILE ===
  getConsumptionProfile(projectId: string) {
    return auroraFetch<AuroraConsumptionProfile>({
      method: "GET",
      path: tenantPath(`/projects/${projectId}/consumption_profile`),
    });
  },

  updateConsumptionProfile(projectId: string, data: UpdateConsumptionInput) {
    return auroraFetch<AuroraConsumptionProfile>({
      method: "PUT",
      path: tenantPath(`/projects/${projectId}/consumption_profile`),
      body: { consumption_profile: data },
    });
  },

  // === DESIGN REQUESTS ===
  createDesignRequest(data: CreateDesignRequestInput) {
    return auroraFetch<AuroraDesignRequest>({
      method: "POST",
      path: tenantPath("/design_requests"),
      body: { design_request: data },
    });
  },

  getDesignRequest(designRequestId: string) {
    return auroraFetch<AuroraDesignRequest>({
      method: "GET",
      path: tenantPath(`/design_requests/${designRequestId}`),
    });
  },

  acceptDesignRequest(designRequestId: string) {
    return auroraFetch<AuroraDesignRequest>({
      method: "POST",
      path: tenantPath(`/design_requests/${designRequestId}/accept`),
    });
  },

  // === DESIGNS ===
  getDesignSummary(designId: string) {
    return auroraFetch<AuroraDesignSummary>({
      method: "GET",
      path: tenantPath(`/designs/${designId}/summary`),
    });
  },

  getDesignAssets(designId: string) {
    return auroraFetch<AuroraDesignAssets>({
      method: "GET",
      path: tenantPath(`/designs/${designId}/assets`),
    });
  },

  // === EQUIPMENT CATALOG ===
  listModules(params?: { per_page?: number }) {
    const query = params?.per_page ? `?per_page=${params.per_page}` : "";
    return auroraFetch<{ modules: AuroraModule[] }>({
      method: "GET",
      path: tenantPath(`/modules${query}`),
    });
  },

  listInverters(params?: { per_page?: number }) {
    const query = params?.per_page ? `?per_page=${params.per_page}` : "";
    return auroraFetch<{ inverters: AuroraInverter[] }>({
      method: "GET",
      path: tenantPath(`/inverters${query}`),
    });
  },

  // === DESIGN PRICING (Epic 7: KinOS → Aurora sync) ===
  putDesignPricing(
    designId: string,
    data: { price_per_watt?: number; flat_price?: number },
  ) {
    return auroraFetch<{ design: { id: string } }>({
      method: "PUT",
      path: tenantPath(`/designs/${designId}/pricing`),
      body: { pricing: data },
    });
  },

  postDesignAdder(
    designId: string,
    data: { name: string; amount?: number; price_per_watt?: number },
  ) {
    return auroraFetch<{ adder: { id: string } }>({
      method: "POST",
      path: tenantPath(`/designs/${designId}/pricing/adders`),
      body: { adder: data },
    });
  },

  deleteDesignAdder(designId: string, adderId: string) {
    return auroraFetch<void>({
      method: "DELETE",
      path: tenantPath(`/designs/${designId}/pricing/adders/${adderId}`),
    });
  },
};
