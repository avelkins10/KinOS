-- Indexes for leads/contacts performance (many may already exist in main migration)
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(company_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_contact_appointment ON deals(contact_id, appointment_date) WHERE deleted_at IS NULL AND appointment_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_contact_created ON notes(contact_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attachments_contact_created ON attachments(contact_id, created_at DESC) WHERE deleted_at IS NULL;
