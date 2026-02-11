# KinOS — Solar CRM for KIN Home

## What This Project Is
KinOS is an internal CRM replacing Enerflo for KIN Home's solar sales operations.
Built with Next.js 16 (App Router), Supabase (Postgres + Auth + RLS), deployed on Vercel.
Epics 0–5 are complete. Epic 6 (Aurora Solar integration) is next.

## Critical Documentation
ALWAYS read these files before making architectural decisions:
- `/docs/PROJECT-KNOWLEDGE.md` — Master knowledge base (schema, data flows, APIs, decisions)
- `/docs/db-audit.md` — Live database inventory (47 tables + 2 views, verified 2026-02-11)
- `/docs/blueprint.md` — Full system architecture (reference, may lag behind actual state)

## Tech Stack
- **Framework:** Next.js 16 with App Router (NOT Pages Router). Middleware file is `proxy.ts` not `middleware.ts`.
- **Database:** Supabase (Postgres) with Row Level Security. 47 tables + 2 views live.
- **Auth:** Supabase Auth (email/password). No self-registration. Admin creates accounts.
- **Styling:** Tailwind CSS + shadcn/ui components
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm
- **Deployment:** Vercel at kin-os-one.vercel.app (auto-deploys from main branch)

## Database Access Patterns
- **Browser/Client components:** Use `lib/supabase/client.ts` (anon key, respects RLS)
- **Server components/actions:** Use `lib/supabase/server.ts` (cookie-based auth, respects RLS)
- **Webhooks/API routes:** Use `lib/supabase/admin.ts` (service role, bypasses RLS)
- NEVER use the service role client in client components
- NEVER expose the service role key to the browser

## Pipeline Stages (19 stages — blueprint §9)
```
new_lead → appointment_set → appointment_sat → design_requested →
design_complete → proposal_sent → proposal_accepted → financing_applied →
financing_approved → stips_pending → stips_cleared → contract_sent →
contract_signed → submission_ready → submitted → intake_approved
                                                → intake_rejected
Also: cancelled, lost
```
Stage constants are in `lib/constants/pipeline.ts`. Do NOT add, remove, or rename stages without explicit instruction.

## Key Architecture Rules
- All data is company-isolated via RLS policies using `company_id`
- Soft deletes everywhere (`deleted_at` column, never hard delete)
- Major tables have `created_at`, `updated_at`, `updated_by`
- Deal stage transitions auto-logged by Postgres trigger to `deal_stage_history`
- Contact field changes auto-logged by Postgres trigger to `contact_change_history`
- Deal numbers auto-generate as `KIN-{YEAR}-{SEQ}` via Postgres trigger

## Code Conventions
- API routes go in `app/api/` — webhooks, CRUD endpoints
- Use server components by default, `"use client"` only when needed
- Error handling: always try/catch Supabase calls, return typed results
- No `any` types — use generated Supabase types from `lib/supabase/database.types.ts`
- Webhook handlers: always use `supabaseAdmin`, log to `webhook_events`, return 200 quickly

## POST-IMPLEMENTATION DOCUMENTATION REQUIREMENTS

After completing ANY task that changes the database schema, adds/removes API routes,
adds/removes tables, or changes the deal pipeline, you MUST update the relevant
documentation files before marking the task complete.

1. **New migration or schema change** → Update `docs/PROJECT-KNOWLEDGE.md` section 3 + `docs/db-audit.md`
2. **New API route or webhook** → Update `docs/PROJECT-KNOWLEDGE.md` section 4 (App Routes)
3. **New page or UI route** → Update `docs/PROJECT-KNOWLEDGE.md` section 4 (App Routes)
4. **Epic completed** → Update `docs/PROJECT-KNOWLEDGE.md` section 9 (Epic Status)
5. **Architecture decision** → Update section 10 (Key Architecture Decisions)

Commit doc updates in the SAME commit as the code changes.
