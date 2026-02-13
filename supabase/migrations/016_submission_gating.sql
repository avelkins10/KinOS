-- Migration 016: Submission & Gating Engine (Epic 10)
-- New table: deal_snapshots (frozen JSONB payload per submission attempt)
-- Alter deals: add quickbase_record_id, rejection_reasons (JSONB)
-- Alter gate_completions: add value column for question/text answers
-- Clean slate: delete old scaffolding gates, replace gate_type CHECK with 8 blueprint types

-- 1. New table: deal_snapshots
CREATE TABLE deal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  submission_attempt INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
CREATE INDEX idx_deal_snapshots_deal ON deal_snapshots(deal_id);

-- RLS for deal_snapshots (cascades through deals.company_id)
ALTER TABLE deal_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_snapshots_select" ON deal_snapshots FOR SELECT
  USING (deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id()));
CREATE POLICY "deal_snapshots_insert" ON deal_snapshots FOR INSERT
  WITH CHECK (deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id()));

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
