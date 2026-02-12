-- ============================================================
-- Migration 004: Align deals.stage with 17 pipeline stages (Epic 3)
-- ============================================================
-- Drops existing stage CHECK and adds new one for:
-- new_lead, appointment_set, appointment_completed, design_requested,
-- design_in_progress, design_complete, proposal, financing, contracting,
-- pre_intake, install_scheduled, install_in_progress, install_complete,
-- inspection, pto, cancelled, on_hold
-- Run in Supabase SQL Editor after 002, 003.
-- ============================================================

ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
  'new_lead',
  'appointment_set',
  'appointment_completed',
  'design_requested',
  'design_in_progress',
  'design_complete',
  'proposal',
  'financing',
  'contracting',
  'pre_intake',
  'install_scheduled',
  'install_in_progress',
  'install_complete',
  'inspection',
  'pto',
  'cancelled',
  'on_hold'
));
