/**
 * RepCard webhook payload types for appointment and contact events.
 * Used by webhook handlers at /api/webhooks/repcard/*.
 */

export interface RepCardUser {
  id: number;
  name?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  companyAccountNumber?: string;
  jobTitle?: string;
  companyWebsite?: string;
  industry?: string;
  role?: string;
  badgeNo?: string;
  location?: string;
  team?: string;
  image?: string;
  companyId?: number;
  createdAt?: string;
}

export interface RepCardContactNested {
  id: number;
  name?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  fullPhoneNumber?: string;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  type?: number;
  typeId?: number;
  status?: string;
  statusId?: number;
  owner?: RepCardUser;
  user?: RepCardUser;
  notes?: string;
  allNotes?: string;
  appointmentNotes?: string;
  appointmentLatestNotes?: string;
  attachments?: unknown[];
  appointmentAttachment?: unknown[];
  system_size_kw?: number;
  net_price?: number;
  gross_price?: number;
  gross_ppw?: number;
  net_ppw?: number;
  [key: string]: unknown;
}

export interface RepCardAppointmentPayload {
  id: number;
  title?: string;
  appointment_link?: string;
  appointment_location?: string;
  notes?: string;
  appointment_attachment?: unknown;
  closer: RepCardUser;
  appointment_status_id?: number;
  appointment_status_title?: string;
  appt_start_time_with_offset?: string;
  appt_end_time_with_offset?: string;
  appt_start_time?: string;
  appt_end_time?: string;
  contact: RepCardContactNested;
  user: RepCardUser;
  [key: string]: unknown;
}

export interface RepCardContactPayload {
  id: number;
  name?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  fullPhoneNumber?: string;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  type?: number;
  typeId?: number;
  status?: string;
  statusId?: number;
  owner?: RepCardUser;
  user?: RepCardUser;
  notes?: string;
  allNotes?: string;
  system_size_kw?: number;
  net_price?: number;
  gross_price?: number;
  gross_ppw?: number;
  net_ppw?: number;
  [key: string]: unknown;
}

export function isAppointmentPayload(
  body: unknown,
): body is RepCardAppointmentPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const closer = b.closer as Record<string, unknown> | undefined;
  const contact = b.contact as Record<string, unknown> | undefined;
  const user = b.user as Record<string, unknown> | undefined;
  return (
    typeof b.id === "number" &&
    !!closer &&
    typeof closer.id === "number" &&
    !!contact &&
    typeof contact.id === "number" &&
    !!user &&
    typeof user.id === "number"
  );
}

export function isContactPayload(body: unknown): body is RepCardContactPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.id === "number" &&
    (typeof b.firstName === "string" || typeof b.name === "string")
  );
}
