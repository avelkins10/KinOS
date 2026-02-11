/**
 * Push KinOS contact to RepCard (optional contact creation in RepCard).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { repCardClient } from "./client";
import { logRepCardEvent, logRepCardError } from "./logger";

export interface PushContactResult {
  success: boolean;
  repcardCustomerId?: number;
  error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/** When false or unset, contact push is skipped (RepCard customer creation endpoint not yet documented). */
const REPCARD_CONTACT_PUSH_ENABLED =
  process.env.REPCARD_CONTACT_PUSH_ENABLED === "true";

export async function pushContactToRepCard(
  contactId: string,
): Promise<PushContactResult> {
  if (!REPCARD_CONTACT_PUSH_ENABLED) {
    return {
      success: false,
      error:
        "Contact push to RepCard is not enabled (customer creation endpoint not yet configured). Set REPCARD_CONTACT_PUSH_ENABLED=true when the endpoint is available.",
    };
  }

  const { data: contact, error: fetchError } = await supabaseAdmin
    .from("contacts")
    .select(
      "id, company_id, first_name, last_name, email, phone, address, city, state, zip, country_code, repcard_customer_id",
    )
    .eq("id", contactId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !contact) {
    const err = new Error(fetchError?.message ?? "Contact not found");
    logRepCardError(err, "pushContactToRepCard");
    return { success: false, error: err.message };
  }

  if (contact.repcard_customer_id != null) {
    return { success: true, repcardCustomerId: contact.repcard_customer_id };
  }

  const firstName = (contact.first_name ?? "").trim();
  const lastName = (contact.last_name ?? "").trim();
  if (!firstName || !lastName) {
    const err = new Error(
      "Contact missing required fields: first_name, last_name",
    );
    logRepCardEvent({
      type: "push_contact",
      status: "failed",
      message: err.message,
      metadata: { entity_type: "contact", entity_id: contactId },
    });
    return { success: false, error: err.message };
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const customer = await repCardClient.createCustomer({
        firstName,
        lastName,
        email: contact.email ?? undefined,
        phoneNumber: contact.phone ?? undefined,
        address: contact.address ?? undefined,
        city: contact.city ?? undefined,
        state: contact.state ?? undefined,
        zip: contact.zip ?? undefined,
        countryCode: contact.country_code ?? undefined,
      });

      const repcardCustomerId =
        typeof customer.id === "number" ? customer.id : Number(customer.id);
      await supabaseAdmin
        .from("contacts")
        .update({ repcard_customer_id: repcardCustomerId })
        .eq("id", contactId);

      await logRepCardEvent({
        type: "push_contact",
        status: "success",
        message: "Contact pushed to RepCard",
        metadata: { entity_type: "contact", entity_id: contactId, count: 1 },
      });

      return { success: true, repcardCustomerId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  const message = lastError?.message ?? "Failed to create customer in RepCard";
  logRepCardError(lastError ?? new Error(message), "pushContactToRepCard");
  await logRepCardEvent({
    type: "push_contact",
    status: "failed",
    message,
    metadata: { entity_type: "contact", entity_id: contactId, error: message },
  });
  return { success: false, error: message };
}
