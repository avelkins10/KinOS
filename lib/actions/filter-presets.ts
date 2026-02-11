"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  entity_type: string;
  created_at: string | null;
}

export interface FilterPresetRow {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  entity_type: string;
  created_at: string | null;
}

export async function getFilterPresets(
  entityType: string,
): Promise<{ data: FilterPreset[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: [], error: "Unauthorized" };
    }

    const { data: rows, error } = await supabase
      .from("filter_presets")
      .select("id, name, filters, entity_type, created_at")
      .eq("user_id", user.userId)
      .eq("entity_type", entityType)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    const list = (rows ?? []).map(
      (r: {
        id: string;
        name: string;
        filters: Record<string, unknown>;
        entity_type: string;
        created_at: string | null;
      }) => ({
        id: r.id,
        name: r.name,
        filters: r.filters ?? {},
        entity_type: r.entity_type,
        created_at: r.created_at,
      }),
    );
    return { data: list, error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch presets",
    };
  }
}

export async function saveFilterPreset(
  name: string,
  filters: Record<string, unknown>,
  entityType: string,
): Promise<{ data: FilterPresetRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const insert = {
      user_id: user.userId,
      name: name.trim(),
      filters,
      entity_type: entityType,
    };

    const { data: row, error } = await supabase
      .from("filter_presets")
      .insert(insert)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: row as FilterPresetRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to save preset",
    };
  }
}

export async function deleteFilterPreset(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId || !user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("filter_presets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete preset",
    };
  }
}
