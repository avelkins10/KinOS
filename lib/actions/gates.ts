"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/database.types";

type GateDefinitionRow =
  Database["public"]["Tables"]["gate_definitions"]["Row"];
type GateCompletionRow =
  Database["public"]["Tables"]["gate_completions"]["Row"];

export interface GateWithStatus {
  id: string;
  name: string;
  description: string | null;
  gate_type: string;
  conditions: Record<string, unknown> | null;
  display_order: number | null;
  is_required: boolean | null;
  completion: GateCompletionRow | null;
  isComplete: boolean;
  value: string | null;
}

/**
 * Fetch ALL active gate_definitions for the company, merged with
 * any existing gate_completions for this deal.
 */
export async function getGateStatus(
  dealId: string,
): Promise<{ data: GateWithStatus[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: [], error: "Unauthorized" };

    // 1. All active gate definitions for this company
    const { data: gates, error: gatesError } = await supabase
      .from("gate_definitions")
      .select("*")
      .eq("company_id", user.companyId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (gatesError) return { data: [], error: gatesError.message };

    // 2. Existing completions for this deal
    const { data: completions, error: compError } = await supabase
      .from("gate_completions")
      .select("*")
      .eq("deal_id", dealId);

    if (compError) return { data: [], error: compError.message };

    // 3. Merge: for each gate, find its completion (if any)
    const result: GateWithStatus[] = (gates ?? []).map(
      (gate: GateDefinitionRow) => {
        const completion =
          (completions ?? []).find(
            (c: GateCompletionRow) => c.gate_definition_id === gate.id,
          ) ?? null;
        return {
          id: gate.id,
          name: gate.name,
          description: gate.description,
          gate_type: gate.gate_type,
          conditions: gate.conditions as Record<string, unknown> | null,
          display_order: gate.display_order,
          is_required: gate.is_required,
          completion,
          isComplete: completion?.is_complete ?? false,
          value:
            (completion as GateCompletionRow & { value?: string | null })
              ?.value ?? null,
        };
      },
    );

    return { data: result, error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch gate status",
    };
  }
}

/**
 * Auto-evaluate gates based on deal state.
 * Batched: 4 parallel queries up front, then evaluate each gate in-memory.
 * Only evaluates auto types: document_signed, file_uploaded, financing_status.
 */
export async function evaluateGates(
  dealId: string,
): Promise<{ data: GateWithStatus[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user?.userId)
      return { data: [], error: "Unauthorized" };

    // Get all gates first
    const { data: allGates, error: gatesError } = await getGateStatus(dealId);
    if (gatesError) return { data: [], error: gatesError };

    // Filter to auto-evaluable types
    const autoTypes = ["document_signed", "file_uploaded", "financing_status"];
    const autoGates = allGates.filter((g) => autoTypes.includes(g.gate_type));

    if (autoGates.length === 0) return { data: allGates, error: null };

    // Batch: 4 parallel queries (one per table needed for auto-evaluation)
    const [
      { data: templates },
      { data: envelopes },
      { data: attachments },
      { data: financingApps },
    ] = await Promise.all([
      supabase.from("document_templates").select("id, document_type"),
      supabase
        .from("document_envelopes")
        .select("template_id, status")
        .eq("deal_id", dealId),
      supabase
        .from("attachments")
        .select("id, category")
        .eq("deal_id", dealId)
        .is("deleted_at", null),
      supabase
        .from("financing_applications")
        .select("status")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    // Evaluate each auto gate against in-memory data
    for (const gate of autoGates) {
      const conditions = (gate.conditions ?? {}) as Record<string, unknown>;
      let passed = false;

      switch (gate.gate_type) {
        case "document_signed": {
          const templateKey = conditions.template_key as string;
          const matchingTemplateIds = (templates ?? [])
            .filter(
              (t: { id: string; document_type: string | null }) =>
                t.document_type === templateKey,
            )
            .map((t: { id: string }) => t.id);
          const matchingEnvelopes = (envelopes ?? []).filter(
            (e: { template_id: string | null }) =>
              e.template_id && matchingTemplateIds.includes(e.template_id),
          );
          passed =
            matchingEnvelopes.length > 0 &&
            matchingEnvelopes.every(
              (e: { status: string | null }) => e.status === "signed",
            );
          break;
        }
        case "file_uploaded": {
          const fileType = conditions.file_type as string;
          passed = (attachments ?? []).some(
            (a: { category: string | null }) => a.category === fileType,
          );
          break;
        }
        case "financing_status": {
          const requiredStatuses = conditions.required_status as string[];
          const currentStatus = (
            financingApps as { status: string | null }[] | null
          )?.[0]?.status;
          passed = currentStatus
            ? requiredStatuses.includes(currentStatus)
            : false;
          break;
        }
      }

      await upsertGateCompletion(
        supabase,
        dealId,
        gate.id,
        passed,
        user.userId,
      );
    }

    // Re-fetch merged status after updates
    return getGateStatus(dealId);
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to evaluate gates",
    };
  }
}

/**
 * Complete a manual gate (checkbox, question, external_status).
 * For question gates, pass the answer as `value`.
 */
export async function completeGate(
  dealId: string,
  gateId: string,
  value?: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) return { error: "Unauthorized" };

    const { data: existing } = await supabase
      .from("gate_completions")
      .select("id")
      .eq("deal_id", dealId)
      .eq("gate_definition_id", gateId)
      .maybeSingle();

    if (existing) {
      // value column added by migration 016
      const updateData: Record<string, unknown> = {
        is_complete: true,
        completed_at: new Date().toISOString(),
        completed_by: user.userId,
      };
      if (value !== undefined) updateData.value = value;
      const { error } = await supabase
        .from("gate_completions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updateData as any)
        .eq("id", existing.id);
      if (error) return { error: error.message };
    } else {
      const insertData: Record<string, unknown> = {
        deal_id: dealId,
        gate_definition_id: gateId,
        is_complete: true,
        completed_at: new Date().toISOString(),
        completed_by: user.userId,
      };
      if (value !== undefined) insertData.value = value;
      const { error } = await supabase
        .from("gate_completions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any);
      if (error) return { error: error.message };
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to complete gate",
    };
  }
}

/**
 * Uncomplete a manual gate (toggle off).
 */
export async function uncompleteGate(
  dealId: string,
  gateId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) return { error: "Unauthorized" };

    const { data: existing } = await supabase
      .from("gate_completions")
      .select("id")
      .eq("deal_id", dealId)
      .eq("gate_definition_id", gateId)
      .maybeSingle();

    if (existing) {
      // value column added by migration 016
      const { error } = await supabase
        .from("gate_completions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          is_complete: false,
          completed_at: null,
          completed_by: null,
          value: null,
        } as any)
        .eq("id", existing.id);
      if (error) return { error: error.message };
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to uncomplete gate",
    };
  }
}

// ── Internal helper ──────────────────────────────────────────────

async function upsertGateCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealId: string,
  gateId: string,
  isComplete: boolean,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("gate_completions")
    .select("id, is_complete")
    .eq("deal_id", dealId)
    .eq("gate_definition_id", gateId)
    .maybeSingle();

  if (existing) {
    if (existing.is_complete !== isComplete) {
      await supabase
        .from("gate_completions")
        .update({
          is_complete: isComplete,
          completed_at: isComplete ? new Date().toISOString() : null,
          completed_by: isComplete ? userId : null,
        })
        .eq("id", existing.id);
    }
  } else if (isComplete) {
    await supabase.from("gate_completions").insert({
      deal_id: dealId,
      gate_definition_id: gateId,
      is_complete: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    });
  }
}
