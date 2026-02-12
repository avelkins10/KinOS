-- ============================================================
-- Migration 005: Revert deals.stage to blueprint-correct stages
-- ============================================================
-- Migration 004 replaced the original 19-stage pipeline with
-- 17 incorrect stages (included install/pto stages that belong
-- in Quickbase, collapsed financing detail, wrong names).
--
-- This reverts to the original blueprint stages from v1 migration.
--
-- Blueprint stages (19):
--   new_lead → appointment_set → appointment_sat → design_requested →
--   design_complete → proposal_sent → proposal_accepted →
--   financing_applied → financing_approved → stips_pending →
--   stips_cleared → contract_sent → contract_signed →
--   submission_ready → submitted → intake_approved / intake_rejected
--   Also: cancelled, lost
--
-- Run in Supabase SQL Editor.
-- ============================================================

-- Step 1: Map any existing deals with wrong stage names to correct ones
-- (in case test data was created with the 004 stages)
UPDATE deals SET stage = 'appointment_sat' WHERE stage = 'appointment_completed';
UPDATE deals SET stage = 'design_requested' WHERE stage = 'design_in_progress';
UPDATE deals SET stage = 'proposal_sent' WHERE stage = 'proposal';
UPDATE deals SET stage = 'financing_applied' WHERE stage = 'financing';
UPDATE deals SET stage = 'contract_sent' WHERE stage = 'contracting';
UPDATE deals SET stage = 'submission_ready' WHERE stage = 'pre_intake';
UPDATE deals SET stage = 'cancelled' WHERE stage = 'on_hold';
-- Install stages shouldn't exist — map to intake_approved as closest terminal
UPDATE deals SET stage = 'intake_approved' WHERE stage IN (
  'install_scheduled', 'install_in_progress', 'install_complete',
  'inspection', 'pto'
);

-- Step 2: Drop the wrong constraint from migration 004
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Step 3: Add the correct constraint matching v1 migration / blueprint
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
  'new_lead',
  'appointment_set',
  'appointment_sat',
  'design_requested',
  'design_complete',
  'proposal_sent',
  'proposal_accepted',
  'financing_applied',
  'financing_approved',
  'stips_pending',
  'stips_cleared',
  'contract_sent',
  'contract_signed',
  'submission_ready',
  'submitted',
  'intake_approved',
  'intake_rejected',
  'cancelled',
  'lost'
));

-- Step 4: Also fix deal_stage_history if any records reference old stages
UPDATE deal_stage_history SET to_stage = 'appointment_sat' WHERE to_stage = 'appointment_completed';
UPDATE deal_stage_history SET from_stage = 'appointment_sat' WHERE from_stage = 'appointment_completed';
UPDATE deal_stage_history SET to_stage = 'proposal_sent' WHERE to_stage = 'proposal';
UPDATE deal_stage_history SET from_stage = 'proposal_sent' WHERE from_stage = 'proposal';
UPDATE deal_stage_history SET to_stage = 'financing_applied' WHERE to_stage = 'financing';
UPDATE deal_stage_history SET from_stage = 'financing_applied' WHERE from_stage = 'financing';
UPDATE deal_stage_history SET to_stage = 'contract_sent' WHERE to_stage = 'contracting';
UPDATE deal_stage_history SET from_stage = 'contract_sent' WHERE from_stage = 'contracting';
UPDATE deal_stage_history SET to_stage = 'submission_ready' WHERE to_stage = 'pre_intake';
UPDATE deal_stage_history SET from_stage = 'submission_ready' WHERE from_stage = 'pre_intake';
