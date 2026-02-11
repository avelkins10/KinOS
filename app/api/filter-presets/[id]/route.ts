import { NextResponse } from "next/server";
import { deleteFilterPreset } from "@/lib/actions/filter-presets";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { success, error } = await deleteFilterPreset(id);
    if (!success) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
