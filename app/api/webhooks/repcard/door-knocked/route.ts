import { NextRequest, NextResponse } from "next/server";
import { isContactPayload } from "@/lib/integrations/repcard/webhook-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  findOrCreateContact,
  findUserByRepCardId,
  logActivityToContact,
} from "@/lib/integrations/repcard/webhook-utils";

export async function POST(request: NextRequest) {
  let eventId: string | null = null;
  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  try {
    const body = await request.json();
    if (!isContactPayload(body)) {
      return NextResponse.json(
        { error: "Invalid payload: expected contact (id, firstName or name)" },
        { status: 400 },
      );
    }

    const logged = await logWebhookEvent(
      "repcard",
      "door_knocked",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

    let companyId: string;
    if (body.user?.id) {
      const kinosUser = await findUserByRepCardId(body.user.id);
      if (!kinosUser) {
        await updateWebhookEventStatus(
          eventId,
          "failed",
          "KinOS user not found for repcard_user_id " + body.user.id,
        );
        return NextResponse.json(
          { error: "User not found for RepCard user id " + body.user.id },
          { status: 422 },
        );
      }
      companyId = kinosUser.company_id;
    } else {
      const { data: contact } = await supabaseAdmin
        .from("contacts")
        .select("company_id")
        .eq("repcard_customer_id", body.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!contact?.company_id) {
        await updateWebhookEventStatus(
          eventId,
          "failed",
          "Cannot determine company: no user in payload and contact not found",
        );
        return NextResponse.json(
          { error: "Cannot determine company" },
          { status: 422 },
        );
      }
      companyId = contact.company_id;
    }

    const contactResult = await findOrCreateContact(body, companyId);
    if ("error" in contactResult) {
      await updateWebhookEventStatus(eventId, "failed", contactResult.error);
      return NextResponse.json({ error: contactResult.error }, { status: 500 });
    }

    const address =
      [body.address, body.city, body.state, body.zip]
        .filter(Boolean)
        .join(", ") || "Unknown";
    await logActivityToContact(
      contactResult.contactId,
      "door_knocked",
      `Door knocked at ${address}`,
      { repcard_customer_id: body.id },
    );

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      contactResult.contactId,
      undefined,
    );

    return NextResponse.json(
      { message: "Door knock logged", contactId: contactResult.contactId },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard door-knocked]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
