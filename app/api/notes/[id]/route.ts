import { NextResponse } from "next/server";
import { updateNote, deleteNote, pinNote } from "@/lib/actions/notes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const body = await request.json();
    if (typeof body?.isPinned === "boolean") {
      const { data, error } = await pinNote(id, body.isPinned);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json(data);
    }
    const content = body?.content as string | undefined;
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "content or isPinned required" },
        { status: 400 },
      );
    }
    const { data, error } = await updateNote(id, content.trim());
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { success, error } = await deleteNote(id);
    if (!success) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
