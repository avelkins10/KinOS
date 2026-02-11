import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAttachments, createAttachment } from "@/lib/actions/attachments";
import type { AttachmentEntityType } from "@/lib/actions/attachments";

const BUCKET = "attachments";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get(
      "entityType",
    ) as AttachmentEntityType | null;
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId || !["contact", "deal"].includes(entityType)) {
      return NextResponse.json(
        { error: "entityType (contact|deal) and entityId are required" },
        { status: 400 },
      );
    }
    const { data, error } = await getAttachments(entityType, entityId);
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
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get(
      "entityType",
    ) as AttachmentEntityType | null;
    const entityId = formData.get("entityId") as string | null;
    const category = (formData.get("category") as string) || "other";
    if (
      !file ||
      !entityType ||
      !entityId ||
      !["contact", "deal"].includes(entityType)
    ) {
      return NextResponse.json(
        { error: "file, entityType (contact|deal) and entityId are required" },
        { status: 400 },
      );
    }
    const supabase = await createClient();
    const ext = file.name.split(".").pop() ?? "";
    const path = `${user.companyId}/${entityType}_${entityId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });
    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message ?? "Upload failed" },
        { status: 400 },
      );
    }
    const { data, error } = await createAttachment(
      entityType,
      entityId,
      path,
      file.name,
      file.size,
      file.type || null,
      category,
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
