/**
 * Centralized logging for RepCard integration.
 * Writes to integration_sync_log table.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

const TARGET = "RepCard";

export interface RepCardLogEvent {
  type: string;
  status: string;
  message: string;
  metadata?: {
    count?: number;
    error?: string;
    entity_id?: string;
    entity_type?: string;
    [key: string]: unknown;
  };
}

export async function logRepCardEvent(event: RepCardLogEvent): Promise<void> {
  try {
    await supabaseAdmin.from("integration_sync_log").insert({
      target: TARGET,
      action: event.type,
      status: event.status,
      error_message: event.metadata?.error ?? null,
      entity_type: event.metadata?.entity_type ?? null,
      entity_id: event.metadata?.entity_id ?? null,
      request_payload: event.metadata
        ? {
            message: event.message,
            ...event.metadata,
          }
        : { message: event.message },
      response_payload:
        event.metadata?.count != null
          ? { records_processed: event.metadata.count }
          : null,
    });
  } catch (err) {
    console.error("[RepCard] Failed to log event:", err);
  }
}

export function logRepCardError(error: Error, context: string): void {
  const message = `${context}: ${error.message}`;
  console.error(`[RepCard] ${message}`, error);
  logRepCardEvent({
    type: "error",
    status: "failed",
    message,
    metadata: {
      error: error.message,
      stack: error.stack,
      context,
    },
  }).catch(() => {});
}
