"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/database.types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

export type NoteEntityType = "contact" | "deal";

export async function getNotes(
  entityType: NoteEntityType,
  entityId: string,
): Promise<{
  data: (NoteRow & {
    author?: { id: string; first_name: string; last_name: string } | null;
  })[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    const column = entityType === "contact" ? "contact_id" : "deal_id";
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*, author:users!notes_author_id_fkey(id, first_name, last_name)")
      .eq(column, entityId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return {
      data: (notes ?? []) as (NoteRow & {
        author?: { id: string; first_name: string; last_name: string } | null;
      })[],
      error: null,
    };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch notes",
    };
  }
}

export async function createNote(
  entityType: NoteEntityType,
  entityId: string,
  content: string,
): Promise<{ data: NoteRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const insert: Database["public"]["Tables"]["notes"]["Insert"] = {
      author_id: user.userId,
      content: content.trim(),
      visibility: "team",
      updated_by: user.userId,
      ...(entityType === "contact"
        ? { contact_id: entityId, deal_id: null }
        : { deal_id: entityId, contact_id: null }),
    };

    const { data: note, error } = await supabase
      .from("notes")
      .insert(insert)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: note as NoteRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create note",
    };
  }
}

export async function updateNote(
  id: string,
  content: string,
): Promise<{ data: NoteRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("notes")
      .select("id, author_id, edit_count")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { data: null, error: "Note not found" };
    }
    const existingRow = existing as { author_id: string; edit_count?: number };
    if (existingRow.author_id !== user.userId && user.role !== "admin") {
      return {
        data: null,
        error: "Only the author or admin can edit this note",
      };
    }

    const { data: note, error } = await supabase
      .from("notes")
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
        edit_count: (existingRow.edit_count ?? 0) + 1,
        updated_by: user.userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: note as NoteRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to update note",
    };
  }
}

export async function deleteNote(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: existing } = await supabase
      .from("notes")
      .select("id, author_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!existing) {
      return { success: false, error: "Note not found" };
    }
    if (
      (existing as { author_id: string }).author_id !== user.userId &&
      user.role !== "admin"
    ) {
      return {
        success: false,
        error: "Only the author or admin can delete this note",
      };
    }

    const { error } = await supabase
      .from("notes")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.userId,
        updated_by: user.userId,
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete note",
    };
  }
}

export async function pinNote(
  id: string,
  isPinned: boolean,
): Promise<{ data: NoteRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: note, error } = await supabase
      .from("notes")
      .update({ is_pinned: isPinned, updated_by: user.userId })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: note as NoteRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to pin note",
    };
  }
}
