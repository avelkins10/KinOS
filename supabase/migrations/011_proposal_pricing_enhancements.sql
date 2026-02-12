-- 011_proposal_pricing_enhancements.sql
-- Epic 7: Market/office scoping for pricing configs, tiered adders, goal-seek tracking.

-- 1. Pricing configs: scope to market/office (not just company-wide)
ALTER TABLE pricing_configs
  ADD COLUMN IF NOT EXISTS installer_market_id UUID REFERENCES installer_markets(id),
  ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id);

-- Resolution waterfall: office → market → company default
CREATE INDEX IF NOT EXISTS idx_pricing_configs_market ON pricing_configs(installer_market_id);
CREATE INDEX IF NOT EXISTS idx_pricing_configs_office ON pricing_configs(office_id);

-- 2. Adder templates: tiered pricing support
ALTER TABLE adder_templates
  ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_customer_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_manual_toggle BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_auto_apply BOOLEAN DEFAULT false;

-- pricing_tiers examples:
-- Trenching: [{"label": "0-50ft", "amount": 1500}, {"label": "50-100ft", "amount": 2500}]
-- Flat Roof PPW: [{"label": "Low pitch", "ppw": 0.05}, {"label": "Steep pitch", "ppw": 0.15}]

-- 3. Proposal: add goal-seek tracking
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS is_goal_seek BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_seek_target_gross DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS original_base_ppw DECIMAL(8,4);
