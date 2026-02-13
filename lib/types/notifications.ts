// lib/types/notifications.ts
// Notification types for in-app notification system (Epic 9)

export type NotificationType =
  | "contract_sent"
  | "contract_viewed"
  | "contract_signed"
  | "contract_all_signed"
  | "design_complete"
  | "financing_approved"
  | "financing_denied"
  | "stip_requested"
  | "deal_stage_change"
  | "deal_assigned"
  | "system";

export type NotificationChannel = "in_app" | "email" | "sms";

export interface CreateNotificationInput {
  userId: string;
  dealId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  channels?: NotificationChannel[];
}

export interface NotificationRow {
  id: string;
  user_id: string;
  deal_id: string | null;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean | null;
  read_at: string | null;
  action_url: string | null;
  created_at: string | null;
}
