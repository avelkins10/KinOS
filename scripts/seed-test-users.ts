/**
 * Epic 1 test user seed: creates 3 Supabase Auth users and corresponding
 * public.users rows (admin, closer, manager). Run after migrations 001–003.
 *
 * Usage: pnpm exec tsx scripts/seed-test-users.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local)
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if present
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COMPANY_ID = "a0000001-0001-4000-8000-000000000001";
const OFFICE_ID = "a0000002-0002-4000-8000-000000000002";
const ROLE_ADMIN = "a0000003-0003-4000-8000-000000000003";
const ROLE_CLOSER = "a0000004-0004-4000-8000-000000000004";
const ROLE_MANAGER = "a0000005-0005-4000-8000-000000000005";

const TEST_USERS = [
  {
    email: "admin@kinos.test",
    password: "TestAdmin123!",
    firstName: "Test",
    lastName: "Admin",
    roleId: ROLE_ADMIN,
  },
  {
    email: "closer@kinos.test",
    password: "TestCloser123!",
    firstName: "Test",
    lastName: "Closer",
    roleId: ROLE_CLOSER,
  },
  {
    email: "manager@kinos.test",
    password: "TestManager123!",
    firstName: "Test",
    lastName: "Manager",
    roleId: ROLE_MANAGER,
  },
] as const;

async function main() {
  for (const u of TEST_USERS) {
    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log(
          `Auth user ${u.email} already exists, skipping Auth create`,
        );
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((x) => x.email === u.email);
        if (existing) {
          await upsertUserRow(admin, existing.id, u, COMPANY_ID, OFFICE_ID);
        }
        continue;
      }
      console.error(`Auth create failed for ${u.email}:`, authError.message);
      continue;
    }

    if (authUser.user?.id) {
      await upsertUserRow(admin, authUser.user.id, u, COMPANY_ID, OFFICE_ID);
      console.log(`Created Auth + users row: ${u.email}`);
    }
  }
  console.log(
    "Seed complete. Credentials: admin@kinos.test / TestAdmin123!, closer@kinos.test / TestCloser123!, manager@kinos.test / TestManager123!",
  );
}

async function upsertUserRow(
  client: ReturnType<typeof createClient<Database>>,
  authId: string,
  u: (typeof TEST_USERS)[number],
  companyId: string,
  officeId: string,
) {
  const { error } = await client.from("users").upsert(
    {
      auth_id: authId,
      company_id: companyId,
      role_id: u.roleId,
      office_id: officeId,
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
      status: "active",
    },
    { onConflict: "auth_id" },
  );
  if (error)
    console.error(`users upsert failed for ${u.email}:`, error.message);
}

main();
