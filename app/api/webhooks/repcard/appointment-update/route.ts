import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAppointmentPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  findOrCreateContact,
  findUserByRepCardId,
  parseRepCardDateTime,
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
      "appointment_update",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

    const { data: existingAppt } = await supabaseAdmin
      .from("appointments")
      .select("id, deal_id, company_id")
      .eq("repcard_appointment_id", body.id)
      .maybeSingle();

    if (!existingAppt) {
      const closerKinos = await findUserByRepCardId(body.closer.id);
      if (!closerKinos) {
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
      const contactResult = await findOrCreateContact(
        body.contact,
        closerKinos.company_id,
      );
      if ("error" in contactResult) {
        await updateWebhookEventStatus(eventId, "failed", contactResult.error);
        return NextResponse.json(
          { error: contactResult.error },
          { status: 500 },
        );
      }
      let setterId: string | null = null;
      if (body.user?.id) {
        const setterKinos = await findUserByRepCardId(body.user.id);
        setterId = setterKinos?.id ?? null;
      }
      const scheduledStart = body.appt_start_time_with_offset
        ? parseRepCardDateTime(body.appt_start_time_with_offset)
        : new Date().toISOString();
      let scheduledEnd: string | null = null;
      if (body.appt_end_time_with_offset) {
        scheduledEnd = parseRepCardDateTime(body.appt_end_time_with_offset);
      }
      const durationMinutes =
        scheduledEnd && scheduledStart
          ? Math.round(
              (new Date(scheduledEnd).getTime() -
                new Date(scheduledStart).getTime()) /
                60000,
            )
          : null;
      const { data: newAppt, error: apptErr } = await supabaseAdmin
        .from("appointments")
        .insert({
          company_id: closerKinos.company_id,
          contact_id: contactResult.contactId,
          deal_id: null,
          repcard_appointment_id: body.id,
          closer_id: closerKinos.id,
          setter_id: setterId,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          timezone: "America/New_York",
          duration_minutes: durationMinutes,
          location: body.appointment_location ?? null,
          status: "scheduled",
          notes: body.notes ?? null,
          appointment_type: "in_home",
          is_active: true,
        })
        .select("id")
        .single();
      if (apptErr || !newAppt?.id) {
        await updateWebhookEventStatus(
          eventId,
          "failed",
          apptErr?.message ?? "Failed to create appointment",
        );
        return NextResponse.json(
          { error: apptErr?.message ?? "Failed to create appointment" },
          { status: 500 },
        );
      }
      const dealInsert: Record<string, unknown> = {
        company_id: closerKinos.company_id,
        contact_id: contactResult.contactId,
        deal_number: "",
        stage: "appointment_set",
        source: "RepCard",
        closer_id: closerKinos.id,
        setter_id: setterId,
        office_id: closerKinos.office_id ?? null,
        repcard_appointment_id: body.id,
        appointment_date: scheduledStart,
        appointment_end: scheduledEnd,
        appointment_timezone: "America/New_York",
        appointment_location: body.appointment_location ?? null,
        appointment_notes: body.notes ?? null,
        active_appointment_id: newAppt.id,
      };
      const { data: newDeal, error: dealErr } = await supabaseAdmin
        .from("deals")
        .insert(dealInsert as never)
        .select("id")
        .single();
      if (dealErr || !newDeal?.id) {
        await updateWebhookEventStatus(
          eventId,
          "failed",
          dealErr?.message ?? "Failed to create deal",
        );
        return NextResponse.json(
          { error: dealErr?.message ?? "Failed to create deal" },
          { status: 500 },
        );
      }
      await supabaseAdmin
        .from("appointments")
        .update({ deal_id: newDeal.id })
        .eq("id", newAppt.id);
      await updateWebhookEventStatus(
        eventId,
        "processed",
        undefined,
        new Date().toISOString(),
        contactResult.contactId,
        newDeal.id,
      );
      return NextResponse.json(
        {
          message: "Appointment created (treated as new)",
          contactId: contactResult.contactId,
          dealId: newDeal.id,
          appointmentId: newAppt.id,
        },
        { status: 200 },
      );
    }

    const scheduledStart = body.appt_start_time_with_offset
      ? parseRepCardDateTime(body.appt_start_time_with_offset)
      : null;
    let scheduledEnd: string | null = null;
    if (body.appt_end_time_with_offset) {
      scheduledEnd = parseRepCardDateTime(body.appt_end_time_with_offset);
    }
    const durationMinutes =
      scheduledStart && scheduledEnd
        ? Math.round(
            (new Date(scheduledEnd).getTime() -
              new Date(scheduledStart).getTime()) /
              60000,
          )
        : null;

    const updatePayload: Record<string, unknown> = {
      scheduled_end: scheduledEnd ?? undefined,
      timezone: "America/New_York",
      location: body.appointment_location ?? null,
      notes: body.notes ?? null,
      duration_minutes: durationMinutes ?? null,
    };
    if (scheduledStart) updatePayload.scheduled_start = scheduledStart;

    await supabaseAdmin
      .from("appointments")
      .update(updatePayload as never)
      .eq("id", existingAppt.id);

    if (existingAppt.deal_id) {
      const dealUpdate: Record<string, unknown> = {
        appointment_date: scheduledStart ?? undefined,
        appointment_end: scheduledEnd ?? undefined,
        appointment_timezone: "America/New_York",
        appointment_location: body.appointment_location ?? null,
        appointment_notes: body.notes ?? null,
      };
      await supabaseAdmin
        .from("deals")
        .update(dealUpdate as never)
        .eq("id", existingAppt.deal_id);

      const newTime = scheduledStart
        ? new Date(scheduledStart).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "updated time";
      await logActivityToDeal(
        existingAppt.deal_id,
        "appointment_rescheduled",
        `Appointment rescheduled to ${newTime}`,
        { repcard_appointment_id: body.id },
      );
    }

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      undefined,
      existingAppt.deal_id ?? undefined,
    );

    return NextResponse.json(
      { message: "Appointment updated", appointmentId: existingAppt.id },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard appointment-update]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
