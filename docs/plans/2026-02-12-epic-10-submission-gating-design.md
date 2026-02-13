# Epic 10: Submission & Gating Engine — Design

> Last updated: 2026-02-12

## Overview

Epic 10 wires the submission workflow end-to-end: a configurable gate engine evaluates deal readiness, assembles a submission payload, creates a frozen deal snapshot, and pushes through an adapter to Quickbase (stubbed for now). The existing `gate_definitions`, `gate_completions`, and UI components (`submission-step.tsx`, `project-submission-step.tsx`) become DB-driven instead of hardcoded/mock.

## Decisions Made

- **Quickbase integration is stubbed.** `ManualSubmissionProvider` (no-op adapter). Real QB wiring happens when we design the KinOS-specific QB table — not reusing Enerflo's integration table.
- **Resubmission is free.** Closer fixes issues and resubmits without manager re-approval. New snapshot per attempt.
- **Server actions, not API routes.** Consistent with the rest of KinOS.
- **Gate seed data from blueprint §10.2** — source of truth, not the hardcoded UI list.
- **Clean slate for gates.** DELETE all 11 existing gate_definitions (they were scaffolding — pipeline stage machine already enforces deal progression). INSERT 13 blueprint gates fresh. Zero gate_completions exist, so no data loss.
- **Migration 016.**

## Gate Engine

### Gate Types (from blueprint §10.2)

8 gate types, matching the `gate_definitions.gate_type` check constraint:

| Type               | Evaluation                                                                | Config Shape                                                                          |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `document_signed`  | Auto — checks if all document envelopes with matching template are signed | `{ template_key: string }`                                                            |
| `file_uploaded`    | Auto — checks if attachment with matching category exists for deal        | `{ file_type: string, accepted_formats?: string[] }`                                  |
| `financing_status` | Auto — checks deal's financing application status                         | `{ required_status: string[] }`                                                       |
| `stage_reached`    | Auto — checks if deal has reached a certain stage                         | `{ stage: string }`                                                                   |
| `field_required`   | Auto — checks if a specific deal field has a value                        | `{ field_name: string }`                                                              |
| `checkbox`         | Manual — closer/manager clicks to confirm                                 | `{ label: string }`                                                                   |
| `question`         | Manual — closer provides an answer (text, select, boolean)                | `{ question: string, answer_type: "text"\|"select"\|"boolean", options?: string[] }`  |
| `external_status`  | External — status from external system, with checkbox fallback            | `{ system: string, label: string, required_status?: string[], fallback: "checkbox" }` |

### Auto-Evaluation

`evaluateGates(dealId)` runs on page load and can be triggered on demand:

- For each auto gate type (`document_signed`, `file_uploaded`, `financing_status`, `stage_reached`, `field_required`), check deal state against `conditions` JSONB
- If condition passes and no completion exists, auto-create one in `gate_completions`
- If condition no longer passes (e.g., contract got voided), mark completion as incomplete
- `external_status` gates fall back to `checkbox` behavior until the external integration is built
- `checkbox` and `question` gates are never auto-evaluated — user must interact

### 13 Pre-Intake Checklist Gates (from blueprint §10.2)

