import { NextResponse } from "next/server";
import {
  getEnvelopesByDeal,
  createEnvelope,
  updateEnvelopeStatus,
  sendContractPacket,
} from "@/lib/actions/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dealId } = await params;
    const { data, error } = await getEnvelopesByDeal(dealId);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();
    const { action, templateId, title, templateIds } = body as {
      action?: string;
      templateId?: string;
      title?: string;
      templateIds?: string[];
    };

    if (action === "send_packet") {
      const { data, error } = await sendContractPacket(dealId, templateIds);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      return NextResponse.json({ data });
    }

    // Default: create single envelope
    if (!templateId || !title) {
      return NextResponse.json(
        { error: "templateId and title are required" },
        { status: 400 },
      );
    }

    const { data, error } = await createEnvelope({
      dealId,
      templateId,
      title,
    });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create document" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params; // consume params
    const body = await request.json();
    const { envelopeId, status } = body as {
      envelopeId?: string;
      status?: string;
    };

    if (!envelopeId || !status) {
      return NextResponse.json(
        { error: "envelopeId and status are required" },
        { status: 400 },
      );
    }

    const { data, error } = await updateEnvelopeStatus(envelopeId, status);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update document" },
      { status: 500 },
    );
  }
}
