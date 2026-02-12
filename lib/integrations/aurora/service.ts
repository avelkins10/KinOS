// lib/integrations/aurora/service.ts

import { auroraClient } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Create an Aurora project for a deal.
 * Called when closer first enters consumption data or clicks "Request Design".
 * Idempotent — if aurora_project_id already exists, returns it.
 */
export async function createAuroraProject(dealId: string): Promise<string> {
  // 1. Get deal with contact data
  const { data: deal, error } = await supabaseAdmin
    .from("deals")
    .select("*, contacts(*)")
    .eq("id", dealId)
    .single();

  if (error || !deal) throw new Error(`Deal ${dealId} not found`);

  // 2. If project already exists, return it
  if (deal.aurora_project_id) return deal.aurora_project_id;

  // contacts(*) on deals is many-to-one: Supabase returns single object; normalize if array
  const rawContact = deal.contacts;
  const contact = Array.isArray(rawContact) ? rawContact[0] : rawContact;
  if (!contact) throw new Error(`Deal ${dealId} has no contact`);

  // 3. Create Aurora project
  const result = await auroraClient.createProject({
    name: `${contact.first_name} ${contact.last_name} - ${deal.deal_number}`,
    external_provider_id: deal.id,
    customer_first_name: contact.first_name,
    customer_last_name: contact.last_name,
    customer_email: contact.email || undefined,
    customer_phone: contact.phone || undefined,
    street_address_1: contact.address || "",
    city: contact.city || "",
    state: contact.state || "",
    zip_code: contact.zip || "",
    latitude: contact.latitude || undefined,
    longitude: contact.longitude || undefined,
  });

  const auroraProjectId = result.project.id;

  // 4. Store Aurora project ID on deal
  await supabaseAdmin
    .from("deals")
    .update({
      aurora_project_id: auroraProjectId,
      design_status: "project_created",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  // 5. Log activity
  await supabaseAdmin.from("activities").insert({
    deal_id: dealId,
    title: "Aurora project created",
    activity_type: "aurora_project_created",
    description: "Aurora project created",
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
    monthly_kwh: number[]; // 12 values
    annual_kwh: number;
    utility_company?: string;
    utility_tariff?: string;
    monthly_bill?: number;
  },
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
    .from("deals")
    .update({
      monthly_kwh: data.monthly_kwh,
      annual_kwh: data.annual_kwh,
      utility_company: data.utility_company,
      utility_tariff: data.utility_tariff,
      monthly_bill: data.monthly_bill,
      design_status: "consumption_entered",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  return { aurora_project_id: auroraProjectId };
}

/**
 * Submit a design request to Aurora.
 * Called when closer clicks "Request Design" after entering consumption.
 */
export async function submitDesignRequest(
  dealId: string,
  options: {
    design_request_type: "design_team" | "auto_designer" | "sales_mode";
    target_offset?: number;
    preferred_module_id?: string;
    preferred_inverter_id?: string;
    mounting_type?: "roof" | "ground";
    roof_material?: string;
    notes?: string;
    requested_by: string; // user ID
  },
) {
  // 1. Get deal to verify state
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select(
      "aurora_project_id, design_status, deal_number, contact_id, company_id",
    )
    .eq("id", dealId)
    .single();

  if (!deal) throw new Error(`Deal ${dealId} not found`);
  if (!deal.aurora_project_id)
    throw new Error("Aurora project must be created first");

  // 2. For Sales Mode, just return the deep link — no design request needed
  if (options.design_request_type === "sales_mode") {
    const salesModeUrl = `https://v2.aurorasolar.com/projects/${deal.aurora_project_id}`;
    await supabaseAdmin
      .from("deals")
      .update({
        design_request_type: "sales_mode",
        design_status: "design_requested",
        aurora_sales_mode_url: salesModeUrl,
        stage: "design_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    return { sales_mode_url: salesModeUrl };
  }

  // 3a. DESIGN TEAM (in-house) — do NOT call Aurora API.
  // KIN Home designers work from a design queue (Enerflo today, KinOS future).
  // Aurora's createDesignRequest sends to Aurora's external paid design team.
  if (options.design_request_type === "design_team") {
    await supabaseAdmin
      .from("deals")
      .update({
        design_request_type: "design_team",
        design_status: "design_requested",
        design_requested_at: new Date().toISOString(),
        design_request_notes: options.notes,
        target_offset: options.target_offset ?? 105,
        roof_material: options.roof_material,
        stage: "design_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    await supabaseAdmin.from("activities").insert({
      deal_id: dealId,
      title: "Design requested (in-house team)",
      activity_type: "design_requested",
      description: `Design requested for in-house design team`,
      metadata: {
        requested_by: options.requested_by,
        type: "design_team",
        target_offset: options.target_offset ?? 105,
        roof_material: options.roof_material,
      },
    });

    // TODO: Send Slack notification via Zapier webhook
    // POST to Zapier with deal number, address, consumption summary
    // This replaces Enerflo's design-request.created webhook

    return { design_request_type: "design_team" };
  }

  // 3b. EXPERT DESIGN (Aurora's external team) — call Aurora API
  const result = await auroraClient.createDesignRequest({
    project_id: deal.aurora_project_id,
    sla: 180,
    auto_accept: true,
    notes: options.notes || "",
    preferred_module_id: options.preferred_module_id,
    preferred_inverter_id: options.preferred_inverter_id,
    target_offset: options.target_offset ?? 105,
    mounting_type: options.mounting_type,
    roof_material: options.roof_material,
  });

  const designRequestId = result.design_request.id;

  await supabaseAdmin
    .from("deals")
    .update({
      aurora_design_request_id: designRequestId,
      design_request_type: options.design_request_type,
      design_status: "design_requested",
      design_requested_at: new Date().toISOString(),
      design_request_notes: options.notes,
      target_offset: options.target_offset ?? 105,
      roof_material: options.roof_material,
      stage: "design_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  await supabaseAdmin.from("activities").insert({
    deal_id: dealId,
    title: `Design requested (${options.design_request_type})`,
    activity_type: "design_requested",
    description: `Design requested via Aurora (${options.design_request_type})`,
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
    .from("deals")
    .select("id, aurora_project_id, company_id, closer_id, contact_id")
    .eq("aurora_design_request_id", designRequestId)
    .single();

  if (!deal) {
    console.error(`No deal found for design_request_id: ${designRequestId}`);
    return;
  }

  // 2. Get design request to find the design_id
  const designRequest = await auroraClient.getDesignRequest(designRequestId);
  const designId = designRequest.design_request.design_id;

  if (!designId) {
    console.error(
      `Design request ${designRequestId} completed but no design_id`,
    );
    return;
  }

  // 3. Pull design summary from Aurora
  const designSummary = await auroraClient.getDesignSummary(designId);
  const design = designSummary.design;

  // 4. Pull design assets (panel layout, irradiance map, 3D) for downstream UI
  let designAssets: {
    panel_layout_url?: string;
    irradiance_map_url?: string;
    three_d_url?: string;
  } | null = null;
  try {
    const assetsResponse = await auroraClient.getDesignAssets(designId);
    if (assetsResponse.assets) {
      designAssets = {
        panel_layout_url: assetsResponse.assets.panel_layout_url,
        irradiance_map_url: assetsResponse.assets.irradiance_map_url,
        three_d_url: assetsResponse.assets.three_d_url,
      };
    }
  } catch (e) {
    console.warn("Could not fetch design assets:", e);
  }

  // 5. Build Sales Mode URL
  const salesModeUrl = `https://v2.aurorasolar.com/projects/${deal.aurora_project_id}/designs/${designId}/e-proposal/overview`;

  // 6. Update deal with design results
  await supabaseAdmin
    .from("deals")
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
      battery_count: design.storage?.count ?? 0,
      annual_production_kwh: design.annual_energy_production,
      offset_percentage: design.offset * 100, // Convert 1.05 → 105
      aurora_sales_mode_url: salesModeUrl,
      design_status: "design_completed",
      design_completed_at: new Date().toISOString(),
      stage: "design_complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  // 7. Create notification for closer
  if (deal.closer_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: deal.closer_id,
      type: "design_complete",
      title: "Design Complete",
      message: `${(design.system_size_watts / 1000).toFixed(2)} kW system ready for review`,
      deal_id: deal.id,
    });
  }

  // 8. Log activity (include asset URLs for downstream UI)
  await supabaseAdmin.from("activities").insert({
    deal_id: deal.id,
    title: "Design complete",
    activity_type: "design_complete",
    description: `Design complete: ${(design.system_size_watts / 1000).toFixed(2)} kW, ${design.module_count} panels, ${design.annual_energy_production.toLocaleString()} kWh/yr`,
    metadata: {
      design_id: designId,
      system_size_kw: design.system_size_watts / 1000,
      panel_count: design.module_count,
      annual_production: design.annual_energy_production,
      offset: design.offset,
      ...(designAssets && {
        panel_layout_url: designAssets.panel_layout_url,
        irradiance_map_url: designAssets.irradiance_map_url,
        three_d_url: designAssets.three_d_url,
      }),
    },
  });

  // 9. Log webhook event
  await supabaseAdmin.from("webhook_events").insert({
    source: "aurora",
    event_type: "design_request_completed",
    payload: { design_request_id: designRequestId, design_id: designId },
    status: "processed",
  });
}

/**
 * Handle Aurora design_request_rejected webhook.
 */
export async function handleDesignRejected(
  designRequestId: string,
  reason?: string,
) {
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("id, company_id, closer_id")
    .eq("aurora_design_request_id", designRequestId)
    .single();

  if (!deal) {
    console.error(
      `No deal found for rejected design_request_id: ${designRequestId}`,
    );
    return;
  }

  await supabaseAdmin
    .from("deals")
    .update({
      design_status: "design_rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal.id);

  // Notify closer
  if (deal.closer_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: deal.closer_id,
      type: "design_rejected",
      title: "Design Rejected",
      message:
        reason || "Design request was rejected. Please review and resubmit.",
      deal_id: deal.id,
    });
  }

  await supabaseAdmin.from("activities").insert({
    deal_id: deal.id,
    title: "Design rejected",
    activity_type: "design_rejected",
    description: `Design rejected${reason ? ": " + reason : ""}`,
    metadata: { design_request_id: designRequestId, reason },
  });

  await supabaseAdmin.from("webhook_events").insert({
    source: "aurora",
    event_type: "design_request_rejected",
    payload: { design_request_id: designRequestId, reason },
    status: "processed",
  });
}
