import { NextResponse } from "next/server";
import { createNote } from "@/lib/actions/deals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();
    const content = body?.content as string | undefined;
    if (!dealId || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "dealId and content are required" },
        { status: 400 },
      );
    }
    const { data, error } = await createNote(dealId, content.trim());
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create note failed" },
      { status: 500 },
    );
  }
}
