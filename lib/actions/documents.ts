"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { transitionDealStage, getDeal } from "@/lib/actions/deals";
import { emitNotification } from "@/lib/actions/notifications";
import { assembleMergeFields } from "@/lib/utils/merge-fields";
import type { Database } from "@/lib/supabase/database.types";
import type { NotificationType } from "@/lib/types/notifications";

type DocumentTemplateRow =
  Database["public"]["Tables"]["document_templates"]["Row"];
type DocumentEnvelopeRow =
  Database["public"]["Tables"]["document_envelopes"]["Row"];

export async function getDocumentTemplates(): Promise<{
  data: DocumentTemplateRow[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("company_id", user.companyId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as DocumentTemplateRow[], error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch templates",
    };
  }
}

export async function getEnvelopesByDeal(dealId: string): Promise<{
  data: DocumentEnvelopeRow[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("document_envelopes")
      .select("*")
      .eq("deal_id", dealId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as DocumentEnvelopeRow[], error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch envelopes",
    };
  }
}

export async function createEnvelope(params: {
  dealId: string;
  templateId: string;
  title: string;
}): Promise<{ data: DocumentEnvelopeRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    // Fetch deal detail for merge fields
    const { data: dealDetail } = await getDeal(params.dealId);
    const mergeData = dealDetail ? assembleMergeFields(dealDetail) : {};

    const { data, error } = await supabase
      .from("document_envelopes")
      .insert({
        deal_id: params.dealId,
        template_id: params.templateId,
        provider: "manual",
        title: params.title,
        status: "created",
        merge_data: mergeData,
        updated_by: user.userId,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DocumentEnvelopeRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create envelope",
    };
  }
}

export async function updateEnvelopeStatus(
  envelopeId: string,
  newStatus: string,
): Promise<{ data: DocumentEnvelopeRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: newStatus,
      status_changed_at: now,
      updated_by: user.userId,
    };

    if (newStatus === "sent") updates.sent_at = now;
    if (newStatus === "viewed") updates.viewed_at = now;
    if (newStatus === "signed") updates.signed_at = now;

    const { data, error } = await supabase
      .from("document_envelopes")
      .update(updates)
      .eq("id", envelopeId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const envelope = data as DocumentEnvelopeRow;

    // Check if all envelopes for this deal are signed → auto-advance
    if (newStatus === "signed") {
      await checkAllSignedAndAdvance(envelope.deal_id, user.userId);
    }

    // Emit notifications for status changes
    await emitStatusNotifications(
      envelope,
      newStatus,
      user.userId,
      user.companyId,
    );

    return { data: envelope, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to update envelope status",
    };
  }
}

/**
 * Send contract packet: create envelopes for all active templates,
 * set status to 'sent', advance deal to contract_sent.
 */
export async function sendContractPacket(
  dealId: string,
  templateIds?: string[],
): Promise<{
  data: DocumentEnvelopeRow[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    // Get templates
    let templatesQuery = supabase
      .from("document_templates")
      .select("*")
      .eq("company_id", user.companyId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (templateIds && templateIds.length > 0) {
      templatesQuery = templatesQuery.in("id", templateIds);
    }

    const { data: templates, error: templatesError } = await templatesQuery;
    if (templatesError || !templates?.length) {
      return {
        data: [],
        error: templatesError?.message ?? "No active templates found",
      };
    }

    // Get deal detail for merge fields
    const { data: dealDetail } = await getDeal(dealId);
    const mergeData = dealDetail ? assembleMergeFields(dealDetail) : {};

    const now = new Date().toISOString();
    const rows = templates.map((t) => ({
      deal_id: dealId,
      template_id: t.id,
      provider: "manual",
      title: t.name,
      status: "sent",
      sent_at: now,
      status_changed_at: now,
      merge_data: mergeData,
      updated_by: user.userId,
    }));

    const { data: envelopes, error: insertError } = await supabase
      .from("document_envelopes")
      .insert(rows)
      .select();

    if (insertError) {
      return { data: [], error: insertError.message };
    }

    // Advance deal to contract_sent
    await transitionDealStage(dealId, "contract_sent");

    // Emit notification for contract packet sent
    if (dealDetail?.closer?.id) {
      await emitNotification({
        userId: dealDetail.closer.id,
        dealId,
        type: "contract_sent",
        title: "Contract packet sent",
        message: `${templates.length} documents sent for ${dealDetail.deal_number}`,
        actionUrl: `/deals/${dealId}`,
      });
    }

    return {
      data: (envelopes ?? []) as DocumentEnvelopeRow[],
      error: null,
    };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to send contract packet",
    };
  }
}

export async function deleteEnvelope(
  envelopeId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("document_envelopes")
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.userId,
      })
      .eq("id", envelopeId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete envelope",
    };
  }
}

// --- Internal helpers ---

async function checkAllSignedAndAdvance(
  dealId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: envelopes } = await supabase
    .from("document_envelopes")
    .select("id, status")
    .eq("deal_id", dealId)
    .is("deleted_at", null);

  if (!envelopes || envelopes.length === 0) return;

  const allSigned = envelopes.every((e) => e.status === "signed");
  if (allSigned) {
    await transitionDealStage(dealId, "contract_signed");

    // Notify about all contracts signed
    const { data: dealDetail } = await getDeal(dealId);
    const customerName = dealDetail?.contact
      ? [dealDetail.contact.first_name, dealDetail.contact.last_name]
          .filter(Boolean)
          .join(" ")
      : "Customer";

    const notifyUserIds = new Set<string>();
    if (dealDetail?.closer?.id) notifyUserIds.add(dealDetail.closer.id);
    if (dealDetail?.setter?.id) notifyUserIds.add(dealDetail.setter.id);

    for (const uid of notifyUserIds) {
      await emitNotification({
        userId: uid,
        dealId,
        type: "contract_all_signed",
        title: "All contracts signed!",
        message: `${customerName} has signed all documents for ${dealDetail?.deal_number}`,
        actionUrl: `/deals/${dealId}`,
      });
    }
  }
}

async function emitStatusNotifications(
  envelope: DocumentEnvelopeRow,
  newStatus: string,
  currentUserId: string,
  _companyId: string,
): Promise<void> {
  const typeMap: Record<string, NotificationType> = {
    sent: "contract_sent",
    viewed: "contract_viewed",
    signed: "contract_signed",
  };

  const notificationType = typeMap[newStatus];
  if (!notificationType) return;

  // Get deal to find closer/setter for notifications
  const { data: dealDetail } = await getDeal(envelope.deal_id);
  if (!dealDetail) return;

  const closerId = dealDetail.closer?.id;

  // Notify closer if they didn't trigger the action themselves
  if (closerId && closerId !== currentUserId) {
    await emitNotification({
      userId: closerId,
      dealId: envelope.deal_id,
      type: notificationType,
      title: `Contract ${newStatus}`,
      message: `"${envelope.title}" was ${newStatus} for ${dealDetail.deal_number}`,
      actionUrl: `/deals/${envelope.deal_id}`,
    });
  }
}
