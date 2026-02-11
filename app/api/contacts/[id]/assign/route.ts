import { NextResponse } from "next/server";
import { assignContact } from "@/lib/actions/contacts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const body = await request.json();
    const { data, error } = await assignContact(
      id,
      body?.ownerId ?? undefined,
      body?.setterId ?? undefined,
      body?.officeId ?? undefined,
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Assign failed" },
      { status: 500 },
    );
  }
}
