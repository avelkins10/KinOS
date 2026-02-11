/**
 * Lead status and appointment helpers derived from deal data.
 * Contacts do not have a lead_status column; status is computed from deals.
 */

export type LeadStatus =
  | "New Lead"
  | "Active Lead"
  | "Customer"
  | "Lost"
  | "On Hold";

export interface DealForStatus {
  stage: string | null;
  appointment_date: string | null;
  appointment_end?: string | null;
  appointment_location?: string | null;
  appointment_notes?: string | null;
  appointment_outcome?: string | null;
  created_at?: string | null;
}

/**
 * Derive lead status from deals (latest deal stage).
 * If override is provided (e.g. from contact.lead_status), return it.
 */
export function getLeadStatus(
  deals: DealForStatus[],
  override?: LeadStatus | null,
): LeadStatus {
  if (
    override &&
    ["New Lead", "Active Lead", "Customer", "Lost", "On Hold"].includes(
      override,
    )
  )
    return override;
  if (!deals?.length) return "New Lead";
  const sorted = [...deals].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime(),
  );
  const latest = sorted[0];
  const stage = (latest?.stage ?? "").toLowerCase();
  if (stage === "cancelled" || stage === "lost") return "Lost";
  if (
    [
      "contract_sent",
      "contract_signed",
      "submission_ready",
      "submitted",
      "intake_approved",
      "intake_rejected",
    ].includes(stage)
  ) {
    return "Customer";
  }
  return "Active Lead";
}

export interface NextAppointment {
  date: string;
  time?: string;
  type?: string;
  status?: string;
  dealId?: string;
}

/**
 * Get next upcoming appointment from deals (appointment_date >= now).
 */
export function getNextAppointment(
  deals: DealForStatus[],
  now: Date = new Date(),
): NextAppointment | null {
  const upcoming = (deals ?? [])
    .filter((d) => d.appointment_date && new Date(d.appointment_date) >= now)
    .sort(
      (a, b) =>
        new Date(a.appointment_date!).getTime() -
        new Date(b.appointment_date!).getTime(),
    );
  const first = upcoming[0];
  if (!first?.appointment_date) return null;
  const d = new Date(first.appointment_date);
  return {
    date: d.toISOString(),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
    type: first.appointment_location ?? undefined,
    status: first.appointment_outcome ?? undefined,
    dealId: (first as { id?: string }).id,
  };
}

export type AppointmentColor = "green" | "yellow" | "red" | "gray";

/**
 * Color for appointment badge: today = green, within 7 days = yellow, past = red, none = gray.
 */
export function getAppointmentColor(
  appointmentDate: string | null | undefined,
): AppointmentColor {
  if (!appointmentDate) return "gray";
  const d = new Date(appointmentDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const apptDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (apptDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "red";
  if (diffDays === 0) return "green";
  if (diffDays <= 7) return "yellow";
  return "gray";
}
