import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isContactPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  insertContactChangeHistory,
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
      "status_changed",
      body,
      headersObj,
      "processing",
    );
    if ("error" in logged) {
      return NextResponse.json({ error: logged.error }, { status: 500 });
    }
    eventId = logged.eventId;

    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("id, company_id, repcard_status")
      .eq("repcard_customer_id", body.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!contact) {
      await updateWebhookEventStatus(
        eventId,
        "failed",
        "Contact not found for repcard_customer_id " + body.id,
      );
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const newStatus = body.status ?? "";
    const oldStatus = contact.repcard_status ?? "";

    await supabaseAdmin
      .from("contacts")
      .update({ repcard_status: newStatus })
      .eq("id", contact.id);

    await insertContactChangeHistory(
      contact.id,
      "repcard_status",
      oldStatus || null,
      newStatus || null,
      "repcard_webhook",
    );

    await logActivityToContact(
      contact.id,
      "contact_status_changed",
      `RepCard status changed to ${newStatus}`,
      { repcard_customer_id: body.id },
    );

    await updateWebhookEventStatus(
      eventId,
      "processed",
      undefined,
      new Date().toISOString(),
      contact.id,
      undefined,
    );

    return NextResponse.json(
      { message: "Status updated", contactId: contact.id },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard status-changed]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
