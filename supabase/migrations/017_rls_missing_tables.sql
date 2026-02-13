-- Migration 017: Add RLS policies for 5 tables that had RLS enabled but no policies
-- Tables: financing_status_history, contact_change_history, note_edits,
--         equipment_market_availability, aurora_pricing_syncs

-- financing_status_history: inherits access via financing_applications → deals
CREATE POLICY financing_history_via_deal ON financing_status_history
  FOR ALL USING (
    financing_application_id IN (
      SELECT fa.id FROM financing_applications fa
      JOIN deals d ON fa.deal_id = d.id
      WHERE d.company_id = auth_company_id()
    )
  );

-- contact_change_history: inherits access via contacts
CREATE POLICY contact_history_via_contact ON contact_change_history
  FOR ALL USING (
    contact_id IN (SELECT id FROM contacts WHERE company_id = auth_company_id())
  );

-- note_edits: inherits access via notes → deals/contacts
CREATE POLICY note_edits_via_note ON note_edits
  FOR ALL USING (
    note_id IN (
      SELECT id FROM notes
      WHERE deal_id IN (SELECT id FROM deals WHERE company_id = auth_company_id())
         OR contact_id IN (SELECT id FROM contacts WHERE company_id = auth_company_id())
    )
  );

-- equipment_market_availability: inherits access via equipment
CREATE POLICY equip_market_via_equipment ON equipment_market_availability
  FOR ALL USING (
    equipment_id IN (SELECT id FROM equipment WHERE company_id = auth_company_id())
  );

-- aurora_pricing_syncs: admin-only (operational/debug data)
CREATE POLICY aurora_syncs_admin_only ON aurora_pricing_syncs
  FOR ALL USING (auth_role_category() = 'admin');
