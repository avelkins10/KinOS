"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export interface Appointment extends AppointmentRow {}

export interface AppointmentWithRelations extends Appointment {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
  closer?: { id: string; first_name: string; last_name: string } | null;
  setter?: { id: string; first_name: string; last_name: string } | null;
  deal?: { id: string; deal_number: string; stage: string } | null;
}

export interface CreateAppointmentInput {
  contactId: string;
  dealId?: string | null;
  closerId: string;
  setterId?: string | null;
  scheduledStart: Date | string;
  scheduledEnd?: Date | string | null;
  location?: string | null;
  notes?: string | null;
  appointmentType?: "in_home" | "virtual" | "phone";
}

export interface UpdateAppointmentInput {
  scheduledStart?: Date | string;
  scheduledEnd?: Date | string | null;
  location?: string | null;
  notes?: string | null;
  appointmentType?: "in_home" | "virtual" | "phone";
  status?: Appointment["status"];
}

export async function getContactAppointments(
  contactId: string,
): Promise<{ data: AppointmentWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        contact:contacts(id, first_name, last_name, email, phone, address, city, state, zip),
        closer:users!appointments_closer_id_fkey(id, first_name, last_name),
        setter:users!appointments_setter_id_fkey(id, first_name, last_name),
        deal:deals(id, deal_number, stage)
      `,
      )
      .eq("contact_id", contactId)
      .eq("company_id", user.companyId)
      .order("scheduled_start", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as AppointmentWithRelations[], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function getDealAppointments(
  dealId: string,
): Promise<{ data: AppointmentWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        contact:contacts(id, first_name, last_name, email, phone, address, city, state, zip),
        closer:users!appointments_closer_id_fkey(id, first_name, last_name),
        setter:users!appointments_setter_id_fkey(id, first_name, last_name),
        deal:deals(id, deal_number, stage)
      `,
      )
      .eq("deal_id", dealId)
      .eq("company_id", user.companyId)
      .order("scheduled_start", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as AppointmentWithRelations[], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function getCloserAppointments(
  closerId: string,
  dateRange: { start: Date; end: Date },
): Promise<{ data: AppointmentWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    const startIso = dateRange.start.toISOString();
    const endIso = dateRange.end.toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        contact:contacts(id, first_name, last_name, email, phone, address, city, state, zip),
        closer:users!appointments_closer_id_fkey(id, first_name, last_name),
        setter:users!appointments_setter_id_fkey(id, first_name, last_name),
        deal:deals(id, deal_number, stage)
      `,
      )
      .eq("closer_id", closerId)
      .eq("company_id", user.companyId)
      .eq("is_active", true)
      .gte("scheduled_start", startIso)
      .lte("scheduled_start", endIso)
      .order("scheduled_start", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as AppointmentWithRelations[], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export interface GetAppointmentsFilters {
  closerId?: string;
  setterId?: string;
  officeId?: string;
  dateRange: { start: Date; end: Date };
  status?: string[];
}

export async function getAppointments(
  filters: GetAppointmentsFilters,
): Promise<{ data: AppointmentWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        contact:contacts(id, first_name, last_name, email, phone, address, city, state, zip),
        closer:users!appointments_closer_id_fkey(id, first_name, last_name),
        setter:users!appointments_setter_id_fkey(id, first_name, last_name),
        deal:deals(id, deal_number, stage)
      `,
      )
      .eq("company_id", user.companyId)
      .eq("is_active", true)
      .gte("scheduled_start", filters.dateRange.start.toISOString())
      .lte("scheduled_start", filters.dateRange.end.toISOString());

    if (user.role === "closer" && user.userId) {
      query = query.eq("closer_id", user.userId);
    } else if (user.role === "office_manager" && user.officeId) {
      const { data: officeUserIds } = await supabase
        .from("users")
        .select("id")
        .eq("office_id", user.officeId);
      const ids = (officeUserIds ?? []).map((u) => u.id);
      if (ids.length > 0) query = query.in("closer_id", ids);
    }
    // admin / regional_manager: no closer filter (see all company appointments)

    if (filters.closerId) query = query.eq("closer_id", filters.closerId);
    if (filters.setterId) query = query.eq("setter_id", filters.setterId);
    if (filters.officeId) {
      const { data: officeUserIds } = await supabase
        .from("users")
        .select("id")
        .eq("office_id", filters.officeId);
      const ids = (officeUserIds ?? []).map((u) => u.id);
      if (ids.length > 0) query = query.in("closer_id", ids);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    const { data, error } = await query.order("scheduled_start", {
      ascending: true,
    });

    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as AppointmentWithRelations[], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function getTodaysAppointments(): Promise<{
  data: AppointmentWithRelations[] | null;
  error: string | null;
}> {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  return getAppointments({
    dateRange: { start, end },
  });
}

export async function getUpcomingAppointments(
  userId: string,
  days: number = 7,
): Promise<{ data: AppointmentWithRelations[] | null; error: string | null }> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return getCloserAppointments(userId, { start: now, end });
}

export async function createAppointment(
  data: CreateAppointmentInput,
): Promise<{ data: Appointment | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user.userId)
      return { data: null, error: "Unauthorized" };

    const { data: contact } = await supabase
      .from("contacts")
      .select("company_id")
      .eq("id", data.contactId)
      .single();
    if (!contact || contact.company_id !== user.companyId) {
      return { data: null, error: "Contact not found or access denied" };
    }

    const scheduledStart =
      data.scheduledStart instanceof Date
        ? data.scheduledStart.toISOString()
        : new Date(data.scheduledStart).toISOString();
    const scheduledEnd = data.scheduledEnd
      ? data.scheduledEnd instanceof Date
        ? data.scheduledEnd.toISOString()
        : new Date(data.scheduledEnd).toISOString()
      : null;

    const insert = {
      company_id: user.companyId,
      contact_id: data.contactId,
      deal_id: data.dealId ?? null,
      closer_id: data.closerId,
      setter_id: data.setterId ?? null,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      timezone: "America/New_York",
      duration_minutes: scheduledEnd
        ? Math.round(
            (new Date(scheduledEnd).getTime() -
              new Date(scheduledStart).getTime()) /
              60000,
          )
        : null,
      location: data.location ?? null,
      notes: data.notes ?? null,
      status: "scheduled",
      appointment_type: data.appointmentType ?? "in_home",
      is_active: true,
      created_by: user.userId,
      updated_by: user.userId,
    };

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert(insert)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: appointment as Appointment, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentInput,
): Promise<{ data: Appointment | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user.userId)
      return { data: null, error: "Unauthorized" };

    const update: Record<string, unknown> = { updated_by: user.userId };
    if (data.scheduledStart !== undefined) {
      update.scheduled_start =
        data.scheduledStart instanceof Date
          ? data.scheduledStart.toISOString()
          : new Date(data.scheduledStart).toISOString();
    }
    if (data.scheduledEnd !== undefined) {
      update.scheduled_end = data.scheduledEnd
        ? data.scheduledEnd instanceof Date
          ? data.scheduledEnd.toISOString()
          : new Date(data.scheduledEnd).toISOString()
        : null;
    }
    if (data.location !== undefined) update.location = data.location;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.appointmentType !== undefined)
      update.appointment_type = data.appointmentType;
    if (data.status !== undefined) update.status = data.status;

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(update)
      .eq("id", id)
      .eq("company_id", user.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: appointment as Appointment, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function getAppointmentOutcomesStats(days: number = 7): Promise<{
  data: {
    completed: number;
    no_show: number;
    rescheduled: number;
    cancelled: number;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let query = supabase
      .from("appointments")
      .select("status")
      .eq("company_id", user.companyId)
      .gte("scheduled_start", start.toISOString())
      .lte("scheduled_start", end.toISOString());

    if (user.role === "closer" && user.userId) {
      query = query.eq("closer_id", user.userId);
    } else if (user.role === "office_manager" && user.officeId) {
      const { data: officeUserIds } = await supabase
        .from("users")
        .select("id")
        .eq("office_id", user.officeId);
      const ids = (officeUserIds ?? []).map((u) => u.id);
      if (ids.length > 0) query = query.in("closer_id", ids);
    }

    const { data: rows, error } = await query;
    if (error) return { data: null, error: error.message };

    const counts = { completed: 0, no_show: 0, rescheduled: 0, cancelled: 0 };
    for (const r of rows ?? []) {
      if (r.status === "completed") counts.completed += 1;
      else if (r.status === "no_show") counts.no_show += 1;
      else if (r.status === "rescheduled") counts.rescheduled += 1;
      else if (r.status === "cancelled") counts.cancelled += 1;
    }
    return { data: counts, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function getCalendarFilterOptions(): Promise<{
  data: {
    closers: { id: string; name: string }[];
    offices: { id: string; name: string }[];
  } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) return { data: null, error: "Unauthorized" };

    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("company_id", user.companyId)
      .eq("status", "active");
    const closers = (users ?? []).map((u) => ({
      id: u.id,
      name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.id,
    }));

    const { data: offices } = await supabase
      .from("offices")
      .select("id, name")
      .eq("company_id", user.companyId)
      .eq("is_active", true);
    const officeList = (offices ?? []).map((o) => ({
      id: o.id,
      name: o.name ?? o.id,
    }));

    return { data: { closers, offices: officeList }, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}

export async function cancelAppointment(
  id: string,
  reason?: string,
): Promise<{ data: Appointment | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || !user.userId)
      return { data: null, error: "Unauthorized" };

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        outcome_notes: reason ?? null,
        updated_by: user.userId,
      })
      .eq("id", id)
      .eq("company_id", user.companyId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: appointment as Appointment, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}
