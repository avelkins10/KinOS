-- 012_adder_visibility_and_proposal_adder_fields.sql
-- Align on is_customer_facing (v1); drop is_customer_visible. Persist tier/custom on proposal adders.

-- 1. Drop is_customer_visible from adder_templates (keep is_customer_facing only)
ALTER TABLE adder_templates
  DROP COLUMN IF EXISTS is_customer_visible;

-- 2. proposal_adders: persist tier selection and custom amount for manual adders
ALTER TABLE proposal_adders
  ADD COLUMN IF NOT EXISTS tier_selection TEXT,
  ADD COLUMN IF NOT EXISTS custom_amount DECIMAL(12,2);
