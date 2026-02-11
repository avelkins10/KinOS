import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isContactPayload } from "@/lib/integrations/repcard/webhook-types";
import {
  logWebhookEvent,
  updateWebhookEventStatus,
  normalizeRepCardContactType,
  mapContactTypeToKinOS,
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
      "contact_type_changed",
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
      .select("id, company_id, contact_type")
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

    const normalizedTypeId = normalizeRepCardContactType({
      typeId: body.typeId,
      type: body.type,
    });
    const newType = mapContactTypeToKinOS(normalizedTypeId);
    const oldType = contact.contact_type ?? "";

    await supabaseAdmin
      .from("contacts")
      .update({ contact_type: newType })
      .eq("id", contact.id);

    await insertContactChangeHistory(
      contact.id,
      "contact_type",
      oldType || null,
      newType || null,
      "repcard_webhook",
    );

    const hasDealFields =
      typeof body.system_size_kw === "number" ||
      typeof body.net_price === "number" ||
      typeof body.gross_price === "number";
    if (hasDealFields) {
      const { data: latestDeal } = await supabaseAdmin
        .from("deals")
        .select("id")
        .eq("contact_id", contact.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestDeal) {
        const dealUpdate: Record<string, unknown> = {};
        if (typeof body.system_size_kw === "number")
          dealUpdate.system_size_kw = body.system_size_kw;
        if (typeof body.net_price === "number")
          dealUpdate.net_price = body.net_price;
        if (typeof body.gross_price === "number")
          dealUpdate.gross_price = body.gross_price;
        if (typeof body.gross_ppw === "number")
          dealUpdate.gross_ppw = body.gross_ppw;
        if (typeof body.net_ppw === "number") dealUpdate.net_ppw = body.net_ppw;
        if (Object.keys(dealUpdate).length > 0) {
          await supabaseAdmin
            .from("deals")
            .update(dealUpdate as never)
            .eq("id", latestDeal.id);
        }
      }
    }

    await logActivityToContact(
      contact.id,
      "contact_type_changed",
      `Contact type changed to ${newType}`,
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
      { message: "Contact type updated", contactId: contact.id },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await updateWebhookEventStatus(eventId, "failed", message);
    }
    console.error("[RepCard contact-type-changed]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
