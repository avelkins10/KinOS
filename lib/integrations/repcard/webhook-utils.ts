/**
 * Shared utilities for RepCard webhook handlers.
 * Uses supabaseAdmin (service role) for all DB operations.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  RepCardAppointmentPayload,
  RepCardContactNested,
  RepCardContactPayload,
} from "./webhook-types";

type WebhookEventsInsert =
  Database["public"]["Tables"]["webhook_events"]["Insert"];
type ContactsInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type ContactsRow = Database["public"]["Tables"]["contacts"]["Row"];
type ActivitiesInsert = Database["public"]["Tables"]["activities"]["Insert"];

const WEBHOOK_STATUS = {
  processing: "processing" as const,
  processed: "processed" as const,
  failed: "failed" as const,
};

export async function logWebhookEvent(
  source: string,
  eventType: string,
  payload: unknown,
  headers: Record<string, string>,
  status: "processing" | "processed" | "failed" = WEBHOOK_STATUS.processing,
  errorMessage?: string | null,
  relatedContactId?: string | null,
  relatedDealId?: string | null,
): Promise<{ eventId: string } | { error: string }> {
  const insert: WebhookEventsInsert = {
    source,
    event_type: eventType,
    payload:
      payload as Database["public"]["Tables"]["webhook_events"]["Row"]["payload"],
    headers:
      headers as unknown as Database["public"]["Tables"]["webhook_events"]["Row"]["headers"],
    status:
      status === "processing"
        ? "processing"
        : status === "processed"
          ? "processed"
          : "failed",
    error_message: errorMessage ?? null,
    processed_at: status === "processed" ? new Date().toISOString() : null,
    related_contact_id: relatedContactId ?? null,
    related_deal_id: relatedDealId ?? null,
    retry_count: 0,
  };
  const { data, error } = await supabaseAdmin
    .from("webhook_events")
    .insert(insert)
    .select("id")
    .single();
  if (error || !data?.id) {
    return { error: error?.message ?? "Failed to log webhook event" };
  }
  return { eventId: data.id };
}

export async function updateWebhookEventStatus(
  eventId: string,
  status: "processed" | "failed",
  errorMessage?: string | null,
  processedAt?: string | null,
  relatedContactId?: string | null,
  relatedDealId?: string | null,
): Promise<void> {
  await supabaseAdmin
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage ?? undefined,
      processed_at:
        processedAt ??
        (status === "processed" ? new Date().toISOString() : undefined),
      related_contact_id: relatedContactId ?? undefined,
      related_deal_id: relatedDealId ?? undefined,
      retry_count: 1,
    })
    .eq("id", eventId);
}

function contactFromPayload(c: RepCardContactNested | RepCardContactPayload): {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: number | null;
  statusId: number | null;
} {
  const nameStr = (c as RepCardContactPayload).name;
  const firstName =
    "firstName" in c && typeof c.firstName === "string"
      ? c.firstName
      : typeof nameStr === "string"
        ? (nameStr.split(" ")[0] ?? "")
        : "";
  const lastName =
    "lastName" in c && typeof c.lastName === "string"
      ? c.lastName
      : typeof nameStr === "string"
        ? nameStr.split(" ").slice(1).join(" ") || ""
        : "";
  const phone =
    (c as RepCardContactNested).fullPhoneNumber ??
    (c as RepCardContactNested).phoneNumber ??
    null;
  return {
    id: c.id,
    firstName,
    lastName,
    email: (c as RepCardContactNested).email ?? null,
    phone: typeof phone === "string" ? phone : null,
    countryCode: null,
    address: (c as RepCardContactNested).address ?? null,
    city: (c as RepCardContactNested).city ?? null,
    state: (c as RepCardContactNested).state ?? null,
    zip: (c as RepCardContactNested).zip ?? null,
    type:
      (c as RepCardContactNested).type ??
      (c as RepCardContactPayload).typeId ??
      null,
    statusId: (c as RepCardContactNested).statusId ?? null,
  };
}

export async function findOrCreateContact(
  payload: RepCardContactNested | RepCardContactPayload,
  companyId: string,
): Promise<{ contactId: string } | { error: string }> {
  const c = contactFromPayload(payload);
  const { data: existingByRepCard } = await supabaseAdmin
    .from("contacts")
    .select("id")
    .eq("company_id", companyId)
    .eq("repcard_customer_id", c.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingByRepCard?.id) {
    const updatePayload: Partial<ContactsRow> = {
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      country_code: c.countryCode ?? undefined,
      address: c.address ?? undefined,
      city: c.city ?? undefined,
      state: c.state ?? undefined,
      zip: c.zip ?? undefined,
      contact_source: "RepCard",
      contact_type: c.type != null ? String(c.type) : undefined,
      repcard_status_id: c.statusId ?? undefined,
    };
    await supabaseAdmin
      .from("contacts")
      .update(updatePayload)
      .eq("id", existingByRepCard.id);
    return { contactId: existingByRepCard.id };
  }

  const phone = c.phone ?? null;
  const email = c.email ?? null;
  let existingByPhoneEmail: { id: string } | null = null;
  if (phone || email) {
    const conditions: string[] = [];
    if (email) conditions.push(`email.eq.${email}`);
    if (phone) conditions.push(`phone.eq.${phone}`);
    const { data: match } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .or(conditions.join(","))
      .maybeSingle();
    existingByPhoneEmail = match;
  }

  if (existingByPhoneEmail?.id) {
    await supabaseAdmin
      .from("contacts")
      .update({
        repcard_customer_id: c.id,
        first_name: c.firstName,
        last_name: c.lastName,
        email: email ?? undefined,
        phone: phone ?? undefined,
        country_code: c.countryCode ?? undefined,
        address: c.address ?? undefined,
        city: c.city ?? undefined,
        state: c.state ?? undefined,
        zip: c.zip ?? undefined,
        contact_source: "RepCard",
        contact_type: c.type != null ? String(c.type) : undefined,
        repcard_status_id: c.statusId ?? undefined,
      })
      .eq("id", existingByPhoneEmail.id);
    return { contactId: existingByPhoneEmail.id };
  }

  const insertContact: ContactsInsert = {
    company_id: companyId,
    first_name: c.firstName,
    last_name: c.lastName,
    email: email ?? null,
    phone: phone ?? null,
    country_code: c.countryCode ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    zip: c.zip ?? null,
    contact_source: "RepCard",
    contact_type: c.type != null ? String(c.type) : null,
    repcard_customer_id: c.id,
    repcard_status_id: c.statusId ?? null,
  };
  const { data: newContact, error } = await supabaseAdmin
    .from("contacts")
    .insert(insertContact)
    .select("id")
    .single();
  if (error || !newContact?.id) {
    return { error: error?.message ?? "Failed to create contact" };
  }
  return { contactId: newContact.id };
}

export interface KinOSUser {
  id: string;
  company_id: string;
  office_id: string | null;
}

export async function findUserByRepCardId(
  repCardUserId: number,
): Promise<KinOSUser | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, company_id, office_id")
    .eq("repcard_user_id", repCardUserId)
    .maybeSingle();
  return data as KinOSUser | null;
}

/**
 * Parse RepCard timestamp with offset (e.g. "2026-02-10T14:00:00-07:00") to UTC ISO string.
 */
