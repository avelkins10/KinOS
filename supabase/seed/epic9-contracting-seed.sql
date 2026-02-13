-- ============================================================
-- Epic 9 Seed Data: Document Templates, Envelopes, Notifications
-- Run in Supabase SQL Editor against LOCAL dev environment
-- Depends on: epic7-pricing-seed.sql (deals, contacts, users)
-- ============================================================

-- Known IDs from epic7 seed:
-- Company: a0000001-0001-4000-8000-000000000001
-- Closer:  1890d0cd-3c4b-4f50-bf99-69c9a6087777
-- Manager: 139f1eb0-9707-48e3-bd62-eeec50cb2666
-- Deal 1:  bb000001-0001-4000-8000-000000000001
-- Deal 2:  bb000001-0002-4000-8000-000000000002

DO $$
DECLARE
  v_company_id UUID := 'a0000001-0001-4000-8000-000000000001';
  v_closer_id  UUID := '1890d0cd-3c4b-4f50-bf99-69c9a6087777';
  v_manager_id UUID := '139f1eb0-9707-48e3-bd62-eeec50cb2666';
  v_deal_1     UUID := 'bb000001-0001-4000-8000-000000000001';
  v_deal_2     UUID := 'bb000001-0002-4000-8000-000000000002';

  -- Document template IDs (deterministic)
  v_tpl_install UUID := 'ee000001-0001-4000-8000-000000000001';
  v_tpl_cancel  UUID := 'ee000001-0002-4000-8000-000000000002';
  v_tpl_interco UUID := 'ee000001-0003-4000-8000-000000000003';
  v_tpl_credit  UUID := 'ee000001-0004-4000-8000-000000000004';

  -- Envelope IDs (deterministic)
  v_env_1a UUID := 'ff000001-0001-4000-8000-000000000001';
  v_env_1b UUID := 'ff000001-0002-4000-8000-000000000002';
  v_env_1c UUID := 'ff000001-0003-4000-8000-000000000003';
  v_env_1d UUID := 'ff000001-0004-4000-8000-000000000004';
  v_env_2a UUID := 'ff000001-0005-4000-8000-000000000005';
  v_env_2b UUID := 'ff000001-0006-4000-8000-000000000006';

  -- Notification IDs (deterministic)
  v_notif_1 UUID := 'dd000001-0001-4000-8000-000000000001';
  v_notif_2 UUID := 'dd000001-0002-4000-8000-000000000002';
  v_notif_3 UUID := 'dd000001-0003-4000-8000-000000000003';
  v_notif_4 UUID := 'dd000001-0004-4000-8000-000000000004';
  v_notif_5 UUID := 'dd000001-0005-4000-8000-000000000005';
  v_notif_6 UUID := 'dd000001-0006-4000-8000-000000000006';

BEGIN

-- ============================================================
-- 1. Document Templates (4 templates)
-- ============================================================

INSERT INTO document_templates (id, company_id, name, description, provider, provider_template_id, document_type, required_for_stages, display_order, is_active) VALUES
  (v_tpl_install, v_company_id, 'Solar Installation Agreement',
   'Primary solar installation contract between homeowner and KIN Home.',
   'manual', 'manual-install-agreement', 'contract',
   ARRAY['contract_sent', 'contract_signed'], 1, true),

  (v_tpl_cancel, v_company_id, 'Right to Cancel',
   'Federal/state right-to-cancel notice (3-day cooling off period).',
   'manual', 'manual-right-to-cancel', 'notice',
   ARRAY['contract_sent', 'contract_signed'], 2, true),

  (v_tpl_interco, v_company_id, 'Interconnection Authorization',
   'Authorization for utility interconnection application.',
   'manual', 'manual-interconnection-auth', 'authorization',
   ARRAY['contract_sent', 'contract_signed'], 3, true),

  (v_tpl_credit, v_company_id, 'Credit Authorization',
   'Authorization for credit check and financing application.',
   'manual', 'manual-credit-auth', 'authorization',
   ARRAY['contract_sent', 'contract_signed'], 4, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Update Deal 1 stage to contract_sent (for envelope seed data)
-- ============================================================

UPDATE deals
SET stage = 'contract_sent',
    stage_changed_at = NOW() - INTERVAL '2 days'
WHERE id = v_deal_1;

-- ============================================================
-- 3. Document Envelopes for Deal 1 (mix of statuses)
-- ============================================================

INSERT INTO document_envelopes (id, deal_id, template_id, provider, title, status, status_changed_at, sent_at, viewed_at, signed_at) VALUES
  (v_env_1a, v_deal_1, v_tpl_install, 'manual', 'Solar Installation Agreement',
   'signed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day'),

  (v_env_1b, v_deal_1, v_tpl_cancel, 'manual', 'Right to Cancel',
   'signed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day'),

  (v_env_1c, v_deal_1, v_tpl_interco, 'manual', 'Interconnection Authorization',
   'viewed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours', NULL),

  (v_env_1d, v_deal_1, v_tpl_credit, 'manual', 'Credit Authorization',
   'sent', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Document Envelopes for Deal 2 (all signed)
-- ============================================================

UPDATE deals
SET stage = 'contract_signed',
    stage_changed_at = NOW() - INTERVAL '12 hours'
WHERE id = v_deal_2;

INSERT INTO document_envelopes (id, deal_id, template_id, provider, title, status, status_changed_at, sent_at, viewed_at, signed_at) VALUES
  (v_env_2a, v_deal_2, v_tpl_install, 'manual', 'Solar Installation Agreement',
   'signed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours'),

  (v_env_2b, v_deal_2, v_tpl_cancel, 'manual', 'Right to Cancel',
   'signed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Sample Notifications (mix of types for closer + manager)
-- ============================================================

INSERT INTO notifications (id, user_id, deal_id, type, title, message, is_read, action_url) VALUES
  (v_notif_1, v_closer_id, v_deal_1, 'contract_sent',
   'Contract packet sent', '4 documents sent for KIN-2026-00001',
   true, '/deals/' || v_deal_1),

  (v_notif_2, v_closer_id, v_deal_1, 'contract_viewed',
   'Contract viewed', '"Interconnection Authorization" was viewed for KIN-2026-00001',
   false, '/deals/' || v_deal_1),

  (v_notif_3, v_closer_id, v_deal_2, 'contract_all_signed',
   'All contracts signed!', 'Customer has signed all documents for KIN-2026-00002',
   false, '/deals/' || v_deal_2),

  (v_notif_4, v_manager_id, v_deal_2, 'contract_all_signed',
   'All contracts signed!', 'Customer has signed all documents for KIN-2026-00002',
   false, '/deals/' || v_deal_2),

  (v_notif_5, v_closer_id, v_deal_1, 'financing_approved',
   'Financing approved', 'GoodLeap financing approved for KIN-2026-00001',
   true, '/deals/' || v_deal_1),

  (v_notif_6, v_closer_id, NULL, 'system',
   'Welcome to KinOS', 'Your CRM is ready. Start managing your solar deals!',
   true, '/')
ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- DONE. Summary:
-- 4 document templates (install agreement, right to cancel, interconnection, credit)
-- 6 document envelopes (4 on deal 1 [mix], 2 on deal 2 [all signed])
-- 6 notifications (4 for closer, 2 for manager, mix of read/unread)
-- Deal 1 updated to contract_sent
-- Deal 2 updated to contract_signed
-- ============================================================
