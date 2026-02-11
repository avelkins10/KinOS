import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/lib/actions/appointments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contactId,
      dealId,
      closerId,
      setterId,
      scheduledStart,
      scheduledEnd,
      location,
      notes,
      appointmentType,
    } = body as {
      contactId: string;
      dealId?: string | null;
      closerId: string;
      setterId?: string | null;
      scheduledStart: string;
      scheduledEnd?: string | null;
      location?: string | null;
      notes?: string | null;
      appointmentType?: "in_home" | "virtual" | "phone" | "follow_up";
    };
    if (!contactId || !closerId || !scheduledStart) {
      return NextResponse.json(
        { error: "contactId, closerId, and scheduledStart are required" },
        { status: 400 },
      );
    }
    const { data, error } = await createAppointment({
      contactId,
      dealId: dealId ?? undefined,
      closerId,
      setterId: setterId ?? undefined,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
      location: location ?? undefined,
      notes: notes ?? undefined,
      appointmentType: appointmentType ?? "in_home",
    });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
