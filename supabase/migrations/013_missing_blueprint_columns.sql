-- Migration 013: deal_adders table + missing blueprint columns + RLS
-- Run in Supabase SQL Editor (Production) — Already applied 2026-02-12

-- deal_adders table (blueprint §3.2 — needed for Epic 7)
CREATE TABLE deal_adders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    adder_template_id UUID REFERENCES adder_templates(id),
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    pricing_type TEXT NOT NULL DEFAULT 'fixed_amount',
    quantity INTEGER DEFAULT 1,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deal_adders_deal ON deal_adders(deal_id);

ALTER TABLE deal_adders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see deal adders for visible deals" ON deal_adders
  FOR SELECT USING (deal_id IN (SELECT id FROM deals));

CREATE POLICY "Users manage deal adders for their deals" ON deal_adders
  FOR ALL USING (deal_id IN (SELECT id FROM deals));

-- deals.aurora_proposal_id (needed for Epic 7)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS aurora_proposal_id TEXT;

-- contacts.latitude / contacts.longitude (geographic routing, map features)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
