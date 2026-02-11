import { NextRequest, NextResponse } from "next/server";
import {
  isAppointmentPayload,
  type RepCardAppointmentPayload,
} from "@/lib/integrations/repcard/webhook-types";
import type { RepCardWebhookPayload } from "@/lib/integrations/repcard/types";
import { handleAppointmentSet } from "@/app/api/webhooks/repcard/appointment-set/route";

function isCreateLeadPayload(body: unknown): body is RepCardWebhookPayload {
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

/**
 * Build a synthetic appointment-set payload from create-lead (customers + user)
 * so the same handler can upsert contact, create appointment, set deal.active_appointment_id.
 * Synthetic id is unique per customer+user for idempotent duplicate deliveries.
 */
function buildAppointmentPayloadFromCreateLead(
  body: RepCardWebhookPayload,
): RepCardAppointmentPayload {
  const { customers, user } = body;
  const syntheticId = customers.id * 1_000_000 + user.id;
  return {
    id: syntheticId,
    contact: {
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phoneNumber: customers.phoneNumber,
      fullPhoneNumber: customers.fullPhoneNumber,
      address: customers.address ?? null,
      address2: customers.address2 ?? null,
      city: customers.city ?? null,
      state: customers.state ?? null,
      zip: customers.zip ?? null,
      typeId: customers.type,
      statusId: customers.statusId,
    },
    closer: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
}

/**
 * Create-lead webhook: alias for appointment-set. Existing RepCard webhooks that
 * POST to /api/webhooks/repcard continue to work. If payload is already
 * appointment-set shape, delegate as-is. If payload is create-lead (customers + user),
 * build synthetic appointment payload and delegate so we upsert contact, create
 * appointment, set deal.active_appointment_id, and persist attachments.
 */
export async function POST(request: NextRequest) {
  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  try {
    const body = await request.json();

    if (isAppointmentPayload(body)) {
      return handleAppointmentSet(body, headersObj);
    }

    if (isCreateLeadPayload(body)) {
      const synthetic = buildAppointmentPayloadFromCreateLead(body);
      return handleAppointmentSet(synthetic, headersObj);
    }

    return NextResponse.json(
      {
        error:
          "Invalid payload: expected appointment (id, closer, contact, user) or create-lead (customers, user)",
      },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[RepCard webhook]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
