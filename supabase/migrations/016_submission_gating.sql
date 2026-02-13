-- Migration 016: Submission & Gating Engine (Epic 10)
-- Alter deal_snapshots: add submission_attempt column (table already exists from prior migration)
-- Alter deals: add quickbase_record_id, rejection_reasons (JSONB)
-- Alter gate_completions: add value column for question/text answers
-- Clean slate: delete old scaffolding gates, replace gate_type CHECK with 8 blueprint types

-- 1. Alter deal_snapshots: add submission_attempt column
ALTER TABLE deal_snapshots ADD COLUMN IF NOT EXISTS submission_attempt INTEGER NOT NULL DEFAULT 1;

-- 2. Alter deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quickbase_record_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_reasons JSONB;

-- 3. Alter gate_completions: add value column for question/text answers
ALTER TABLE gate_completions ADD COLUMN IF NOT EXISTS value TEXT;

-- 4. Clean slate: delete old scaffolding gates (pipeline stage machine makes them redundant)
DELETE FROM gate_completions;
DELETE FROM gate_definitions WHERE company_id = 'a0000001-0001-4000-8000-000000000001';

-- 5. Replace gate_type CHECK constraint with all 8 blueprint types
ALTER TABLE gate_definitions DROP CONSTRAINT IF EXISTS gate_definitions_gate_type_check;
ALTER TABLE gate_definitions ADD CONSTRAINT gate_definitions_gate_type_check
  CHECK (gate_type = ANY (ARRAY[
    'document_signed', 'file_uploaded', 'financing_status',
    'stage_reached', 'field_required', 'checkbox', 'question', 'external_status'
  ]));
