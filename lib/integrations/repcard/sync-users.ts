/**
 * RepCard user synchronization service.
 * Syncs RepCard users (reps) into KinOS users table.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { repCardClient } from "./client";
import { logRepCardEvent, logRepCardError } from "./logger";
import type { RepCardUserMinimal } from "./types";

export interface SyncUsersResult {
  users_synced: number;
  users_updated: number;
  users_skipped: number;
  status: "success" | "partial";
  error?: string;
}

/** Resolve RepCard company identifier for a KinOS company (from settings or env). */
async function getRepCardCompanyId(companyId: string): Promise<string> {
  const { data: company, error } = await supabaseAdmin
    .from("companies")
    .select("settings")
    .eq("id", companyId)
    .single();

  if (!error && company?.settings && typeof company.settings === "object") {
    const settings = company.settings as Record<string, unknown>;
    const id = settings.repcard_company_id;
    if (id != null && String(id).trim() !== "") {
      return String(id);
    }
  }

  const envId = process.env.REPCARD_COMPANY_ID ?? "";
  if (envId.trim() !== "") return envId.trim();

  throw new Error(
    "RepCard company id not found: set companies.settings.repcard_company_id or REPCARD_COMPANY_ID",
  );
}

export async function syncRepCardUsers(
  companyId: string,
): Promise<SyncUsersResult> {
  const repCardCompanyId = await getRepCardCompanyId(companyId);

  let usersSynced = 0;
  let usersUpdated = 0;
  let usersSkipped = 0;
  let hasError = false;

  try {
    const repCardUsers = await repCardClient.getAllUsers(repCardCompanyId);
    if (!Array.isArray(repCardUsers) || repCardUsers.length === 0) {
      await upsertRepCardSyncState(companyId, 0, 0, 0, "success");
      return {
        users_synced: 0,
        users_updated: 0,
        users_skipped: 0,
        status: "success",
      };
    }

    for (const rcUser of repCardUsers as RepCardUserMinimal[]) {
      try {
        const { data: existingByRepCard } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("company_id", companyId)
          .eq("repcard_user_id", rcUser.id)
          .maybeSingle();

        if (existingByRepCard?.id) {
          await supabaseAdmin
            .from("users")
            .update({
              first_name: rcUser.firstName ?? "",
              last_name: rcUser.lastName ?? "",
              email: rcUser.email ?? "",
              phone: rcUser.phoneNumber ?? null,
              image_url: rcUser.image ?? null,
              bio: (rcUser as { bio?: string }).bio ?? null,
            })
            .eq("id", existingByRepCard.id);
          usersUpdated++;
          usersSynced++;
          continue;
        }

        const email = (rcUser.email ?? "").trim();
        if (!email) {
          usersSkipped++;
          continue;
        }

        const { data: existingByEmail } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("company_id", companyId)
          .eq("email", email)
          .maybeSingle();

        if (existingByEmail?.id) {
          await supabaseAdmin
            .from("users")
            .update({
              repcard_user_id: rcUser.id,
              first_name: rcUser.firstName ?? "",
              last_name: rcUser.lastName ?? "",
              phone: rcUser.phoneNumber ?? null,
              image_url: rcUser.image ?? null,
              bio: (rcUser as { bio?: string }).bio ?? null,
            })
            .eq("id", existingByEmail.id);
          usersUpdated++;
          usersSynced++;
        } else {
          usersSkipped++;
        }
      } catch (err) {
        hasError = true;
        logRepCardError(
          err instanceof Error ? err : new Error(String(err)),
          `sync user ${rcUser.id}`,
        );
      }
    }

    const status = hasError ? "partial" : "success";
    await upsertRepCardSyncState(
      companyId,
      usersSynced,
      usersUpdated,
      usersSkipped,
      status,
    );

    await logRepCardEvent({
      type: "user_sync",
      status,
      message: `Synced ${usersSynced} users`,
      metadata: {
        users_synced: usersSynced,
        users_updated: usersUpdated,
        users_skipped: usersSkipped,
      },
    });

    return {
      users_synced: usersSynced,
      users_updated: usersUpdated,
      users_skipped: usersSkipped,
      status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logRepCardError(
      err instanceof Error ? err : new Error(String(err)),
      "syncRepCardUsers",
    );
    await upsertRepCardSyncState(
      companyId,
      usersSynced,
      usersUpdated,
      usersSkipped,
      "partial",
      message,
    );
    throw err;
  }
}

async function upsertRepCardSyncState(
  companyId: string,
  usersSynced: number,
  usersUpdated: number,
  usersSkipped: number,
  lastSyncStatus: string,
  errorMessage?: string,
): Promise<void> {
  const metadata = {
    users_synced: usersSynced,
    users_updated: usersUpdated,
    users_skipped: usersSkipped,
  };
  const { error: upsertError } = await supabaseAdmin
    .from("repcard_sync_state")
    .upsert(
      {
        company_id: companyId,
        entity_type: "users",
        last_sync_at: new Date().toISOString(),
        last_sync_status: lastSyncStatus,
        metadata,
        ...(errorMessage && { error_count: 1 }),
      },
      { onConflict: "company_id,entity_type" },
    );
  if (upsertError) {
    console.error(
      "[RepCard] Failed to update repcard_sync_state:",
      upsertError,
    );
  }
}

export async function syncSingleUser(
  repCardUserId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userDetails = await repCardClient.getUserDetails(repCardUserId);
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, company_id")
      .eq("repcard_user_id", repCardUserId)
      .maybeSingle();

    if (!existing?.id) {
      return {
        success: false,
        error: "KinOS user not found for RepCard user " + repCardUserId,
      };
    }

    await supabaseAdmin
      .from("users")
      .update({
        first_name: userDetails.firstName ?? "",
        last_name: userDetails.lastName ?? "",
        email: userDetails.email ?? "",
        phone: userDetails.phoneNumber ?? null,
        image_url: userDetails.image ?? null,
        bio: userDetails.bio ?? null,
      })
      .eq("id", existing.id);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logRepCardError(
      err instanceof Error ? err : new Error(String(err)),
      "syncSingleUser",
    );
    return { success: false, error: message };
  }
}
