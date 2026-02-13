"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getLeadStatus,
  getNextAppointment,
  type LeadStatus,
  type NextAppointment,
} from "@/lib/utils/lead-status";
import type { Database } from "@/lib/supabase/database.types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

export type ContactSortField =
  | "name"
  | "created_at"
  | "owner"
  | "nextAppointment";
export type ContactSortDir = "asc" | "desc";

export interface ContactFilters {
  search?: string;
  officeId?: string;
  ownerId?: string;
  setterId?: string;
  leadSource?: string;
  leadStatus?: LeadStatus;
  dateRange?: { from?: string; to?: string };
  hasAppointment?: boolean;
  sortBy?: ContactSortField;
  sortDir?: ContactSortDir;
}

export interface ContactWithMeta extends ContactRow {
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  office?: { id: string; name: string } | null;
  setter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  leadStatus: LeadStatus;
  nextAppointment: NextAppointment | null;
  deals?: DealRow[];
}

export interface ContactDetail extends ContactWithMeta {
  deals: (DealRow & {
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
  })[];
  notes: NoteRow[];
  attachments: AttachmentRow[];
}

export interface GetContactsResult {
  data: ContactWithMeta[];
  total: number;
  error: string | null;
}

export async function getContacts(
  filters: ContactFilters = {},
  pagination: { limit?: number; offset?: number } = {},
): Promise<GetContactsResult> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], total: 0, error: "Unauthorized" };
    }

    const limit = Math.min(pagination.limit ?? 50, 100);
    const offset = pagination.offset ?? 0;

    let filterContactIds: string[] | { exclude: Set<string> } | null = null;
    const nowIso = new Date().toISOString();

    if (
      filters.officeId ||
      filters.setterId ||
      filters.hasAppointment === true ||
      filters.hasAppointment === false
    ) {
      if (filters.hasAppointment === false) {
        const { data: withAppt } = await supabase
          .from("deals")
          .select("contact_id")
          .eq("company_id", user.companyId)
          .is("deleted_at", null)
          .gte("appointment_date", nowIso);
        const idsWithAppt = new Set(
          (withAppt ?? []).map((d: { contact_id: string }) => d.contact_id),
        );
        filterContactIds =
          idsWithAppt.size > 0 ? { exclude: idsWithAppt } : null;
      } else {
        let dealQuery = supabase
          .from("deals")
          .select("contact_id")
          .eq("company_id", user.companyId)
          .is("deleted_at", null);
        if (filters.officeId)
          dealQuery = dealQuery.eq("office_id", filters.officeId);
        if (filters.setterId)
          dealQuery = dealQuery.eq("setter_id", filters.setterId);
        if (filters.hasAppointment === true) {
          dealQuery = dealQuery.gte("appointment_date", nowIso);
        }
        const { data: dealRows } = await dealQuery;
        const ids = [
          ...new Set(
            (dealRows ?? []).map((d: { contact_id: string }) => d.contact_id),
          ),
        ];
        if (
          ids.length === 0 &&
          (filters.officeId ||
            filters.setterId ||
            filters.hasAppointment === true)
        ) {
          return { data: [], total: 0, error: null };
        }
        filterContactIds = ids;
      }
    }

    let managerContactIds: string[] | null = null;
    if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      const { data: officeDeals } = await supabase
        .from("deals")
        .select("contact_id")
        .eq("company_id", user.companyId)
        .eq("office_id", user.officeId)
        .is("deleted_at", null);
      managerContactIds = [
        ...new Set(
          (officeDeals ?? []).map((d: { contact_id: string }) => d.contact_id),
        ),
      ];
      if (managerContactIds.length === 0)
        return { data: [], total: 0, error: null };
      if (
        filterContactIds &&
        Array.isArray(filterContactIds) &&
        filterContactIds.length > 0
      ) {
        filterContactIds = filterContactIds.filter((id) =>
          managerContactIds!.includes(id),
        );
        if (filterContactIds.length === 0)
          return { data: [], total: 0, error: null };
      }
    }

    let query = supabase
      .from("contacts")
      .select(
        `
        *,
        owner:users!contacts_owner_id_fkey(id, first_name, last_name, email)
      `,
        { count: "exact" },
      )
      .eq("company_id", user.companyId)
      .is("deleted_at", null);

    if (user.role === "closer" && user.userId) {
      query = query.eq("owner_id", user.userId);
    } else if (managerContactIds && managerContactIds.length > 0) {
      query = query.in("id", managerContactIds);
    }

    if (filterContactIds) {
      if (Array.isArray(filterContactIds) && filterContactIds.length > 0) {
        query = query.in("id", filterContactIds);
      } else if (
        typeof filterContactIds === "object" &&
        "exclude" in filterContactIds &&
        (filterContactIds as { exclude: Set<string> }).exclude.size > 0
      ) {
        const excludeIds = Array.from(
          (filterContactIds as { exclude: Set<string> }).exclude,
        );
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }
    }
    if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
    if (filters.leadSource)
      query = query.eq("contact_source", filters.leadSource);
    if (filters.dateRange?.from)
      query = query.gte("created_at", filters.dateRange.from);
    if (filters.dateRange?.to) {
      query = query.lte("created_at", filters.dateRange.to + "T23:59:59.999Z");
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term},address.ilike.${term},city.ilike.${term}`,
      );
    }

    const allowedSort: ContactSortField[] = [
      "name",
      "created_at",
      "owner",
      "nextAppointment",
    ];
    const sortBy =
      filters.sortBy && allowedSort.includes(filters.sortBy)
        ? filters.sortBy
        : "created_at";
    const sortDir = filters.sortDir === "asc" ? "asc" : "desc";
    const ascending = sortDir === "asc";

    if (sortBy === "name") {
      query = query
        .order("last_name", { ascending })
        .order("first_name", { ascending });
    } else if (sortBy === "created_at") {
      query = query.order("created_at", { ascending });
    } else if (sortBy === "owner") {
      query = query.order("owner_id", { ascending, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const needFullSort = filters.leadStatus || sortBy === "nextAppointment";
    const fetchLimit = needFullSort ? 2000 : limit;
    const fetchOffset = needFullSort ? 0 : offset;
    const {
      data: contacts,
      error: contactsError,
      count,
    } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);

    if (contactsError) {
      return { data: [], total: 0, error: contactsError.message };
    }

    const list = (contacts ?? []) as (ContactRow & {
      owner?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      } | null;
    })[];
    const ids = list.map((c) => c.id);
    if (ids.length === 0) {
      return {
        data: [],
        total: count ?? 0,
        error: null,
      };
    }

    const { data: deals } = await supabase
      .from("deals")
      .select(
        "*, office:offices(id, name), setter:users!deals_setter_id_fkey(id, first_name, last_name, email)",
      )
      .in("contact_id", ids)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const dealsByContact = (deals ?? []).reduce(
      (acc, d) => {
        const cid = (d as { contact_id: string }).contact_id;
        if (!acc[cid]) acc[cid] = [];
        acc[cid].push(
          d as DealRow & {
            office?: { id: string; name: string } | null;
            setter?: {
              id: string;
              first_name: string;
              last_name: string;
              email: string;
            } | null;
          },
        );
        return acc;
      },
      {} as Record<
        string,
        (DealRow & {
          office?: { id: string; name: string } | null;
          setter?: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
          } | null;
        })[]
      >,
    );

    const withMeta: ContactWithMeta[] = list.map((c) => {
      const contactDeals = dealsByContact[c.id] ?? [];
      const row = c as ContactRow & { lead_status?: string | null };
      const leadStatus =
        row.lead_status &&
        ["New Lead", "Active Lead", "Customer", "Lost", "On Hold"].includes(
          row.lead_status,
        )
          ? (row.lead_status as LeadStatus)
          : getLeadStatus(contactDeals);
      const nextAppointment = getNextAppointment(contactDeals);
      const latestDeal = contactDeals[0];
      return {
        ...c,
        owner: c.owner ?? null,
        office: latestDeal?.office ?? null,
        setter: latestDeal?.setter ?? null,
        leadStatus,
        nextAppointment,
      };
    });

    let sorted = withMeta;
    if (sortBy === "nextAppointment") {
      sorted = [...withMeta].sort((a, b) => {
        const aDate = a.nextAppointment?.date
          ? new Date(a.nextAppointment.date).getTime()
          : 0;
        const bDate = b.nextAppointment?.date
          ? new Date(b.nextAppointment.date).getTime()
          : 0;
        return ascending ? aDate - bDate : bDate - aDate;
      });
    }

    let filtered = sorted;
    if (filters.leadStatus) {
      filtered = sorted.filter((c) => c.leadStatus === filters.leadStatus);
    }

    const totalCount = needFullSort ? filtered.length : (count ?? 0);
    const data = needFullSort ? filtered.slice(offset, offset + limit) : sorted;
    return {
      data,
      total: totalCount,
      error: null,
    };
  } catch (e) {
    return {
      data: [],
      total: 0,
      error: e instanceof Error ? e.message : "Failed to fetch contacts",
    };
  }
}

export async function getContact(
  id: string,
): Promise<{ data: ContactDetail | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select(
        `
        *,
        owner:users!contacts_owner_id_fkey(id, first_name, last_name, email)
      `,
      )
      .eq("id", id)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (contactError || !contact) {
      return {
        data: null,
        error: contactError?.message ?? "Contact not found",
      };
    }

    if (
      user.role === "closer" &&
      user.userId &&
      (contact as { owner_id: string | null }).owner_id !== user.userId
    ) {
      return { data: null, error: "Access denied" };
    }
    if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      const { data: hasAccess } = await supabase
        .from("deals")
        .select("id")
        .eq("contact_id", id)
        .eq("office_id", user.officeId)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (!hasAccess) {
        return { data: null, error: "Access denied" };
      }
    }

    const [{ data: deals }, { data: notes }, { data: attachments }] =
      await Promise.all([
        supabase
          .from("deals")
          .select(
            "*, closer:users!deals_closer_id_fkey(id, first_name, last_name, email), setter:users!deals_setter_id_fkey(id, first_name, last_name, email), office:offices(id, name)",
          )
          .eq("contact_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("*")
          .eq("contact_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("attachments")
          .select("*")
          .eq("contact_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ]);

    const contactDeals = (deals ?? []) as (DealRow & {
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
    })[];
    const contactRow = contact as { lead_status?: string | null };
    const leadStatus =
      contactRow.lead_status &&
      ["New Lead", "Active Lead", "Customer", "Lost", "On Hold"].includes(
        contactRow.lead_status,
      )
        ? (contactRow.lead_status as LeadStatus)
        : getLeadStatus(contactDeals);
    const nextAppointment = getNextAppointment(contactDeals);
    const latestDeal = contactDeals[0];

    const detail: ContactDetail = {
      ...(contact as ContactRow & {
        owner?: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
        } | null;
      }),
      owner:
        (
          contact as {
            owner?: {
              id: string;
              first_name: string;
              last_name: string;
              email: string;
            } | null;
          }
        ).owner ?? null,
      office: latestDeal?.office ?? null,
      setter: latestDeal?.setter ?? null,
      leadStatus,
      nextAppointment,
      deals: contactDeals,
      notes: (notes ?? []) as NoteRow[],
      attachments: (attachments ?? []) as AttachmentRow[],
    };

    return { data: detail, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to fetch contact",
    };
  }
}

export interface CreateContactInput {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  office_id?: string | null;
  owner_id?: string | null;
  contact_source?: string | null;
  contact_type?: string | null;
}

export async function createContact(input: CreateContactInput): Promise<{
  data: ContactRow | null;
  error: string | null;
  duplicateId?: string;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const firstName = (input.first_name ?? "").trim();
    const lastName = (input.last_name ?? "").trim();
    if (!firstName || !lastName) {
      return { data: null, error: "First name and last name are required" };
    }

    const phone = input.phone?.trim() || null;
    const email = input.email?.trim() || null;
    if (phone || email) {
      const conditions: string[] = [];
      if (email) conditions.push(`email.eq.${email}`);
      if (phone) conditions.push(`phone.eq.${phone}`);
      const { data: existing } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, phone, email")
        .eq("company_id", user.companyId)
        .is("deleted_at", null)
        .or(conditions.join(","))
        .maybeSingle();
      if (existing?.id) {
        return {
          data: null,
          error: "A contact with this phone or email already exists",
          duplicateId: existing.id,
        };
      }
    }

    const insert: Database["public"]["Tables"]["contacts"]["Insert"] = {
      company_id: user.companyId,
      first_name: firstName,
      last_name: lastName,
      email: email ?? null,
      phone: phone ?? null,
      secondary_email: input.secondary_email?.trim() || null,
      secondary_phone: input.secondary_phone?.trim() || null,
      address: input.address?.trim() || null,
      address2: input.address2?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      zip: input.zip?.trim() || null,
      owner_id: input.owner_id ?? user.userId ?? null,
      contact_source: input.contact_source ?? "Manual",
      contact_type: input.contact_type ?? "lead",
      updated_by: user.userId ?? undefined,
    };

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert(insert)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: contact as ContactRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create contact",
    };
  }
}

export interface UpdateContactInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  owner_id?: string | null;
  contact_source?: string | null;
  contact_type?: string | null;
  lead_status?: LeadStatus | null;
}

export async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<{ data: ContactRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("contacts")
      .select("id, owner_id")
      .eq("id", id)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { data: null, error: "Contact not found" };
    }

    if (
      user.role === "closer" &&
      (existing as { owner_id: string | null }).owner_id !== user.userId
    ) {
      return { data: null, error: "You can only edit contacts you own" };
    }
    if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      const { data: hasAccess } = await supabase
        .from("deals")
        .select("id")
        .eq("contact_id", id)
        .eq("office_id", user.officeId)
        .limit(1)
        .maybeSingle();
      if (!hasAccess) {
        return { data: null, error: "Access denied" };
      }
    }

    const update: Database["public"]["Tables"]["contacts"]["Update"] = {
      ...(input.first_name !== undefined && {
        first_name: input.first_name.trim(),
      }),
      ...(input.last_name !== undefined && {
        last_name: input.last_name.trim(),
      }),
      ...(input.email !== undefined && { email: input.email?.trim() || null }),
      ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
      ...(input.secondary_email !== undefined && {
        secondary_email: input.secondary_email?.trim() || null,
      }),
      ...(input.secondary_phone !== undefined && {
        secondary_phone: input.secondary_phone?.trim() || null,
      }),
      ...(input.address !== undefined && {
        address: input.address?.trim() || null,
      }),
      ...(input.address2 !== undefined && {
        address2: input.address2?.trim() || null,
      }),
      ...(input.city !== undefined && { city: input.city?.trim() || null }),
      ...(input.state !== undefined && { state: input.state?.trim() || null }),
      ...(input.zip !== undefined && { zip: input.zip?.trim() || null }),
      ...(input.owner_id !== undefined && { owner_id: input.owner_id }),
      ...(input.contact_source !== undefined && {
        contact_source: input.contact_source,
      }),
      ...(input.contact_type !== undefined && {
        contact_type: input.contact_type,
      }),
      updated_by: user.userId ?? undefined,
    };
    if (input.lead_status !== undefined) {
      (update as Record<string, unknown>).lead_status = input.lead_status;
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .update(update)
      .eq("id", id)
      .eq("company_id", user.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: contact as ContactRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to update contact",
    };
  }
}

export async function deleteContact(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("contacts")
      .select("id, owner_id")
      .eq("id", id)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { success: false, error: "Contact not found" };
    }

    if (
      user.role === "closer" &&
      (existing as { owner_id: string | null }).owner_id !== user.userId
    ) {
      return { success: false, error: "You can only delete contacts you own" };
    }

    const { error } = await supabase
      .from("contacts")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.userId,
        updated_by: user.userId,
      })
      .eq("id", id)
      .eq("company_id", user.companyId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete contact",
    };
  }
}

export async function assignContact(
  id: string,
  ownerId?: string | null,
  setterId?: string | null,
  officeId?: string | null,
): Promise<{ data: ContactRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("contacts")
      .select("id, owner_id")
      .eq("id", id)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { data: null, error: "Contact not found" };
    }

    if (
      user.role === "closer" &&
      (existing as { owner_id: string | null }).owner_id !== user.userId
    ) {
      return { data: null, error: "You can only reassign contacts you own" };
    }

    const update: Database["public"]["Tables"]["contacts"]["Update"] = {
      ...(ownerId !== undefined && { owner_id: ownerId }),
      updated_by: user.userId ?? undefined,
    };

    const { data: contact, error } = await supabase
      .from("contacts")
      .update(update)
      .eq("id", id)
      .eq("company_id", user.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    const { data: latestDeal } = await supabase
      .from("deals")
      .select("id")
      .eq("contact_id", id)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestDeal?.id && (setterId !== undefined || officeId !== undefined)) {
      const dealId = (latestDeal as { id: string }).id;
      const dealUpdate: Database["public"]["Tables"]["deals"]["Update"] = {
        updated_by: user.userId ?? undefined,
      };
      if (setterId !== undefined) dealUpdate.setter_id = setterId;
      if (officeId !== undefined) dealUpdate.office_id = officeId;
      await supabase.from("deals").update(dealUpdate).eq("id", dealId);
    }

    return { data: contact as ContactRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to assign contact",
    };
  }
}

export interface DuplicateCandidate {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  owner: string | null;
}

export async function checkDuplicates(
  phone?: string | null,
  email?: string | null,
): Promise<{ data: DuplicateCandidate[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }
    if (!phone?.trim() && !email?.trim()) {
      return { data: [], error: null };
    }

    const conditions: string[] = [];
    if (email?.trim()) conditions.push(`email.eq.${email.trim()}`);
    if (phone?.trim()) conditions.push(`phone.eq.${phone.trim()}`);
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, phone, email, owner_id")
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .or(conditions.join(","));

    if (error) return { data: [], error: error.message };

    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in(
        "id",
        (contacts ?? [])
          .map((c: { owner_id: string | null }) => c.owner_id)
          .filter(Boolean) as string[],
      );

    const userMap = (users ?? []).reduce(
      (acc, u: { id: string; first_name: string; last_name: string }) => {
        acc[u.id] = [u.first_name, u.last_name].filter(Boolean).join(" ");
        return acc;
      },
      {} as Record<string, string>,
    );

    const list: DuplicateCandidate[] = (contacts ?? []).map(
      (c: {
        id: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        email: string | null;
        owner_id: string | null;
      }) => ({
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        phone: c.phone,
        email: c.email,
        owner: c.owner_id ? (userMap[c.owner_id] ?? null) : null,
      }),
    );

    return { data: list, error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to check duplicates",
    };
  }
}

export interface ImportContactRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function importContactsFromCSV(
  rows: ImportContactRow[],
  options: { skipDuplicates?: boolean } = {},
): Promise<{ data: ImportResult; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return {
        data: { created: 0, skipped: 0, errors: [] },
        error: "Unauthorized",
      };
    }

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = (row.first_name ?? "").trim();
      const lastName = (row.last_name ?? "").trim();
      if (!firstName || !lastName) {
        result.errors.push({
          row: i + 1,
          message: "First name and last name required",
        });
        continue;
      }

      const email = row.email?.trim() || null;
      const phone = row.phone?.trim() || null;
      if (options.skipDuplicates && (phone || email)) {
        const conditions: string[] = [];
        if (email) conditions.push(`email.eq.${email}`);
        if (phone) conditions.push(`phone.eq.${phone}`);
        const { data: existing } = await supabase
          .from("contacts")
          .select("id")
          .eq("company_id", user.companyId)
          .is("deleted_at", null)
          .or(conditions.join(","))
          .maybeSingle();
        if (existing?.id) {
          result.skipped++;
          continue;
        }
      }

      const insert: Database["public"]["Tables"]["contacts"]["Insert"] = {
        company_id: user.companyId,
        first_name: firstName,
        last_name: lastName,
        email: email ?? null,
        phone: phone ?? null,
        address: row.address?.trim() || null,
        city: row.city?.trim() || null,
        state: row.state?.trim() || null,
        zip: row.zip?.trim() || null,
        owner_id: user.userId ?? null,
        contact_source: "Manual",
        contact_type: "lead",
        updated_by: user.userId ?? undefined,
      };

      const { error } = await supabase.from("contacts").insert(insert);
      if (error) {
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.created++;
      }
    }

    return { data: result, error: null };
  } catch (e) {
    return {
      data: { created: 0, skipped: 0, errors: [] },
      error: e instanceof Error ? e.message : "Failed to import",
    };
  }
}

export async function exportContactsToCSV(
  filters: ContactFilters = {},
): Promise<{ data: string; error: string | null }> {
  try {
    const { data: contacts, error } = await getContacts(filters, {
      limit: 10000,
    });
    if (error) return { data: "", error };
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Office",
      "Lead Owner",
      "Setter",
      "Lead Source",
      "Lead Status",
      "Next Appointment",
      "Date Added",
    ];
    const escape = (v: string | null | undefined) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n"))
        return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = (contacts ?? []).map((c) => [
      `${c.first_name} ${c.last_name}`.trim(),
      c.email ?? "",
      c.phone ?? "",
      c.address ?? "",
      c.city ?? "",
      c.state ?? "",
      c.office?.name ?? "",
      c.owner ? `${c.owner.first_name} ${c.owner.last_name}`.trim() : "",
      c.setter ? `${c.setter.first_name} ${c.setter.last_name}`.trim() : "",
      c.contact_source ?? "",
      c.leadStatus,
      c.nextAppointment?.date
        ? new Date(c.nextAppointment.date).toLocaleString()
        : "",
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
    ]);
    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map(escape).join(",")).join("\n");
    return { data: csv, error: null };
  } catch (e) {
    return {
      data: "",
      error: e instanceof Error ? e.message : "Failed to export",
    };
  }
}
