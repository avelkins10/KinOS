import { NextResponse } from "next/server";
import { createNote, getNotes } from "@/lib/actions/notes";
import type { NoteEntityType } from "@/lib/actions/notes";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as NoteEntityType | null;
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId || !["contact", "deal"].includes(entityType)) {
      return NextResponse.json(
        { error: "entityType (contact|deal) and entityId are required" },
        { status: 400 },
      );
    }
    const { data, error } = await getNotes(entityType, entityId);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entityType = body?.entityType as NoteEntityType | undefined;
    const entityId = body?.entityId as string | undefined;
    const content = body?.content as string | undefined;
    if (
      !entityType ||
      !entityId ||
      !["contact", "deal"].includes(entityType) ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: "entityType, entityId and content are required" },
        { status: 400 },
      );
    }
    const { data, error } = await createNote(
      entityType,
      entityId,
      content.trim(),
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