export function parseRepCardDateTime(
  appt_start_time_with_offset: string,
): string {
  const d = new Date(appt_start_time_with_offset);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export type AppointmentStatusKinOS =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled"
  | "rescheduled";

export function mapAppointmentStatusToKinOS(
  appointment_status_title: string | undefined,
): AppointmentStatusKinOS {
  if (!appointment_status_title) return "completed";
  const t = appointment_status_title.toLowerCase();
  if (t.includes("sale") || t.includes("signed")) return "completed";
  if (t.includes("no show") || t.includes("no-show")) return "no_show";
  if (t.includes("cancel")) return "cancelled";
  if (t.includes("reschedule")) return "rescheduled";
  return "completed";
}

/**
 * Normalize RepCard contact type to a numeric id before mapping.
 * Prefer typeId; else map string type (Lead/Customer/Recruit/Other) to id.
 */
export function normalizeRepCardContactType(payload: {
  typeId?: number;
  type?: string | number;
}): number | undefined {
  if (typeof payload.typeId === "number") return payload.typeId;
  const t = payload.type;
  if (typeof t === "number") return t;
  if (typeof t === "string") {
    const lower = t.toLowerCase();
    if (lower === "lead") return 1;
    if (lower === "customer") return 2;
    if (lower === "recruit") return 3;
    if (lower === "other") return undefined;
  }
  return undefined;
}

export function mapContactTypeToKinOS(
  typeId: number | undefined,
): "lead" | "customer" | "other" {
  if (typeId === 1) return "lead";
  if (typeId === 2) return "customer";
  if (typeId === 3) return "other";
  return "other";
}

export async function logActivityToContact(
  contactId: string,
  activityType: string,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const insert: ActivitiesInsert = {
    contact_id: contactId,
    activity_type: activityType,
    title: description.slice(0, 255),
    description: description.length > 255 ? description : undefined,
    metadata: (metadata ??
      {}) as Database["public"]["Tables"]["activities"]["Row"]["metadata"],
  };
  await supabaseAdmin.from("activities").insert(insert);
}

export async function logActivityToDeal(
  dealId: string,
  activityType: string,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const insert: ActivitiesInsert = {
    deal_id: dealId,
    activity_type: activityType,
    title: description.slice(0, 255),
    description: description.length > 255 ? description : undefined,
    metadata: (metadata ??
      {}) as Database["public"]["Tables"]["activities"]["Row"]["metadata"],
  };
  await supabaseAdmin.from("activities").insert(insert);
}

export async function insertContactChangeHistory(
  contactId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  changeSource: string = "repcard_webhook",
): Promise<void> {
  await supabaseAdmin.from("contact_change_history").insert({
    contact_id: contactId,
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
    change_source: changeSource,
  });
}

export async function insertDealAssignmentHistory(
  dealId: string,
  assignmentType: "closer" | "setter" | "office" | "team",
  fromUserId: string | null,
  toUserId: string | null,
  changedBy: string | null,
): Promise<void> {
  await supabaseAdmin.from("deal_assignment_history").insert({
    deal_id: dealId,
    assignment_type: assignmentType,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    changed_by: changedBy,
  });
}
