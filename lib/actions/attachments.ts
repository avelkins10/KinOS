"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/database.types";

type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

export type AttachmentEntityType = "contact" | "deal";

const BUCKET = "attachments";

export async function getAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<{ data: AttachmentRow[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    const column = entityType === "contact" ? "contact_id" : "deal_id";
    const { data: attachments, error } = await supabase
      .from("attachments")
      .select("*")
      .eq(column, entityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (attachments ?? []) as AttachmentRow[], error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch attachments",
    };
  }
}

export async function createAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  filePath: string,
  fileName: string,
  fileSize: number | null,
  mimeType: string | null,
  category?: string | null,
): Promise<{ data: AttachmentRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const insert: Database["public"]["Tables"]["attachments"]["Insert"] = {
      file_name: fileName,
      file_url: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      category: category ?? "other",
      uploaded_by: user.userId,
      ...(entityType === "contact"
        ? { contact_id: entityId, deal_id: null }
        : { deal_id: entityId, contact_id: null }),
    };

    const { data: attachment, error } = await supabase
      .from("attachments")
      .insert(insert)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: attachment as AttachmentRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create attachment",
    };
  }
}

export async function deleteAttachment(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("attachments")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { success: false, error: "Attachment not found" };
    }

    const { error } = await supabase
      .from("attachments")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.userId,
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete attachment",
    };
  }
}

export async function getSignedUrl(
  id: string,
  expirySeconds = 3600,
): Promise<{ data: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("file_url")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !attachment?.file_url) {
      return {
        data: null,
        error: fetchError?.message ?? "Attachment not found",
      };
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(attachment.file_url, expirySeconds);

    if (signError) return { data: null, error: signError.message };
    return { data: signed?.signedUrl ?? null, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get signed URL",
    };
  }
}
