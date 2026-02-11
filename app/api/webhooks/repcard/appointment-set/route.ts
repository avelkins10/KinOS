import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { RepCardAppointmentPayload } from "@/lib/integrations/repcard/webhook-types";
import { isAppointmentPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  findOrCreateContact,
  findUserByRepCardId,
  parseRepCardDateTime,
  logActivityToContact,
  logActivityToDeal,
} from "@/lib/integrations/repcard/webhook-utils";

/**
 * Shared handler for appointment-set logic. Used by both POST /api/webhooks/repcard/appointment-set
 * and POST /api/webhooks/repcard (create-lead alias) so RepCard webhooks work with either URL.
 */
export async function handleAppointmentSet(
  body: RepCardAppointmentPayload,
  headersObj: Record<string, string>,
): Promise<NextResponse> {
  let eventId: string | null = null;

  try {
    const logged = await logWebhookEvent(
      "repcard",
      "appointment_set",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

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
    const companyId = closerKinos.company_id;
    const officeId = closerKinos.office_id ?? null;

    const contactResult = await findOrCreateContact(body.contact, companyId);
    if ("error" in contactResult) {
      await updateWebhookEventStatus(eventId, "failed", contactResult.error);
      return NextResponse.json({ error: contactResult.error }, { status: 500 });
    }
    const contactId = contactResult.contactId;

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

    const attachment = body.appointment_attachment;
    const repcardAttachments: unknown[] = Array.isArray(attachment)
      ? attachment
      : attachment != null
        ? [attachment]
        : [];

    const { data: existingAppt } = await supabaseAdmin
      .from("appointments")
      .select("id, deal_id")
      .eq("repcard_appointment_id", body.id)
      .maybeSingle();

    if (existingAppt) {
      await supabaseAdmin
        .from("appointments")
        .update({
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          timezone: "America/New_York",
          duration_minutes: durationMinutes,
          location: body.appointment_location ?? null,
          notes: body.notes ?? null,
          repcard_attachments: repcardAttachments as Json,
          closer_id: closerKinos.id,
          setter_id: setterId,
        })
        .eq("id", existingAppt.id);

      const dealUpdate: Record<string, unknown> = {
        appointment_date: scheduledStart,
        appointment_end: scheduledEnd,
        appointment_timezone: "America/New_York",
        appointment_location: body.appointment_location ?? null,
        appointment_notes: body.notes ?? null,
        repcard_appointment_id: body.id,
        active_appointment_id: existingAppt.id,
        closer_id: closerKinos.id,
        setter_id: setterId,
        office_id: officeId,
      };
      if (existingAppt.deal_id) {
        await supabaseAdmin
          .from("deals")
          .update(dealUpdate as never)
          .eq("id", existingAppt.deal_id);
      } else {
        const { data: dealByRepcard } = await supabaseAdmin
          .from("deals")
          .select("id")
          .eq("repcard_appointment_id", body.id)
          .eq("contact_id", contactId)
          .is("deleted_at", null)
          .maybeSingle();
        if (dealByRepcard) {
          await supabaseAdmin
            .from("deals")
            .update({
              ...dealUpdate,
              active_appointment_id: existingAppt.id,
            } as never)
            .eq("id", dealByRepcard.id);
        }
      }

      await updateWebhookEventStatus(
        eventId,
        "processed",
        undefined,
        new Date().toISOString(),
        contactId,
        existingAppt.deal_id ?? undefined,
      );
      return NextResponse.json(
        {
          message: "Appointment set (existing)",
          contactId,
          dealId: existingAppt.deal_id ?? null,
          appointmentId: existingAppt.id,
        },
        { status: 200 },
      );
    }

    const { data: appointment, error: apptError } = await supabaseAdmin
      .from("appointments")
      .upsert(
        {
          company_id: companyId,
          contact_id: contactId,
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
          repcard_attachments: repcardAttachments as Json,
          appointment_type: "in_home",
          is_active: true,
        },
        { onConflict: "repcard_appointment_id" },
      )
      .select("id")
      .single();

    if (apptError || !appointment?.id) {
      await updateWebhookEventStatus(
        eventId,
        "failed",
        apptError?.message ?? "Failed to upsert appointment",
      );
      return NextResponse.json(
        { error: apptError?.message ?? "Failed to upsert appointment" },
        { status: 500 },
      );
    }

    const { data: existingDeal } = await supabaseAdmin
      .from("deals")
      .select("id")
      .eq("repcard_appointment_id", body.id)
      .eq("contact_id", contactId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingDeal) {
      await supabaseAdmin
        .from("deals")
        .update({
          active_appointment_id: appointment.id,
          appointment_date: scheduledStart,
          appointment_end: scheduledEnd,
          appointment_timezone: "America/New_York",
          appointment_location: body.appointment_location ?? null,
          appointment_notes: body.notes ?? null,
          closer_id: closerKinos.id,
          setter_id: setterId,
          office_id: officeId,
        })
        .eq("id", existingDeal.id);
      await supabaseAdmin
        .from("appointments")
        .update({ deal_id: existingDeal.id })
        .eq("id", appointment.id);
      await updateWebhookEventStatus(
        eventId,
        "processed",
        undefined,
        new Date().toISOString(),
        contactId,
        existingDeal.id,
      );
      return NextResponse.json(
        {
          message: "Appointment set",
          contactId,
          dealId: existingDeal.id,
          appointmentId: appointment.id,
        },
        { status: 200 },
      );
    }

    const dealInsert: Record<string, unknown> = {
      company_id: companyId,
      contact_id: contactId,
      deal_number: "",
      stage: "new_lead",
      source: "RepCard",
      closer_id: closerKinos.id,
      setter_id: setterId,
      office_id: officeId,
      repcard_appointment_id: body.id,
      appointment_date: scheduledStart,
      appointment_end: scheduledEnd,
      appointment_timezone: "America/New_York",
      appointment_location: body.appointment_location ?? null,
      appointment_notes: body.notes ?? null,
      active_appointment_id: appointment.id,
    };
    const { data: newDeal, error: dealError } = await supabaseAdmin
      .from("deals")
      .insert(dealInsert as never)
      .select("id")
      .single();

    if (dealError || !newDeal?.id) {
      await updateWebhookEventStatus(
        eventId,
        "failed",
        dealError?.message ?? "Failed to create deal",
      );
      return NextResponse.json(
        { error: dealError?.message ?? "Failed to create deal" },
        { status: 500 },
      );
    }

    await supabaseAdmin
      .from("appointments")
      .update({ deal_id: newDeal.id })
      .eq("id", appointment.id);

    await logActivityToContact(
      contactId,
      "appointment_created",
      "Appointment set from RepCard",
      { repcard_appointment_id: body.id },
    );
    await logActivityToDeal(
      newDeal.id,
      "appointment_created",
      "Appointment set from RepCard",
      { repcard_appointment_id: body.id },
    );

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      contactId,
      newDeal.id,
    );

    return NextResponse.json(
      {
        message: "Appointment set",
        contactId,
        dealId: newDeal.id,
        appointmentId: appointment.id,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard appointment-set]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    return handleAppointmentSet(body, headersObj);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[RepCard appointment-set]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
