"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { auroraClient } from "@/lib/integrations/aurora/client";

export interface SyncPayload {
  base_ppw: number;
  adders: Array<{ name: string; amount?: number; price_per_watt?: number }>;
}

/**
 * Sync KinOS proposal pricing to Aurora design.
 * Only runs if deal has aurora_design_id.
 * Steps: get deal + active proposal → delete previously-synced adders → push base PPW → push adders → log sync.
 */
export async function syncPricingToAurora(
  dealId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, aurora_project_id, aurora_design_id, active_proposal_id")
      .eq("id", dealId)
      .single();
    if (dealError || !deal) {
      return { error: dealError?.message ?? "Deal not found" };
    }
    const designId = (deal as { aurora_design_id?: string }).aurora_design_id;
    if (!designId) {
      return { error: "Deal has no Aurora design linked" };
    }
    const projectId = (deal as { aurora_project_id?: string })
      .aurora_project_id;
    const activeProposalId = (deal as { active_proposal_id?: string })
      .active_proposal_id;
    if (!activeProposalId) {
      return { error: "Deal has no active proposal" };
    }

    const { data: proposal, error: propError } = await supabase
      .from("proposals")
      .select("id, base_ppw")
      .eq("id", activeProposalId)
      .single();
    if (propError || !proposal) {
      return { error: propError?.message ?? "Active proposal not found" };
    }

    const { data: adders } = await supabase
      .from("proposal_adders")
      .select("id, name, amount, total, ppw, pricing_type, aurora_adder_id")
      .eq("proposal_id", activeProposalId);

    const { data: lastSync } = await supabaseAdmin
      .from("aurora_pricing_syncs")
      .select("request_data")
      .eq("deal_id", dealId)
      .eq("sync_type", "full_sync")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastPayload = lastSync?.request_data as
      | { aurora_adder_ids?: string[] }
      | null
      | undefined;
    const auroraAdderIds = lastPayload?.aurora_adder_ids ?? [];
    for (const adderId of auroraAdderIds) {
      try {
        await auroraClient.deleteDesignAdder(designId, adderId);
      } catch (err) {
        console.warn(`Failed to delete Aurora adder ${adderId}:`, err);
      }
    }

    const basePpw = proposal.base_ppw ?? 0;
    await auroraClient.putDesignPricing(designId, {
      price_per_watt: basePpw,
    });

    const newAdderIds: string[] = [];
    for (const a of adders ?? []) {
      const payload: {
        name: string;
        amount?: number;
        price_per_watt?: number;
      } = {
        name: a.name,
      };
      if (a.pricing_type === "price_per_watt" && a.ppw != null) {
        payload.price_per_watt = a.ppw;
      } else if (a.total != null) {
        payload.amount = a.total;
      }
      const res = await auroraClient.postDesignAdder(designId, payload);
      const adder = (res as { adder?: { id?: string } })?.adder;
      if (adder?.id) newAdderIds.push(adder.id);
    }

    const syncPayload: SyncPayload & { aurora_adder_ids?: string[] } = {
      base_ppw: basePpw,
      adders: (adders ?? []).map((a) => ({
        name: a.name,
        amount: a.total ?? undefined,
        price_per_watt: a.ppw ?? undefined,
      })),
      aurora_adder_ids: newAdderIds,
    };

    await logAuroraPricingSync(
      dealId,
      projectId ?? "",
      syncPayload,
      "success",
      newAdderIds,
    );
    return { error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Aurora pricing sync failed";
    await logAuroraPricingSync(
      dealId,
      (
        await supabaseAdmin
          .from("deals")
          .select("aurora_project_id")
          .eq("id", dealId)
          .single()
      ).data?.aurora_project_id ?? "",
      { base_ppw: 0, adders: [] },
      "error",
      [],
      message,
    ).catch(() => {});
    return { error: message };
  }
}

export async function logAuroraPricingSync(
  dealId: string,
  auroraProjectId: string,
  payloadSent: SyncPayload & { aurora_adder_ids?: string[] },
  status: string,
  auroraAdderIds: string[],
  errorMessage?: string,
): Promise<void> {
  await supabaseAdmin.from("aurora_pricing_syncs").insert({
    deal_id: dealId,
    aurora_project_id: auroraProjectId,
    sync_type: "full_sync",
    request_data:
      payloadSent as unknown as import("@/lib/supabase/database.types").Json,
    response_data: auroraAdderIds.length
      ? ({
          aurora_adder_ids: auroraAdderIds,
        } as unknown as import("@/lib/supabase/database.types").Json)
      : null,
    status,
    error_message: errorMessage ?? null,
  });
}
