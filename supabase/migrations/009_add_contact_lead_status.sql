-- Optional override for lead status (otherwise derived from deals)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS lead_status TEXT
  CHECK (lead_status IS NULL OR lead_status IN (
    'New Lead', 'Active Lead', 'Customer', 'Lost', 'On Hold'
  ));