**Clean slate:** All 11 existing gates are deleted (pipeline stage machine already enforces deal progression — a deal can't reach `submission_ready` without passing through `design_complete`, `financing_approved`, `contract_signed`, etc.). These 13 are the things the pipeline **can't** enforce automatically.

All gates: `required_for_stage = submission_ready`, `is_required = true`, `is_active = true`.

| #   | Name                              | `gate_type`        | `conditions` JSONB                                                                                                                                                     |
| --- | --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Install Agreement Signed          | `document_signed`  | `{"template_key":"install_agreement"}`                                                                                                                                 |
| 2   | Loan/Lender Docs Signed           | `financing_status` | `{"required_status":["approved","stips_cleared"]}`                                                                                                                     |
| 3   | Utility Bill Uploaded             | `file_uploaded`    | `{"file_type":"utility_bill"}`                                                                                                                                         |
| 4   | CallPilot Welcome Call Completed  | `checkbox`         | `{"label":"CallPilot welcome call completed"}`                                                                                                                         |
| 5   | Site Survey Scheduled             | `external_status`  | `{"system":"arrivy","label":"Site survey scheduled","fallback":"checkbox"}`                                                                                            |
| 6   | Additional Work Needed?           | `question`         | `{"question":"Additional work needed?","answer_type":"select","options":["None","Roof Work","Panel Upgrade","Main Panel Upgrade","Trenching","Tree Removal","Other"]}` |
| 7   | Shading Issues?                   | `question`         | `{"question":"Any shading issues?","answer_type":"select","options":["None","Minor","Moderate","Significant"]}`                                                        |
| 8   | Offset Below 100%?                | `question`         | `{"question":"Is offset below 100%?","answer_type":"select","options":["No - 100%+","Yes - Customer Aware","Yes - Needs Discussion"]}`                                 |
| 9   | Design Preferences                | `question`         | `{"question":"Design preferences or special notes","answer_type":"text"}`                                                                                              |
| 10  | New Move-In?                      | `question`         | `{"question":"Is this a new move-in?","answer_type":"boolean"}`                                                                                                        |
| 11  | Lender Welcome Call Scheduled     | `checkbox`         | `{"label":"Lender welcome call scheduled"}`                                                                                                                            |
| 12  | Customer Photo ID Collected       | `checkbox`         | `{"label":"Customer photo ID collected"}`                                                                                                                              |
| 13  | Next Steps Verified with Customer | `checkbox`         | `{"label":"Next steps verified with customer"}`                                                                                                                        |

## Submission Flow

### Step 1: Pre-Intake Checklist (submission-step.tsx rewrite)

- Reads gates from `gate_definitions` where `is_active = true`, ordered by `display_order`
- Runs `evaluateGates()` on mount — auto gates complete themselves
- Manual gates: checkbox toggle calls `completeGate()` / `uncompleteGate()`
- Question gates: renders input (text field, select dropdown, or yes/no toggle) — answer stored in `gate_completions.value`
- Upload gates: shows file status or upload dropzone — creates attachment, then auto-evaluates
- Progress bar: X/Y required gates passed
- When all required gates pass → deal auto-advances to `submission_ready`

### Step 2: Project Submission (project-submission-step.tsx rewrite)

- Review summary with real data: system specs, pricing, financing, contracts, gate answers
- "Submit Deal" button (enabled only when stage = `submission_ready`)
- On click:
  1. `assembleSubmissionPayload(dealId)` — builds full payload
  2. Create `deal_snapshots` row (frozen JSONB of entire payload)
  3. `SubmissionProvider.submit(payload)` — stub returns success
  4. Advance deal to `submitted`, emit notifications
  5. Show confirmation with submission timestamp

### Rejection & Resubmission

- `intake_rejected` set manually for now (QB webhook handler is future)
- UI shows rejection reasons from `deals.rejection_reasons` (text array)
- Deal transitions backward: `intake_rejected` → `submission_ready`
- Closer fixes issues, gates re-evaluate, new snapshot created on resubmit
- `deal_snapshots.submission_attempt` increments (1, 2, 3...)

## Submission Adapter

```typescript
interface SubmissionProvider {
  name: string;
  submit(
    payload: SubmissionPayload,
  ): Promise<{ externalId?: string; error?: string }>;
  getStatus(
    externalId: string,
  ): Promise<{ status: string; rejectionReasons?: string[] }>;
}
```

- `ManualSubmissionProvider` — returns `{ externalId: undefined }` (no-op)
- Future: `QuickbaseSubmissionProvider` with configurable field mapping

## SubmissionPayload Interface

Defined now even though QB adapter is stubbed:

```typescript
interface SubmissionPayload {
  // Identifiers
  dealId: string;
  dealNumber: string;
  submissionAttempt: number;
  submittedAt: string;
  submittedBy: string;

  // Customer
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };

  // System
  system: {
    sizeKw: number;
    panelCount: number;
    panelModel: string;
    inverterModel: string;
    batteryModel?: string;
    batteryCount?: number;
    annualProductionKwh: number;
    offsetPercentage: number;
  };

  // Pricing
  pricing: {
    grossPrice: number;
    netPrice: number;
    grossPpw: number;
    monthlyPayment?: number;
    downPayment?: number;
    federalTaxCredit?: number;
    dealerFee?: number;
    adders: Array<{ name: string; amount: number }>;
  };

  // Financing
  financing: {
    lenderName: string;
    productName: string;
    termMonths: number;
    interestRate: number;
    approvalNumber?: string;
    approvalStatus: string;
  };

  // Contracts
  contracts: {
    allSigned: boolean;
    signedDate?: string;
    envelopes: Array<{ title: string; status: string; signedAt?: string }>;
  };

  // Reps
  closer: { name: string; email: string };
  setter?: { name: string; email: string };
  office: string;

  // Gate answers (question-type gates)
  gateAnswers: Record<string, string>;

  // Attachments
  attachmentUrls: Array<{ name: string; category: string; url: string }>;
}
```

## Schema Changes (Migration 016)

### New table: `deal_snapshots`

```sql
CREATE TABLE deal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  submission_attempt INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
CREATE INDEX idx_deal_snapshots_deal ON deal_snapshots(deal_id);
```

### Alter `deals` table

```sql
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quickbase_record_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS submission_payload JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_reasons TEXT[];
```

### Alter `gate_completions` table

```sql
ALTER TABLE gate_completions ADD COLUMN IF NOT EXISTS value TEXT;
```

### Clean slate for `gate_definitions`

```sql
-- Delete all 11 existing gates (pipeline stage machine makes them redundant)
DELETE FROM gate_completions; -- zero rows exist, but safe cleanup
DELETE FROM gate_definitions WHERE company_id = 'a0000001-0001-4000-8000-000000000001';

-- Replace CHECK constraint with all 8 blueprint types
ALTER TABLE gate_definitions DROP CONSTRAINT gate_definitions_gate_type_check;
ALTER TABLE gate_definitions ADD CONSTRAINT gate_definitions_gate_type_check
  CHECK (gate_type = ANY (ARRAY[
    'document_signed', 'file_uploaded', 'financing_status',
    'stage_reached', 'field_required', 'checkbox', 'question', 'external_status'
  ]));
```

13 new gate definitions inserted via seed file (`epic10-gates-seed.sql`).

## Server Actions

- `evaluateGates(dealId)` — auto-check all gates, upsert completions
- `completeGate(dealId, gateId, value?)` — mark manual/question gate complete
- `uncompleteGate(dealId, gateId)` — unmark a manual gate
- `getGateStatus(dealId)` — returns all gates with completion status
- `assembleSubmissionPayload(dealId)` — builds SubmissionPayload from deal data
- `submitDeal(dealId)` — orchestrates: payload → snapshot → provider.submit() → advance stage → notify
- `rejectDeal(dealId, reasons)` — set stage to intake_rejected, store reasons
- `getSubmissionHistory(dealId)` — list snapshots for audit trail

## UI Components (rewrites)

### `submission-step.tsx` (PreIntakeStep)

- DB-driven gate list instead of hardcoded
- Auto-evaluation on mount
- Gate type renderers: checkbox toggle, question input (text/select/boolean), file upload status, auto-check status badge
- Progress bar with required/optional distinction

### `project-submission-step.tsx` (ProjectSubmissionStep)

- Real review summary (system, pricing, financing, contracts, gate answers)
- Submission button → real flow (payload + snapshot + advance)
- Rejection state: shows reasons, resubmit button
- Submission history: list of past attempts with timestamps

## What's NOT in This Epic

- Quickbase API integration (stubbed adapter)
- Quickbase webhook handler for rejection (manual stage change)
- Admin gate configuration UI (Epic 11)
- Post-submission status sync from Quickbase (future feature)

## Files

| File                                                        | Action                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `supabase/migrations/016_submission_gating.sql`             | New — deal_snapshots, deals columns, gate schema updates   |
| `supabase/seed/epic10-gates-seed.sql`                       | New — DELETE old 11 gates, INSERT 13 blueprint §10.2 gates |
| `lib/integrations/submission/types.ts`                      | New — SubmissionProvider interface, SubmissionPayload      |
| `lib/integrations/submission/manual-provider.ts`            | New — ManualSubmissionProvider (no-op)                     |
| `lib/actions/gates.ts`                                      | New — gate evaluation, completion CRUD, getGateStatus      |
| `lib/actions/submission.ts`                                 | New — assemblePayload, submitDeal, rejectDeal, history     |
| `components/deals/detail/steps/submission-step.tsx`         | Rewrite — DB-driven gate checklist                         |
| `components/deals/detail/steps/project-submission-step.tsx` | Rewrite — real submission flow                             |
| `docs/PROJECT-KNOWLEDGE.md`                                 | Update — migration 016, new files                          |
| `CLAUDE.md`                                                 | Update — Epic 10 status                                    |
| `.cursor/rules/kinos.mdc`                                   | Update — Epic 10 status                                    |
| `docs/kinos-vision-and-state.md`                            | Update — Epic 10 complete                                  |
