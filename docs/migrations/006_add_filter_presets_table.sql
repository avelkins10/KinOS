-- Filter presets for leads (and optionally other entities)
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  entity_type TEXT NOT NULL DEFAULT 'leads',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_filter_presets_user_entity ON filter_presets(user_id, entity_type);

-- RLS: users see only their own presets (user_id = current user's id from users table)
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY filter_presets_own ON filter_presets
  FOR ALL
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
