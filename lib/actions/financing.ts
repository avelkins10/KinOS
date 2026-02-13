"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { transitionDealStage } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/constants/pipeline";
import type { Database } from "@/lib/supabase/database.types";
import type {
  FinancingApplicationWithRelations,
  FinancingStatus,
  CreateFinancingInput,
  UpdateFinancingStatusInput,
} from "@/lib/types/financing";
import { isValidFinancingTransition } from "@/lib/constants/financing";

type FinancingAppRow =
  Database["public"]["Tables"]["financing_applications"]["Row"];

export async function getFinancingApplicationsByDeal(dealId: string): Promise<{
  data: FinancingApplicationWithRelations[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("id, company_id")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (!deal) return { data: null, error: "Deal not found or access denied" };

    const { data: apps, error } = await supabase
      .from("financing_applications")
      .select(
        `
        *,
        lender:lenders(id, name, slug, lender_type),
        lender_product:lender_products(id, name, term_months, interest_rate)
      `,
      )
      .eq("deal_id", dealId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    const result: FinancingApplicationWithRelations[] = (apps ?? []).map(
      (a) => ({
        ...a,
        lender: Array.isArray(a.lender) ? a.lender[0] : a.lender,
        lender_product: Array.isArray(a.lender_product)
          ? a.lender_product[0]
          : a.lender_product,
      }),
    );

    return { data: result, error: null };
  } catch (e) {
    return {
      data: null,
      error:
        e instanceof Error ? e.message : "Failed to get financing applications",
    };
  }
}

export async function createFinancingApplication(
  dealId: string,
  input: CreateFinancingInput,
): Promise<{ data: FinancingAppRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user?.userId) {
      return { data: null, error: "Unauthorized" };
    }

    // Verify deal exists and belongs to company
    const { data: deal } = await supabase
      .from("deals")
      .select("id, company_id, stage")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (!deal) return { data: null, error: "Deal not found or access denied" };

    // Verify the proposal exists and is finalized
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, status")
      .eq("id", input.proposalId)
      .eq("deal_id", dealId)
      .is("deleted_at", null)
      .single();
    if (!proposal) return { data: null, error: "Proposal not found" };
    if (proposal.status !== "finalized") {
      return { data: null, error: "Proposal must be finalized first" };
    }

    // Verify lender exists and belongs to company
    const { data: lender } = await supabase
      .from("lenders")
      .select("id, name")
      .eq("id", input.lenderId)
      .eq("company_id", user.companyId)
      .single();
    if (!lender) return { data: null, error: "Lender not found" };

    const now = new Date().toISOString();
    const { data: app, error: insertError } = await supabase
      .from("financing_applications")
      .insert({
        deal_id: dealId,
        lender_id: input.lenderId,
        lender_product_id: input.lenderProductId ?? null,
        proposal_id: input.proposalId,
        loan_amount: input.loanAmount,
        status: "submitted",
        submitted_at: now,
        submitted_by: user.userId,
        status_changed_at: now,
        updated_by: user.userId,
      })
      .select()
      .single();

    if (insertError) return { data: null, error: insertError.message };
    if (!app)
      return { data: null, error: "Failed to create financing application" };

    // Log initial status to history
    await supabase.from("financing_status_history").insert({
      financing_application_id: app.id,
      from_status: null,
      to_status: "submitted",
      changed_by: user.userId,
      notes: `Application submitted to ${lender.name}`,
    });

    // Log activity
    await supabase.from("activities").insert({
      deal_id: dealId,
      user_id: user.userId,
      activity_type: "financing_submitted",
      title: "Financing application submitted",
      description: `Application submitted to ${lender.name} for $${new Intl.NumberFormat("en-US").format(input.loanAmount)}`,
      metadata: { financing_application_id: app.id, lender_name: lender.name },
    });

    // Transition deal to financing_applied
    await transitionDealStage(dealId, "financing_applied" as DealStage);

    return { data: app as FinancingAppRow, error: null };
  } catch (e) {
    return {
      data: null,
      error:
        e instanceof Error
          ? e.message
          : "Failed to create financing application",
    };
  }
}

