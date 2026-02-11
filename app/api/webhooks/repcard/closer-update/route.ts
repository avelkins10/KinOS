import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAppointmentPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  findUserByRepCardId,
  insertDealAssignmentHistory,
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
      "closer_update",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

    const newCloserKinos = await findUserByRepCardId(body.closer.id);
    if (!newCloserKinos) {
      await updateWebhookEventStatus(
        eventId,
        "failed",
        "KinOS user not found for closer repcard_user_id " + body.closer.id,
      );
      return NextResponse.json(
        { error: "User not found for RepCard closer id " + body.closer.id },
        { status: 422 },
      );
    }

    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("id, deal_id, closer_id")
      .eq("repcard_appointment_id", body.id)
      .maybeSingle();

    if (appointment) {
      await supabaseAdmin
        .from("appointments")
        .update({ closer_id: newCloserKinos.id })
        .eq("id", appointment.id);
    }

    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("id, closer_id")
      .eq("repcard_appointment_id", body.id)
      .maybeSingle();

    if (deal) {
      const previousCloserId = deal.closer_id ?? null;
      if (previousCloserId !== newCloserKinos.id) {
        await supabaseAdmin
          .from("deals")
          .update({ closer_id: newCloserKinos.id })
          .eq("id", deal.id);
        await insertDealAssignmentHistory(
          deal.id,
          "closer",
          previousCloserId,
          newCloserKinos.id,
          null,
        );
        const closerName =
          `${body.closer.firstName ?? ""} ${body.closer.lastName ?? ""}`.trim() ||
          "Closer";
        await logActivityToDeal(
          deal.id,
          "closer_reassigned",
          `Closer reassigned to ${closerName}`,
          { repcard_appointment_id: body.id, new_closer_id: newCloserKinos.id },
        );
      }
    }

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      undefined,
      deal?.id ?? undefined,
    );

    return NextResponse.json(
      { message: "Closer updated", dealId: deal?.id },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard closer-update]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
