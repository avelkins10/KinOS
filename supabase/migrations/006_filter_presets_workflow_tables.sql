-- ============================================================
-- Migration 006: Add filter_presets + workflow step tables
-- ============================================================
-- 1. filter_presets — saved filter configurations for leads/deals pages
-- 2. workflow_step_definitions — configurable deal workflow steps (blueprint §10.1)
-- 3. deal_workflow_progress — per-deal step tracking
--
-- Run in Supabase SQL Editor after 005.
-- ============================================================

-- ============================================================
-- FILTER PRESETS (Saved search/filter configurations)
-- ============================================================
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('leads', 'deals', 'contacts')),
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,  -- visible to entire company
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_filter_presets_user ON filter_presets(user_id, entity_type);
CREATE INDEX idx_filter_presets_company ON filter_presets(company_id, entity_type, is_shared);

-- RLS
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own presets and shared presets" ON filter_presets
  FOR SELECT USING (
    user_id = auth.uid()
    OR (is_shared = true AND company_id IN (
      SELECT company_id FROM users WHERE auth_id = auth.uid()
    ))
  );

CREATE POLICY "Users manage own presets" ON filter_presets
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- WORKFLOW STEP DEFINITIONS (Configurable deal workflow steps)
-- Blueprint §10.1 — admin can add/remove/reorder steps
-- Default steps: Title Check, Consumption, Deal Details, Design,
-- Proposal, Financing, Contracting, Welcome Call, Pre-Intake
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'title_check',
    'consumption',
    'deal_details',
    'design',
    'proposal',
    'financing',
    'contracting',
    'verification',
    'checklist',
    'custom'
  )),
  config JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  applies_to_deal_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflow_steps_company ON workflow_step_definitions(company_id, display_order);

-- RLS
ALTER TABLE workflow_step_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own company workflow steps" ON workflow_step_definitions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins manage workflow steps" ON workflow_step_definitions
  FOR ALL USING (
    company_id IN (
      SELECT u.company_id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_id = auth.uid() AND r.category IN ('admin')
    )
  );

-- ============================================================
-- DEAL WORKFLOW PROGRESS (Per-deal step tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS deal_workflow_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES workflow_step_definitions(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'skipped', 'blocked'
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, step_definition_id)
);

CREATE INDEX idx_workflow_progress_deal ON deal_workflow_progress(deal_id);

-- RLS (inherits from deals visibility)
ALTER TABLE deal_workflow_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see workflow progress for visible deals" ON deal_workflow_progress
  FOR SELECT USING (
    deal_id IN (SELECT id FROM deals)
  );

CREATE POLICY "Users update workflow progress for their deals" ON deal_workflow_progress
  FOR ALL USING (
    deal_id IN (SELECT id FROM deals)
  );
