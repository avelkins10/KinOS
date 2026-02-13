"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { getDeal, transitionDealStage } from "@/lib/actions/deals";
import {
  emitNotification,
  emitNotificationToRole,
} from "@/lib/actions/notifications";
import { submissionProvider } from "@/lib/integrations/submission/manual-provider";
import type { SubmissionPayload } from "@/lib/integrations/submission/types";

/**
 * Assemble the full submission payload from a deal's current state.
 * Pulls from deal, contact, proposals, financing, envelopes, attachments, gate answers.
 */
export async function assembleSubmissionPayload(
  dealId: string,
): Promise<{ data: SubmissionPayload | null; error: string | null }> {
  try {
    const { data: detail, error: dealError } = await getDeal(dealId);
    if (dealError || !detail) {
      return { data: null, error: dealError ?? "Deal not found" };
    }

    const user = await getCurrentUser();
    if (!user?.userId) return { data: null, error: "Unauthorized" };

    const contact = detail.contact;
    const activeProposal = detail.proposals?.[0]; // most recent
    const financingApp = detail.financingApplications?.[0];

    // Get gate answers (question-type completions with values)
    const supabase = await createClient();
    const { data: gateCompletions } = await supabase
      .from("gate_completions")
      .select("*, gate_definition:gate_definitions(gate_type, name)")
      .eq("deal_id", dealId)
      .eq("is_complete", true);

    const gateAnswers: Record<string, string> = {};
    for (const gc of gateCompletions ?? []) {
      const def = gc.gate_definition as {
        gate_type: string;
        name: string;
      } | null;
      const val = (gc as { value?: string | null }).value;
      if (def?.gate_type === "question" && val) {
        gateAnswers[def.name] = val;
      }
    }

    // Get adders from active proposal
    let adders: Array<{ name: string; amount: number }> = [];
    if (activeProposal) {
      const { data: proposalAdders } = await supabase
        .from("proposal_adders")
        .select("name, total")
        .eq("proposal_id", activeProposal.id);
      adders = (proposalAdders ?? []).map((a) => ({
        name: a.name ?? "",
        amount: Number(a.total) || 0,
      }));
    }

    // Get attachments
    const attachmentRows = detail.attachments ?? [];
    const attachmentUrls = attachmentRows.map((a) => ({
      name: a.file_name ?? "",
      category: a.category ?? "",
      url: a.file_url ?? "",
    }));

    const payload: SubmissionPayload = {
      dealId: detail.id,
      dealNumber: detail.deal_number ?? "",
      submissionAttempt: 1, // overridden in submitDeal
      submittedAt: new Date().toISOString(),
      submittedBy: user.userId,

      customer: {
        firstName: contact?.first_name ?? "",
        lastName: contact?.last_name ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        address: contact?.address ?? detail.install_address ?? "",
        city: contact?.city ?? detail.install_city ?? "",
        state: contact?.state ?? detail.install_state ?? "",
        zip: contact?.zip ?? "",
      },

      system: {
        sizeKw: Number(detail.system_size_kw) || 0,
        panelCount: Number(detail.panel_count) || 0,
        panelModel: detail.panel_model ?? "",
        inverterModel: detail.inverter_model ?? "",
        batteryModel: detail.battery_model ?? undefined,
        batteryCount: detail.battery_count
          ? Number(detail.battery_count)
          : undefined,
        annualProductionKwh: Number(detail.annual_production_kwh) || 0,
        offsetPercentage: Number(detail.offset_percentage) || 0,
      },

      pricing: {
        grossPrice: Number(detail.gross_price) || 0,
        netPrice: Number(detail.net_price) || 0,
        grossPpw: Number(detail.gross_ppw) || 0,
        monthlyPayment: detail.monthly_payment
          ? Number(detail.monthly_payment)
          : undefined,
        downPayment: activeProposal?.down_payment
          ? Number(activeProposal.down_payment)
          : undefined,
        federalTaxCredit: activeProposal?.federal_rebate_amount
          ? Number(activeProposal.federal_rebate_amount)
          : undefined,
        dealerFee: activeProposal?.dealer_fee_amount
          ? Number(activeProposal.dealer_fee_amount)
          : undefined,
        adders,
      },

      financing: {
        lenderName: financingApp?.lender?.name ?? "",
        productName: financingApp?.lender_product?.name ?? "",
        termMonths: financingApp?.lender_product?.term_months ?? 0,
        interestRate: Number(financingApp?.lender_product?.interest_rate) || 0,
        approvalNumber: financingApp?.external_application_id ?? undefined,
        approvalStatus: financingApp?.status ?? "",
      },

      contracts: {
        allSigned:
          (detail.documentEnvelopes ?? []).length > 0 &&
          detail.documentEnvelopes.every((e) => e.status === "signed"),
        signedDate:
          detail.documentEnvelopes?.find((e) => e.status === "signed")
            ?.signed_at ?? undefined,
        envelopes: (detail.documentEnvelopes ?? []).map((e) => ({
          title: e.title ?? "",
          status: e.status ?? "",
          signedAt: e.signed_at ?? undefined,
        })),
      },

      closer: {
        name: detail.closer
          ? `${detail.closer.first_name} ${detail.closer.last_name}`.trim()
          : "",
        email: detail.closer?.email ?? "",
      },
      setter: detail.setter
        ? {
            name: `${detail.setter.first_name} ${detail.setter.last_name}`.trim(),
            email: detail.setter.email,
          }
        : undefined,
      office: (detail.office as { name: string } | null)?.name ?? "",

      gateAnswers,
      attachmentUrls,
    };

    return { data: payload, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to assemble payload",
    };
  }
}

