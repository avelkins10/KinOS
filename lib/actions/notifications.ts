"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import type { CreateNotificationInput, NotificationRow } from "@/lib/types/notifications";

/**
 * Emit a single in-app notification.
 * Accepts a `channels` parameter (defaults to ["in_app"]).
 * For v1, only "in_app" is processed. Future: dispatch to Twilio/SendGrid.
 */
export async function emitNotification(
  input: CreateNotificationInput,
): Promise<{ data: NotificationRow | null; error: string | null }> {
  try {
    const channels = input.channels ?? ["in_app"];

    // v1: only process in_app channel
    if (!channels.includes("in_app")) {
      return { data: null, error: null };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        deal_id: input.dealId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        action_url: input.actionUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as NotificationRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to emit notification",
    };
  }
}

/**
 * Emit a notification to all users with a given role in a company.
 * Uses supabase server client (cookie-based auth, respects RLS).
 */
export async function emitNotificationToRole(params: {
  companyId: string;
  role: string;
  dealId?: string;
  type: CreateNotificationInput["type"];
  title: string;
  message: string;
  actionUrl?: string;
}): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = await createClient();

    // Find all users with the given role in this company
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, roles!inner(category)")
      .eq("company_id", params.companyId)
      .eq("roles.category", params.role)
      .is("deleted_at", null);

    if (usersError) {
      return { count: 0, error: usersError.message };
    }

    if (!users || users.length === 0) {
      return { count: 0, error: null };
    }

    const rows = users.map((u) => ({
      user_id: u.id,
      deal_id: params.dealId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl ?? null,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(rows);

    if (insertError) {
      return { count: 0, error: insertError.message };
    }

    return { count: rows.length, error: null };
  } catch (e) {
    return {
      count: 0,
      error: e instanceof Error ? e.message : "Failed to emit notifications to role",
    };
  }
}

/**
 * Fetch current user's notifications, ordered by created_at desc.
 */
export async function getMyNotifications(
  limit = 20,
): Promise<{ data: NotificationRow[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) {
      return { data: [], error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as NotificationRow[], error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Failed to fetch notifications",
    };
  }
}

/**
 * Count unread notifications for the current user.
 */
export async function getUnreadCount(): Promise<{
  count: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) {
      return { count: 0, error: "Unauthorized" };
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("is_read", false);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count ?? 0, error: null };
  } catch (e) {
    return {
      count: 0,
      error: e instanceof Error ? e.message : "Failed to fetch unread count",
    };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  notificationId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to mark as read",
    };
  }
}

/**
 * Mark all unread notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.userId) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.userId)
      .eq("is_read", false);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to mark all as read",
    };
  }
}
