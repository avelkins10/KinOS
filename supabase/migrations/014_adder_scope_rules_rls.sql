-- Migration 014: Add RLS policy for adder_scope_rules
-- RLS is enabled on adder_scope_rules (migration 001, line 1429) but zero policies exist.
-- All queries from RLS-respecting clients return empty results, breaking scope-rule-based
-- adder filtering in the pricing engine.
-- Fix: cascade through adder_templates (which has company_id) — same pattern as lender_products.

CREATE POLICY scope_rules_via_adder_template ON adder_scope_rules
  FOR ALL USING (
    adder_template_id IN (
      SELECT id FROM adder_templates WHERE company_id = auth_company_id()
    )
  );
