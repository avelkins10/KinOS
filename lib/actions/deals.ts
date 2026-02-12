"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { isValidTransition } from "@/lib/utils/stage-validation";
import type { DealStage } from "@/lib/constants/pipeline";
import type { Database } from "@/lib/supabase/database.types";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type StageHistoryRow =
  Database["public"]["Tables"]["deal_stage_history"]["Row"];
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];
type AssignmentHistoryRow =
  Database["public"]["Tables"]["deal_assignment_history"]["Row"];
type FinancingAppRow =
  Database["public"]["Tables"]["financing_applications"]["Row"];
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type DocumentEnvelopeRow =
  Database["public"]["Tables"]["document_envelopes"]["Row"];
type GateCompletionRow =
  Database["public"]["Tables"]["gate_completions"]["Row"];
type GateDefinitionRow =
  Database["public"]["Tables"]["gate_definitions"]["Row"];

export interface DealFilters {
  officeId?: string;
  closerId?: string;
  dateRange?: { from?: string; to?: string };
  search?: string;
  stages?: DealStage[];
}

export interface DealWithRelations extends DealRow {
  contact?: ContactRow | null;
  closer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  setter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  office?: { id: string; name: string } | null;
}

/** Rich deal detail with all relations for the detail page */
export interface DealDetail extends DealWithRelations {
  stageHistory: StageHistoryRow[];
  notes: NoteRow[];
  attachments: AttachmentRow[];
  assignmentHistory: AssignmentHistoryRow[];
  financingApplications: FinancingAppRow[];
  proposals: ProposalRow[];
  documentEnvelopes: DocumentEnvelopeRow[];
  gateCompletions: (GateCompletionRow & {
    gate_definition?: GateDefinitionRow | null;
  })[];
}

export interface DealsByStageResult {
  byStage: Record<string, DealWithRelations[]>;
  counts: Record<string, number>;
  totalValue: number;
}

