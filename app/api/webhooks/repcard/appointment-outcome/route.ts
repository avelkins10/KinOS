import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAppointmentPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  mapAppointmentStatusToKinOS,
  logActivityToDeal,
} from "@/lib/integrations/repcard/webhook-utils";

export async function POST(request: NextRequest) {
  let eventId: string | null = null;
  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  try {
    const body = await request.json();
    if (!isAppointmentPayload(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid payload: expected appointment (id, closer, contact, user)",
        },
        { status: 400 },
      );
    }

    const logged = await logWebhookEvent(
      "repcard",
      "appointment_outcome",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("id, deal_id")
      .eq("repcard_appointment_id", body.id)
      .maybeSingle();

    if (!appointment) {
      await updateWebhookEventStatus(
        eventId,
        "failed",
        "Appointment not found for repcard_appointment_id " + body.id,
      );
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    const status = mapAppointmentStatusToKinOS(body.appointment_status_title);
    const outcomeTitle = body.appointment_status_title ?? "";
    const outcomeId = body.appointment_status_id ?? null;

    await supabaseAdmin
      .from("appointments")
      .update({
        status,
        outcome: outcomeTitle,
        outcome_id: outcomeId,
      })
      .eq("id", appointment.id);

    if (appointment.deal_id) {
      const dealUpdate: Record<string, unknown> = {
        appointment_outcome: outcomeTitle,
        appointment_outcome_id: outcomeId,
      };
      const isCompleted =
        status === "completed" &&
        (outcomeTitle.toLowerCase().includes("sale") ||
          outcomeTitle.toLowerCase().includes("signed"));
      const { data: deal } = await supabaseAdmin
        .from("deals")
        .select("stage")
        .eq("id", appointment.deal_id)
        .single();
      if (deal?.stage === "appointment_set" && isCompleted) {
        (dealUpdate as Record<string, unknown>).stage = "appointment_sat";
      }
      await supabaseAdmin
        .from("deals")
        .update(dealUpdate as never)
        .eq("id", appointment.deal_id);

      await logActivityToDeal(
        appointment.deal_id,
        "appointment_outcome_recorded",
        `Appointment outcome: ${outcomeTitle}`,
        { repcard_appointment_id: body.id, status },
      );
    }

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      undefined,
      appointment.deal_id ?? undefined,
    );

    return NextResponse.json(
      {
        message: "Appointment outcome recorded",
        appointmentId: appointment.id,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard appointment-outcome]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
