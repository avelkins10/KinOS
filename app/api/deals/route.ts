import { NextResponse } from "next/server";
import { createDeal } from "@/lib/actions/deals";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactId = body?.contactId as string | undefined;
    if (!contactId?.trim()) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 },
      );
    }
    const { data, error } = await createDeal({
      contactId: contactId.trim(),
      closerId: body?.closerId ?? undefined,
      setterId: body?.setterId ?? undefined,
      officeId: body?.officeId ?? undefined,
      source: body?.source ?? "Manual",
      stage: body?.stage,
    });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
