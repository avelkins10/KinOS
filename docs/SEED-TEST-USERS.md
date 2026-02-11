# Epic 1 Test User Seeding

This document describes how to create the required test users (1 admin, 1 closer, 1 manager) in Supabase Auth and the `users` table so that RLS and the app work as expected.

## Prerequisites

- Run `docs/kinos-migration-v1.sql` and `docs/migrations/002_add_get_user_company_id.sql`
- Run `docs/migrations/003_seed_test_data.sql` to create the test company, office, and roles

## Test User Credentials

| Role    | Email              | Password        | Purpose                    |
| ------- | ------------------ | --------------- | -------------------------- |
| Admin   | admin@kinos.test   | TestAdmin123!   | Full access, Admin section |
| Closer  | closer@kinos.test  | TestCloser123!  | Closer role, own deals     |
| Manager | manager@kinos.test | TestManager123! | Office manager, role-gated |

**Security:** Use these only in local/dev. Never in production. RLS expects `app_metadata` to contain `user_id`, `company_id`, `office_id`, and `role_category`; the sign-in action populates these after login.

---

## Option A: Seed script (recommended)

From the project root, with `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
pnpm exec tsx scripts/seed-test-users.ts
```

If `tsx` is not installed: `pnpm add -D tsx`

The script will:

1. Ensure the test company, office, and roles exist (from migration 003)
2. Create three users in Supabase Auth with the emails/passwords above
3. Insert three rows into `public.users` with the correct `auth_id`, `company_id`, `office_id`, and `role_id`

After running, log in with any of the three accounts; `app_metadata` will be set on first sign-in so RLS policies work.

---

## Option B: Manual (Supabase Dashboard + SQL)

### Step 1: Create users in Supabase Auth

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Create each user:

   | Email              | Password        |
   | ------------------ | --------------- |
   | admin@kinos.test   | TestAdmin123!   |
   | closer@kinos.test  | TestCloser123!  |
   | manager@kinos.test | TestManager123! |

4. Copy each user’s **UUID** (Auth UID) for the next step.

### Step 2: Insert into `users` table

In **SQL Editor**, run the following, replacing `AUTH_UUID_ADMIN`, `AUTH_UUID_CLOSER`, and `AUTH_UUID_MANAGER` with the UUIDs from Step 1:

```sql
-- Replace the three UUIDs with the Auth user IDs from Dashboard → Auth → Users
INSERT INTO users (
  auth_id, company_id, role_id, office_id,
  first_name, last_name, email, status
) VALUES
  (
    'AUTH_UUID_ADMIN',
    'a0000001-0001-4000-8000-000000000001',
    'a0000003-0003-4000-8000-000000000003',
    'a0000002-0002-4000-8000-000000000002',
    'Test', 'Admin', 'admin@kinos.test', 'active'
  ),
  (
    'AUTH_UUID_CLOSER',
    'a0000001-0001-4000-8000-000000000001',
    'a0000004-0004-4000-8000-000000000004',
    'a0000002-0002-4000-8000-000000000002',
    'Test', 'Closer', 'closer@kinos.test', 'active'
  ),
  (
    'AUTH_UUID_MANAGER',
    'a0000001-0001-4000-8000-000000000001',
    'a0000005-0005-4000-8000-000000000005',
    'a0000002-0002-4000-8000-000000000002',
    'Test', 'Manager', 'manager@kinos.test', 'active'
  )
ON CONFLICT (auth_id) DO NOTHING;
```

### Step 3: Verify

Log in with each account. On first sign-in, `lib/actions/auth.ts` will set JWT `app_metadata` (user_id, company_id, office_id, role_category), which RLS policies use. Sidebar and Admin visibility should match each role.
