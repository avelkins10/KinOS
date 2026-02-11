"use server";

import { createClient } from "@/lib/supabase/server";
import { syncRepCardUsers } from "@/lib/integrations/repcard/sync-users";

export interface RepCardSyncStatus {
  entity_type: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  metadata: Record<string, unknown> | null;
}

export interface RepCardActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function triggerUserSync(): Promise<
  RepCardActionResult<{ status: string }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return { success: false, error: "Not authenticated" };
    }
    const { data: profile } = await supabase
      .from("users")
      .select("id, company_id")
      .eq("auth_id", authUser.id)
      .single();
    if (!profile?.company_id) {
      return { success: false, error: "User company not found" };
    }
    const result = await syncRepCardUsers(profile.company_id);
    return {
      success: true,
      data: { status: result.status },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function getRepCardSyncStatus(
  companyId: string,
): Promise<RepCardActionResult<RepCardSyncStatus | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("repcard_sync_state")
      .select("entity_type, last_sync_at, last_sync_status, metadata")
      .eq("company_id", companyId)
      .eq("entity_type", "users")
      .maybeSingle();
    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: data
        ? {
            entity_type: data.entity_type,
            last_sync_at: data.last_sync_at,
            last_sync_status: data.last_sync_status,
            metadata: data.metadata as Record<string, unknown> | null,
          }
        : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function linkUserToRepCard(
  userId: string,
  repCardUserId: number,
): Promise<RepCardActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({ repcard_user_id: repCardUserId })
      .eq("id", userId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function unlinkUserFromRepCard(
  userId: string,
): Promise<RepCardActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({ repcard_user_id: null })
      .eq("id", userId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