/**
 * Submit a deal: freeze snapshot, push through submission adapter, transition stage, notify.
 */
export async function submitDeal(dealId: string): Promise<{
  data: { snapshotId: string; submissionAttempt: number } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    // 1. Assemble payload
    const { data: payload, error: payloadError } =
      await assembleSubmissionPayload(dealId);
    if (payloadError || !payload) {
      return {
        data: null,
        error: payloadError ?? "Failed to assemble payload",
      };
    }

    // 2. Count existing submission snapshots to determine attempt number
    const { count } = await supabase
      .from("deal_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", dealId)
      .eq("snapshot_type", "submission");
    const submissionAttempt = (count ?? 0) + 1;
    payload.submissionAttempt = submissionAttempt;

    // 3. Insert deal_snapshots row (frozen JSONB payload)
    // submission_attempt added by migration 016
    const { data: snapshot, error: snapError } = await supabase
      .from("deal_snapshots")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        deal_id: dealId,
        snapshot_type: "submission",
        snapshot_data: JSON.parse(JSON.stringify(payload)),
        submission_attempt: submissionAttempt,
        created_by: user.userId,
      } as any)
      .select("id")
      .single();

    if (snapError || !snapshot) {
      return {
        data: null,
        error: snapError?.message ?? "Failed to create snapshot",
      };
    }

    // 4. Push through submission adapter
    const { externalId, error: submitError } =
      await submissionProvider.submit(payload);
    if (submitError) {
      return { data: null, error: submitError };
    }

    // 5. Update deal: quickbase_record_id if returned (column added by migration 016)
    if (externalId) {
      await supabase
        .from("deals")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ quickbase_record_id: externalId } as any)
        .eq("id", dealId);
    }

    // 6. Transition deal stage: submission_ready → submitted
    const { error: transitionError } = await transitionDealStage(
      dealId,
      "submitted",
    );
    if (transitionError) {
      return { data: null, error: transitionError };
    }

    // 7. Emit notifications
    const { data: deal } = await getDeal(dealId);
    const dealUrl = `/deals/${dealId}`;

    // Notify the closer (confirmation)
    if (deal?.closer_id) {
      await emitNotification({
        userId: deal.closer_id,
        dealId,
        type: "deal_submitted",
        title: "Deal Submitted",
        message: `${deal.deal_number ?? "Deal"} has been submitted (attempt #${submissionAttempt}).`,
        actionUrl: dealUrl,
      });
    }

    // Notify managers
    await emitNotificationToRole({
      companyId: user.companyId,
      role: "admin",
      dealId,
      type: "deal_submitted",
      title: "New Deal Submitted",
      message:
        `${deal?.deal_number ?? "Deal"} submitted by ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      actionUrl: dealUrl,
    });

    return {
      data: { snapshotId: snapshot.id, submissionAttempt },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to submit deal",
    };
  }
}

/**
 * Reject a deal submission with structured reasons.
 */
export async function rejectDeal(
  dealId: string,
  reasons: Array<{ code: string; field?: string; note?: string }>,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { error: "Unauthorized" };
    }

    // 1. Update deal: rejection_reasons (JSONB, column added by migration 016)
    const { error: updateError } = await supabase
      .from("deals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ rejection_reasons: reasons } as any)
      .eq("id", dealId);

    if (updateError) return { error: updateError.message };

    // 2. Transition deal stage to intake_rejected
    const { error: transitionError } = await transitionDealStage(
      dealId,
      "intake_rejected",
    );
    if (transitionError) return { error: transitionError };

    // 3. Notify closer
    const { data: deal } = await getDeal(dealId);
    if (deal?.closer_id) {
      await emitNotification({
        userId: deal.closer_id,
        dealId,
        type: "deal_rejected",
        title: "Deal Rejected",
        message: `${deal.deal_number ?? "Deal"} was rejected. ${reasons.length} issue(s) to resolve.`,
        actionUrl: `/deals/${dealId}`,
      });
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to reject deal",
    };
  }
}

/**
 * Get submission history (all snapshots) for a deal.
 */
export async function getSubmissionHistory(dealId: string): Promise<{
  data: Array<{
    id: string;
    submissionAttempt: number;
    createdAt: string;
    createdBy: string | null;
  }>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: [], error: "Unauthorized" };

    // submission_attempt column added by migration 016; use raw select
    const { data, error } = await supabase
      .from("deal_snapshots")
      .select("id, created_at, created_by")
      .eq("deal_id", dealId)
      .eq("snapshot_type", "submission")
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    return {
      data: (data ?? []).map(
        (
          s: {
            id: string;
            created_at: string | null;
            created_by: string | null;
          },
          i: number,
        ) => ({
          id: s.id,
          submissionAttempt: (data?.length ?? 0) - i,
          createdAt: s.created_at ?? "",
          createdBy: s.created_by,
        }),
      ),
      error: null,
    };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch history",
    };
  }
}
