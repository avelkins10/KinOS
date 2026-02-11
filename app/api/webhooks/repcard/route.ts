import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { RepCardWebhookPayload } from "@/lib/integrations/repcard/types";

type WebhookEventsInsert =
  Database["public"]["Tables"]["webhook_events"]["Insert"];
type ContactsInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type ContactsRow = Database["public"]["Tables"]["contacts"]["Row"];
type DealsInsert = Database["public"]["Tables"]["deals"]["Insert"];

function isValidPayload(body: unknown): body is RepCardWebhookPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const customers = b.customers as Record<string, unknown> | undefined;
  const user = b.user as Record<string, unknown> | undefined;
  return (
    !!customers &&
    typeof customers.id === "number" &&
    typeof customers.firstName === "string" &&
    typeof customers.lastName === "string" &&
    !!user &&
    typeof user.id === "number"
  );
}

export async function POST(request: NextRequest) {
  let eventId: string | null = null;
  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  try {
    const body = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid payload: missing customers.id, customers.firstName, customers.lastName, or user.id",
        },
        { status: 400 },
      );
    }

    const { customers, user } = body;

    const eventInsert: WebhookEventsInsert = {
      source: "repcard",
      event_type: "lead_created",
      payload:
        body as unknown as Database["public"]["Tables"]["webhook_events"]["Row"]["payload"],
      headers: headersObj,
      status: "pending",
      retry_count: 0,
    };
    const { data: event, error: eventInsertError } = await supabaseAdmin
      .from("webhook_events")
      .insert(eventInsert)
      .select("id")
      .single();

    if (eventInsertError || !event?.id) {
      console.error("[RepCard webhook] Failed to log event:", eventInsertError);
      return NextResponse.json(
        { error: "Failed to log webhook event" },
        { status: 500 },
      );
    }
    eventId = event.id;

    const { data: kinosUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, company_id, office_id")
      .eq("repcard_user_id", user.id)
      .maybeSingle();

    if (userError || !kinosUser) {
      await supabaseAdmin
        .from("webhook_events")
        .update({
          status: "failed",
          error_message: "KinOS user not found for repcard_user_id " + user.id,
          retry_count: 1,
        })
        .eq("id", eventId);
      return NextResponse.json(
        { error: "User not found for RepCard user id " + user.id },
        { status: 422 },
      );
    }

    const companyId = kinosUser.company_id;
    const officeId = kinosUser.office_id ?? null;

    let contactId: string;
    const { data: existingByRepCard } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("company_id", companyId)
      .eq("repcard_customer_id", customers.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingByRepCard?.id) {
      contactId = existingByRepCard.id;
      const updatePayload: Partial<ContactsRow> = {
        first_name: customers.firstName ?? "",
        last_name: customers.lastName ?? "",
        email: customers.email ?? null,
        phone: customers.fullPhoneNumber ?? customers.phoneNumber ?? null,
        country_code: customers.countryCode ?? null,
        address: customers.address ?? null,
        city: customers.city ?? null,
        state: customers.state ?? null,
        zip: customers.zip ?? null,
        contact_source: "RepCard",
        contact_type: customers.type != null ? String(customers.type) : null,
        repcard_status_id: customers.statusId ?? null,
      };
      await supabaseAdmin
        .from("contacts")
        .update(updatePayload)
        .eq("id", contactId);
    } else {
      const phone = customers.fullPhoneNumber ?? customers.phoneNumber ?? null;
      const email = customers.email ?? null;
      let existingByPhoneEmail: { id: string } | null = null;
      if (phone || email) {
        const conditions: string[] = [];
        if (email) conditions.push(`email.eq.${email}`);
        if (phone) conditions.push(`phone.eq.${phone}`);
        const { data: match } = await supabaseAdmin
          .from("contacts")
          .select("id")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .or(conditions.join(","))
          .maybeSingle();
        existingByPhoneEmail = match;
      }

      if (existingByPhoneEmail?.id) {
        contactId = existingByPhoneEmail.id;
        await supabaseAdmin
          .from("contacts")
          .update({
            repcard_customer_id: customers.id,
            first_name: customers.firstName ?? "",
            last_name: customers.lastName ?? "",
            email: email,
            phone: phone,
            country_code: customers.countryCode ?? null,
            address: customers.address ?? null,
            city: customers.city ?? null,
            state: customers.state ?? null,
            zip: customers.zip ?? null,
            contact_source: "RepCard",
            contact_type:
              customers.type != null ? String(customers.type) : null,
            repcard_status_id: customers.statusId ?? null,
          })
          .eq("id", contactId);
      } else {
        const insertContact: ContactsInsert = {
          company_id: companyId,
          first_name: customers.firstName ?? "",
          last_name: customers.lastName ?? "",
          email: email ?? null,
          phone: phone ?? null,
          country_code: customers.countryCode ?? null,
          address: customers.address ?? null,
          city: customers.city ?? null,
          state: customers.state ?? null,
          zip: customers.zip ?? null,
          contact_source: "RepCard",
          contact_type: customers.type != null ? String(customers.type) : null,
          repcard_customer_id: customers.id,
          repcard_status_id: customers.statusId ?? null,
        };
        const { data: newContact, error: contactInsertError } =
          await supabaseAdmin
            .from("contacts")
            .insert(insertContact)
            .select("id")
            .single();
        if (contactInsertError || !newContact?.id) {
          await supabaseAdmin
            .from("webhook_events")
            .update({
              status: "failed",
              error_message:
                contactInsertError?.message ?? "Failed to create contact",
              retry_count: 1,
            })
            .eq("id", eventId);
          return NextResponse.json(
            {
              error: contactInsertError?.message ?? "Failed to create contact",
            },
            { status: 500 },
          );
        }
        contactId = newContact.id;
      }
    }

    const dealInsert: DealsInsert = {
      company_id: companyId,
      contact_id: contactId,
      deal_number: "",
      stage: "new_lead",
      source: "RepCard",
      closer_id: kinosUser.id,
      office_id: officeId,
    };
    const { data: newDeal, error: dealInsertError } = await supabaseAdmin
      .from("deals")
      .insert(dealInsert)
      .select("id")
      .single();

    if (dealInsertError || !newDeal?.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({
          status: "failed",
          error_message: dealInsertError?.message ?? "Failed to create deal",
          retry_count: 1,
        })
        .eq("id", eventId);
      return NextResponse.json(
        { error: dealInsertError?.message ?? "Failed to create deal" },
        { status: 500 },
      );
    }

    await supabaseAdmin
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        related_contact_id: contactId,
        related_deal_id: newDeal.id,
      })
      .eq("id", eventId);

    return NextResponse.json(
      { message: "Lead created", contactId, dealId: newDeal.id },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (eventId) {
      await supabaseAdmin
        .from("webhook_events")
        .update({
          status: "failed",
          error_message: message,
          retry_count: 1,
        })
        .eq("id", eventId);
    }
    console.error("[RepCard webhook]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
