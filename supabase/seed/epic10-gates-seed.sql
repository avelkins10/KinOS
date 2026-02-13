-- Epic 10: Gate Seed Data — 13 Pre-Intake Checklist Gates from Blueprint §10.2
-- These are the things the pipeline stage machine CAN'T enforce automatically:
-- uploads, manual confirmations, questions, document signing checks.
-- The old 11 scaffolding gates are deleted in migration 016.

INSERT INTO gate_definitions (id, company_id, name, description, gate_type, conditions, required_for_stage, display_order, is_required, is_active)
VALUES
  -- 1. Install Agreement Signed (auto: checks document_envelopes)
  ('a0000010-gate-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001',
   'Install Agreement Signed', 'Install agreement must be signed by customer',
   'document_signed', '{"template_key":"install_agreement"}',
   'submission_ready', 1, true, true),

  -- 2. Loan/Lender Docs Signed (auto: checks financing application status)
  ('a0000010-gate-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001',
   'Loan/Lender Docs Signed', 'Financing must be approved or stips cleared',
   'financing_status', '{"required_status":["approved","stips_cleared"]}',
   'submission_ready', 2, true, true),

  -- 3. Utility Bill Uploaded (auto: checks attachments)
  ('a0000010-gate-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000001',
   'Utility Bill Uploaded', 'Customer utility bill must be uploaded',
   'file_uploaded', '{"file_type":"utility_bill"}',
   'submission_ready', 3, true, true),

  -- 4. CallPilot Welcome Call Completed (manual checkbox)
  ('a0000010-gate-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000001',
   'CallPilot Welcome Call Completed', 'CallPilot welcome call has been completed with customer',
   'checkbox', '{"label":"CallPilot welcome call completed"}',
   'submission_ready', 4, true, true),

  -- 5. Site Survey Scheduled (external: Arrivy integration, fallback to checkbox)
  ('a0000010-gate-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000001',
   'Site Survey Scheduled', 'Site survey must be scheduled via Arrivy',
   'external_status', '{"system":"arrivy","label":"Site survey scheduled","fallback":"checkbox"}',
   'submission_ready', 5, true, true),

  -- 6. Additional Work Needed? (question: select)
  ('a0000010-gate-4000-8000-000000000006', 'a0000001-0001-4000-8000-000000000001',
   'Additional Work Needed?', 'Document any additional work required for installation',
   'question', '{"question":"Additional work needed?","answer_type":"select","options":["None","Roof Work","Panel Upgrade","Main Panel Upgrade","Trenching","Tree Removal","Other"]}',
   'submission_ready', 6, true, true),

  -- 7. Shading Issues? (question: select)
  ('a0000010-gate-4000-8000-000000000007', 'a0000001-0001-4000-8000-000000000001',
   'Shading Issues?', 'Document any shading issues at the install site',
   'question', '{"question":"Any shading issues?","answer_type":"select","options":["None","Minor","Moderate","Significant"]}',
   'submission_ready', 7, true, true),

  -- 8. Offset Below 100%? (question: select)
  ('a0000010-gate-4000-8000-000000000008', 'a0000001-0001-4000-8000-000000000001',
   'Offset Below 100%?', 'Confirm customer awareness if offset is below 100%',
   'question', '{"question":"Is offset below 100%?","answer_type":"select","options":["No - 100%+","Yes - Customer Aware","Yes - Needs Discussion"]}',
   'submission_ready', 8, true, true),

  -- 9. Design Preferences (question: text)
  ('a0000010-gate-4000-8000-000000000009', 'a0000001-0001-4000-8000-000000000001',
   'Design Preferences', 'Note any design preferences or special instructions',
   'question', '{"question":"Design preferences or special notes","answer_type":"text"}',
   'submission_ready', 9, true, true),

  -- 10. New Move-In? (question: boolean)
  ('a0000010-gate-4000-8000-000000000010', 'a0000001-0001-4000-8000-000000000001',
   'New Move-In?', 'Is this customer a new move-in to the property?',
   'question', '{"question":"Is this a new move-in?","answer_type":"boolean"}',
   'submission_ready', 10, true, true),

  -- 11. Lender Welcome Call Scheduled (manual checkbox)
  ('a0000010-gate-4000-8000-000000000011', 'a0000001-0001-4000-8000-000000000001',
   'Lender Welcome Call Scheduled', 'Lender welcome call has been scheduled',
   'checkbox', '{"label":"Lender welcome call scheduled"}',
   'submission_ready', 11, true, true),

  -- 12. Customer Photo ID Collected (manual checkbox)
  ('a0000010-gate-4000-8000-000000000012', 'a0000001-0001-4000-8000-000000000001',
   'Customer Photo ID Collected', 'Customer photo ID has been collected and verified',
   'checkbox', '{"label":"Customer photo ID collected"}',
   'submission_ready', 12, true, true),

  -- 13. Next Steps Verified with Customer (manual checkbox)
  ('a0000010-gate-4000-8000-000000000013', 'a0000001-0001-4000-8000-000000000001',
   'Next Steps Verified with Customer', 'Next steps have been discussed and verified with customer',
   'checkbox', '{"label":"Next steps verified with customer"}',
   'submission_ready', 13, true, true)

ON CONFLICT (id) DO NOTHING;
