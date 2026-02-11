import { NextResponse } from "next/server";
import { deleteAttachment, getSignedUrl } from "@/lib/actions/attachments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const expiry = parseInt(searchParams.get("expiry") ?? "3600", 10);
    const { data, error } = await getSignedUrl(id, expiry);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (!data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ url: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
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
    const { success, error } = await deleteAttachment(id);
    if (!success) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