export async function updateFinancingStatus(
  applicationId: string,
  input: UpdateFinancingStatusInput,
): Promise<{ data: FinancingAppRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user?.userId) {
      return { data: null, error: "Unauthorized" };
    }

    // Fetch existing application with deal for company check
    const { data: app } = await supabase
      .from("financing_applications")
      .select("*, deal:deals(id, company_id, stage)")
      .eq("id", applicationId)
      .is("deleted_at", null)
      .single();

    if (!app) return { data: null, error: "Application not found" };
    const deal = Array.isArray(app.deal) ? app.deal[0] : app.deal;
    if (
      !deal ||
      (deal as { company_id: string }).company_id !== user.companyId
    ) {
      return { data: null, error: "Application not found or access denied" };
    }

    const fromStatus = app.status as FinancingStatus;

    // Validate status transition
    if (!isValidFinancingTransition(fromStatus, input.status)) {
      return {
        data: null,
        error: `Invalid transition from ${fromStatus} to ${input.status}`,
      };
    }

    const now = new Date().toISOString();

    // Only set conditions for conditionally_approved
    const conditions =
      input.status === "conditionally_approved" ? input.conditions : undefined;

    // Build update object
    const update: Database["public"]["Tables"]["financing_applications"]["Update"] =
      {
        status: input.status,
        status_changed_at: now,
        updated_by: user.userId,
      };

    // Set decision_at for terminal-ish statuses
    if (
      ["approved", "conditionally_approved", "denied", "funded"].includes(
        input.status,
      )
    ) {
      update.decision_at = now;
    }

    if (input.approvedAmount != null)
      update.approved_amount = input.approvedAmount;
    if (input.approvedRate != null) update.approved_rate = input.approvedRate;
    if (input.approvedTermMonths != null)
      update.approved_term_months = input.approvedTermMonths;
    if (input.denialReason) update.denial_reason = input.denialReason;
    if (conditions) update.conditions = conditions;

    const { data: updated, error: updateError } = await supabase
      .from("financing_applications")
      .update(update)
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) return { data: null, error: updateError.message };

    // Log to status history
    await supabase.from("financing_status_history").insert({
      financing_application_id: applicationId,
      from_status: fromStatus,
      to_status: input.status,
      changed_by: user.userId,
      notes: input.notes ?? null,
    });

    // Log activity
    await supabase.from("activities").insert({
      deal_id: app.deal_id,
      user_id: user.userId,
      activity_type: "financing_status_changed",
      title: `Financing status: ${input.status.replace(/_/g, " ")}`,
      description: input.notes
        ? `Status changed from ${fromStatus} to ${input.status}: ${input.notes}`
        : `Status changed from ${fromStatus} to ${input.status}`,
      metadata: {
        financing_application_id: applicationId,
        from_status: fromStatus,
        to_status: input.status,
      },
    });

    // Auto-transition deal stage based on financing status
    const dealStage = (deal as { stage: string }).stage as DealStage;
    if (input.status === "approved") {
      if (dealStage === "financing_applied" || dealStage === "stips_pending") {
        await transitionDealStage(
          app.deal_id,
          "financing_approved" as DealStage,
        );
      }
    } else if (input.status === "conditionally_approved") {
      // Conditional approval means stips/conditions are pending
      if (dealStage === "financing_applied") {
        await transitionDealStage(app.deal_id, "stips_pending" as DealStage);
      }
    } else if (input.status === "stips_cleared") {
      if (dealStage === "financing_approved" || dealStage === "stips_pending") {
        await transitionDealStage(app.deal_id, "stips_cleared" as DealStage);
      }
    } else if (input.status === "stips_pending") {
      if (
        dealStage === "financing_applied" ||
        dealStage === "financing_approved"
      ) {
        await transitionDealStage(app.deal_id, "stips_pending" as DealStage);
      }
    }
    // denied → no auto-transition (closer decides next step)

    return { data: updated as FinancingAppRow, error: null };
  } catch (e) {
    return {
      data: null,
      error:
        e instanceof Error ? e.message : "Failed to update financing status",
    };
  }
}

export async function deleteFinancingApplication(
  applicationId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user?.userId) {
      return { error: "Unauthorized" };
    }

    const { data: app } = await supabase
      .from("financing_applications")
      .select("id, deal_id, deal:deals(company_id)")
      .eq("id", applicationId)
      .is("deleted_at", null)
      .single();

    if (!app) return { error: "Application not found" };
    const deal = Array.isArray(app.deal) ? app.deal[0] : app.deal;
    if (
      !deal ||
      (deal as { company_id: string }).company_id !== user.companyId
    ) {
      return { error: "Application not found or access denied" };
    }

    const { error } = await supabase
      .from("financing_applications")
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.userId,
      })
      .eq("id", applicationId);

    if (error) return { error: error.message };

    await supabase.from("activities").insert({
      deal_id: app.deal_id,
      user_id: user.userId,
      activity_type: "financing_deleted",
      title: "Financing application deleted",
      description: "Financing application soft-deleted",
      metadata: { financing_application_id: applicationId },
    });

    return { error: null };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Failed to delete financing application",
    };
  }
}