export async function getDealsByStage(
  filters: DealFilters = {},
): Promise<{ data: DealsByStageResult | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    let query = supabase
      .from("deals")
      .select(
        `
        *,
        contact:contacts(*),
        closer:users!deals_closer_id_fkey(id, first_name, last_name, email),
        setter:users!deals_setter_id_fkey(id, first_name, last_name, email),
        office:offices(id, name)
      `,
      )
      .eq("company_id", user.companyId)
      .is("deleted_at", null);

    // Role-based visibility: closer sees own, manager sees office, admin sees all
    if (user.role === "closer" && user.userId) {
      query = query.eq("closer_id", user.userId);
    } else if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      query = query.eq("office_id", user.officeId);
    }

    if (filters.officeId) query = query.eq("office_id", filters.officeId);
    if (filters.closerId) query = query.eq("closer_id", filters.closerId);
    if (filters.stages?.length) query = query.in("stage", filters.stages);
    if (filters.dateRange?.from) {
      query = query.gte("created_at", filters.dateRange.from);
    }
    if (filters.dateRange?.to) {
      query = query.lte("created_at", filters.dateRange.to + "T23:59:59.999Z");
    }
    if (filters.search?.trim()) {
      // Search via contact join - we'll filter in memory or use a second query
      // For now fetch and filter by contact name/email/phone in app if needed; or use RPC
      // Simple approach: get contact ids matching search then filter deals
      const searchTerm = `%${filters.search.trim()}%`;
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id")
        .eq("company_id", user.companyId)
        .is("deleted_at", null)
        .or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`,
        );
      const contactIds = (contacts ?? []).map((c) => c.id);
      if (contactIds.length === 0 && filters.search.trim()) {
        return {
          data: { byStage: {}, counts: {}, totalValue: 0 },
          error: null,
        };
      }
      if (contactIds.length > 0) query = query.in("contact_id", contactIds);
    }

    const { data: deals, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    const list = (deals ?? []) as DealWithRelations[];
    const byStage: Record<string, DealWithRelations[]> = {};
    const counts: Record<string, number> = {};
    let totalValue = 0;

    for (const d of list) {
      const stage = d.stage ?? "new_lead";
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(d);
      counts[stage] = (counts[stage] ?? 0) + 1;
      totalValue += Number(d.gross_price) || 0;
    }

    return {
      data: { byStage, counts, totalValue },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to fetch deals",
    };
  }
}

export async function getDeal(
  dealId: string,
): Promise<{ data: DealDetail | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(
        `
        *,
        contact:contacts(*),
        closer:users!deals_closer_id_fkey(id, first_name, last_name, email),
        setter:users!deals_setter_id_fkey(id, first_name, last_name, email),
        office:offices(id, name)
      `,
      )
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (dealError || !deal) {
      return {
        data: null,
        error: dealError?.message ?? "Deal not found",
      };
    }

    const [
      { data: stageHistory },
      { data: notes },
      { data: attachments },
      { data: assignmentHistory },
      { data: financingApplications },
      { data: proposals },
      { data: documentEnvelopes },
      { data: gateCompletions },
    ] = await Promise.all([
      supabase
        .from("deal_stage_history")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false }),
      supabase
        .from("notes")
        .select("*")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("attachments")
        .select("*")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("deal_assignment_history")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false }),
      supabase
        .from("financing_applications")
        .select("*")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("proposals")
        .select("*")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("document_envelopes")
        .select("*")
        .eq("deal_id", dealId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("gate_completions")
        .select("*, gate_definition:gate_definitions(*)")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true }),
    ]);

    const detail: DealDetail = {
      ...(deal as DealWithRelations),
      stageHistory: (stageHistory ?? []) as StageHistoryRow[],
      notes: (notes ?? []) as NoteRow[],
      attachments: (attachments ?? []) as AttachmentRow[],
      assignmentHistory: (assignmentHistory ?? []) as AssignmentHistoryRow[],
      financingApplications: (financingApplications ?? []) as FinancingAppRow[],
      proposals: (proposals ?? []) as ProposalRow[],
      documentEnvelopes: (documentEnvelopes ?? []) as DocumentEnvelopeRow[],
      gateCompletions: (gateCompletions ?? []) as (GateCompletionRow & {
        gate_definition?: GateDefinitionRow | null;
      })[],
    };

    return { data: detail, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to fetch deal",
    };
  }
}

/** Force refresh deal from database (e.g. after Aurora actions). Same as getDeal. */
export async function refreshDealData(
  dealId: string,
): Promise<{ data: DealDetail | null; error: string | null }> {
  return getDeal(dealId);
}

export interface CreateDealInput {
  contactId: string;
  closerId?: string;
  setterId?: string;
  officeId?: string;
  source?: string;
  stage?: DealStage;
}

export async function createDeal(
  input: CreateDealInput,
): Promise<{ data: DealRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", input.contactId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (!contact) {
      return { data: null, error: "Contact not found or access denied" };
    }

    const stage = input.stage ?? "new_lead";
    const insert: Database["public"]["Tables"]["deals"]["Insert"] = {
      company_id: user.companyId,
      contact_id: input.contactId,
      deal_number: "", // trigger generates KIN-YEAR-SEQ
      closer_id: input.closerId ?? user.userId ?? null,
      setter_id: input.setterId ?? null,
      office_id: input.officeId ?? user.officeId ?? null,
      source: input.source ?? "Manual",
      stage,
      updated_by: user.userId ?? undefined,
    };

    const { data: deal, error } = await supabase
      .from("deals")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: deal as DealRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create deal",
    };
  }
}

export interface UpdateDealInput {
  closerId?: string;
  setterId?: string;
  projectManagerId?: string;
  officeId?: string;
  installAddress?: string;
  notes?: string;
}

export async function updateDeal(
  dealId: string,
  input: UpdateDealInput,
): Promise<{ data: DealRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("deals")
      .select("id, closer_id, office_id")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { data: null, error: "Deal not found or access denied" };
    }

    if (user.role === "closer" && existing.closer_id !== user.userId) {
      return { data: null, error: "You can only edit your own deals" };
    }
    if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId &&
      existing.office_id !== user.officeId
    ) {
      return { data: null, error: "You can only edit deals in your office" };
    }

    const update: Database["public"]["Tables"]["deals"]["Update"] = {
      ...(input.closerId !== undefined && { closer_id: input.closerId }),
      ...(input.setterId !== undefined && { setter_id: input.setterId }),
      ...(input.officeId !== undefined && { office_id: input.officeId }),
      ...(input.installAddress !== undefined && {
        install_address: input.installAddress,
      }),
      updated_by: user.userId ?? undefined,
    };

    const { data: deal, error } = await supabase
      .from("deals")
      .update(update)
      .eq("id", dealId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: deal as DealRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to update deal",
    };
  }
}

export async function transitionDealStage(
  dealId: string,
  toStage: DealStage,
  reason?: string,
): Promise<{ data: DealRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("deals")
      .select("id, stage")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: fetchError?.message ?? "Deal not found" };
    }

    const currentStage = (existing.stage ?? "new_lead") as DealStage;
    if (!isValidTransition(currentStage, toStage)) {
      return {
        data: null,
        error: `Invalid transition from ${currentStage} to ${toStage}`,
      };
    }

    const { data: deal, error } = await supabase
      .from("deals")
      .update({
        stage: toStage,
        stage_changed_at: new Date().toISOString(),
        updated_by: user.userId ?? undefined,
      })
      .eq("id", dealId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: deal as DealRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to transition stage",
    };
  }
}

export async function searchDeals(
  query: string,
  filters: DealFilters = {},
): Promise<{ data: DealWithRelations[]; error: string | null }> {
  try {
    const { data, error } = await getDealsByStage({
      ...filters,
      search: query,
    });
    if (error) return { data: [], error };
    if (!data) return { data: [], error: null };
    const list = Object.values(data.byStage).flat();
    return { data: list, error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Search failed",
    };
  }
}

export async function getOffices(): Promise<{
  data: { id: string; name: string }[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: [], error: "Unauthorized" };
    const { data, error } = await supabase
      .from("offices")
      .select("id, name")
      .eq("company_id", user.companyId)
      .order("name");
    if (error) return { data: [], error: error.message };
    return {
      data: (data ?? []) as { id: string; name: string }[],
      error: null,
    };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch offices",
    };
  }
}

export async function getClosers(officeId?: string): Promise<{
  data: { id: string; name: string }[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: [], error: "Unauthorized" };
    let query = supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("company_id", user.companyId);
    if (officeId) query = query.eq("office_id", officeId);
    const { data: users, error } = await query.order("first_name");
    if (error) return { data: [], error: error.message };
    const list = (users ?? []).map(
      (u: { id: string; first_name: string; last_name: string }) => ({
        id: u.id,
        name: [u.first_name, u.last_name].filter(Boolean).join(" "),
      }),
    );
    return { data: list, error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch closers",
    };
  }
}

export interface AssignDealInput {
  closerId?: string;
  setterId?: string;
  projectManagerId?: string;
}

export async function assignDeal(
  dealId: string,
  assignments: AssignDealInput,
): Promise<{ data: DealRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const update: Database["public"]["Tables"]["deals"]["Update"] = {
      ...(assignments.closerId !== undefined && {
        closer_id: assignments.closerId,
      }),
      ...(assignments.setterId !== undefined && {
        setter_id: assignments.setterId,
      }),
      updated_by: user.userId ?? undefined,
    };

    const { data: deal, error } = await supabase
      .from("deals")
      .update(update)
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: deal as DealRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to assign deal",
    };
  }
}

export async function createNote(
  dealId: string,
  content: string,
): Promise<{ data: NoteRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }
    const { data: deal } = await supabase
      .from("deals")
      .select("id, contact_id")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (!deal) return { data: null, error: "Deal not found" };
    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        deal_id: dealId,
        contact_id: deal.contact_id ?? null,
        author_id: user.userId,
        content: content.trim(),
        visibility: "team",
        updated_by: user.userId,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: note as NoteRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create note",
    };
  }
}
