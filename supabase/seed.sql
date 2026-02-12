-- ============================================================
-- Epic 7 Comprehensive Seed Data
-- Run in Supabase SQL Editor against LOCAL dev environment
-- All FK references verified against live schema 2026-02-12
-- ============================================================

-- Known IDs from existing seed data:
-- Company: a0000001-0001-4000-8000-000000000001 (KIN Home Test)
-- Office:  a0000002-0002-4000-8000-000000000002 (Test Office)
-- Admin:   9dd696ff-185a-47c6-b81a-12e26a7093d2 (Test Admin)
-- Closer:  1890d0cd-3c4b-4f50-bf99-69c9a6087777 (Test Closer)
-- Manager: 139f1eb0-9707-48e3-bd62-eeec50cb2666 (Test Manager)

DO $$
DECLARE
  v_company_id UUID := 'a0000001-0001-4000-8000-000000000001';
  v_office_id  UUID := 'a0000002-0002-4000-8000-000000000002';
  v_admin_id   UUID := '9dd696ff-185a-47c6-b81a-12e26a7093d2';
  v_closer_id  UUID := '1890d0cd-3c4b-4f50-bf99-69c9a6087777';
  v_manager_id UUID := '139f1eb0-9707-48e3-bd62-eeec50cb2666';

  -- Installer market IDs (deterministic for FK refs)
  v_market_fl UUID := 'b0000001-0001-4000-8000-000000000001';
  v_market_ca UUID := 'b0000001-0002-4000-8000-000000000002';
  v_market_tx UUID := 'b0000001-0003-4000-8000-000000000003';

  -- Lender IDs
  v_lender_goodleap_loan UUID := 'c0000001-0001-4000-8000-000000000001';
  v_lender_goodleap_tpo  UUID := 'c0000001-0002-4000-8000-000000000002';
  v_lender_lightreach    UUID := 'c0000001-0003-4000-8000-000000000003';
  v_lender_mosaic        UUID := 'c0000001-0004-4000-8000-000000000004';
  v_lender_sunlight      UUID := 'c0000001-0005-4000-8000-000000000005';
  v_lender_dividend      UUID := 'c0000001-0006-4000-8000-000000000006';
  v_lender_enfin         UUID := 'c0000001-0007-4000-8000-000000000007';
  v_lender_climate_first UUID := 'c0000001-0008-4000-8000-000000000008';
  v_lender_sunnova       UUID := 'c0000001-0009-4000-8000-000000000009';
  v_lender_cash          UUID := 'c0000001-0010-4000-8000-000000000010';

  -- Lender product IDs
  v_prod_gl25_149 UUID := 'd0000001-0001-4000-8000-000000000001';
  v_prod_gl25_299 UUID := 'd0000001-0002-4000-8000-000000000002';
  v_prod_gl25_399 UUID := 'd0000001-0003-4000-8000-000000000003';
  v_prod_gl_tpo   UUID := 'd0000001-0004-4000-8000-000000000004';
  v_prod_lr_lease UUID := 'd0000001-0005-4000-8000-000000000005';
  v_prod_mosaic25 UUID := 'd0000001-0006-4000-8000-000000000006';
  v_prod_sunlight UUID := 'd0000001-0007-4000-8000-000000000007';
  v_prod_dividend UUID := 'd0000001-0008-4000-8000-000000000008';
  v_prod_enfin    UUID := 'd0000001-0009-4000-8000-000000000009';
  v_prod_cf_25    UUID := 'd0000001-0010-4000-8000-000000000010';
  v_prod_sunnova  UUID := 'd0000001-0011-4000-8000-000000000011';
  v_prod_cash     UUID := 'd0000001-0012-4000-8000-000000000012';

  -- Pricing config IDs
  v_pricing_default UUID := 'e0000001-0001-4000-8000-000000000001';
  v_pricing_fl      UUID := 'e0000001-0002-4000-8000-000000000002';
  v_pricing_ca      UUID := 'e0000001-0003-4000-8000-000000000003';

  -- Adder template IDs (need refs for scope rules)
  v_adder_enphase_10kw   UUID := 'f0000001-0001-4000-8000-000000000001';
  v_adder_10kwh_battery  UUID := 'f0000001-0002-4000-8000-000000000002';
  v_adder_sunlight_bkup  UUID := 'f0000001-0003-4000-8000-000000000003';
  v_adder_franklin       UUID := 'f0000001-0004-4000-8000-000000000004';
  v_adder_solark         UUID := 'f0000001-0005-4000-8000-000000000005';
  v_adder_sub_panel      UUID := 'f0000001-0006-4000-8000-000000000006';
  v_adder_mpu            UUID := 'f0000001-0007-4000-8000-000000000007';
  v_adder_derate_ca      UUID := 'f0000001-0008-4000-8000-000000000008';
  v_adder_elec_upgrade   UUID := 'f0000001-0009-4000-8000-000000000009';
  v_adder_lr_elec        UUID := 'f0000001-0010-4000-8000-000000000010';
  v_adder_prod_meter     UUID := 'f0000001-0011-4000-8000-000000000011';
  v_adder_gas_line       UUID := 'f0000001-0012-4000-8000-000000000012';
  v_adder_flat_roof      UUID := 'f0000001-0013-4000-8000-000000000013';
  v_adder_metal_roof     UUID := 'f0000001-0014-4000-8000-000000000014';
  v_adder_tile_roof      UUID := 'f0000001-0015-4000-8000-000000000015';
  v_adder_reroof         UUID := 'f0000001-0016-4000-8000-000000000016';
  v_adder_ground_mount   UUID := 'f0000001-0017-4000-8000-000000000017';
  v_adder_trench_dirt    UUID := 'f0000001-0018-4000-8000-000000000018';
  v_adder_trench_conc    UUID := 'f0000001-0019-4000-8000-000000000019';
  v_adder_tree_remove    UUID := 'f0000001-0020-4000-8000-000000000020';
  v_adder_tree_trim      UUID := 'f0000001-0021-4000-8000-000000000021';
  v_adder_ac_reloc       UUID := 'f0000001-0022-4000-8000-000000000022';
  v_adder_remove_replace UUID := 'f0000001-0023-4000-8000-000000000023';
  v_adder_small_lt4kw    UUID := 'f0000001-0024-4000-8000-000000000024';
  v_adder_small_4_6kw    UUID := 'f0000001-0025-4000-8000-000000000025';
  v_adder_fl_small_5kw   UUID := 'f0000001-0026-4000-8000-000000000026';
  v_adder_ca_small_10pan UUID := 'f0000001-0027-4000-8000-000000000027';
  v_adder_enfin_tpo      UUID := 'f0000001-0028-4000-8000-000000000028';
  v_adder_gl_tpo         UUID := 'f0000001-0029-4000-8000-000000000029';
  v_adder_lr_tpo         UUID := 'f0000001-0030-4000-8000-000000000030';
  v_adder_sunnova_tpo    UUID := 'f0000001-0031-4000-8000-000000000031';
  v_adder_site_survey    UUID := 'f0000001-0032-4000-8000-000000000032';
  v_adder_oom_distance   UUID := 'f0000001-0033-4000-8000-000000000033';
  v_adder_generac        UUID := 'f0000001-0034-4000-8000-000000000034';
  v_adder_solar_fan      UUID := 'f0000001-0035-4000-8000-000000000035';
  v_adder_amp_tax        UUID := 'f0000001-0036-4000-8000-000000000036';

  -- Contact IDs
  v_contact_1 UUID := 'aa000001-0001-4000-8000-000000000001';
  v_contact_2 UUID := 'aa000001-0002-4000-8000-000000000002';
  v_contact_3 UUID := 'aa000001-0003-4000-8000-000000000003';
  v_contact_4 UUID := 'aa000001-0004-4000-8000-000000000004';
  v_contact_5 UUID := 'aa000001-0005-4000-8000-000000000005';

  -- Deal IDs
  v_deal_1 UUID := 'bb000001-0001-4000-8000-000000000001';
  v_deal_2 UUID := 'bb000001-0002-4000-8000-000000000002';
  v_deal_3 UUID := 'bb000001-0003-4000-8000-000000000003';
  v_deal_4 UUID := 'bb000001-0004-4000-8000-000000000004';
  v_deal_5 UUID := 'bb000001-0005-4000-8000-000000000005';

BEGIN

-- ============================================================
-- 0. TEST USERS (required for FK references in contacts/deals)
-- ============================================================
INSERT INTO users (id, auth_id, company_id, office_id, role_id, first_name, last_name, email, phone, status)
VALUES
  (v_admin_id,   gen_random_uuid(), v_company_id, v_office_id, 'a0000003-0003-4000-8000-000000000003', 'Test', 'Admin',   'admin@kinhome.test',   '555-100-0001', 'active'),
  (v_closer_id,  gen_random_uuid(), v_company_id, v_office_id, 'a0000004-0004-4000-8000-000000000004', 'Test', 'Closer',  'closer@kinhome.test',  '555-100-0002', 'active'),
  (v_manager_id, gen_random_uuid(), v_company_id, v_office_id, 'a0000005-0005-4000-8000-000000000005', 'Test', 'Manager', 'manager@kinhome.test', '555-100-0003', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1. INSTALLER MARKETS
-- ============================================================
INSERT INTO installer_markets (id, company_id, name, state, region, is_active) VALUES
  (v_market_fl, v_company_id, 'Florida', 'FL', 'Southeast', true),
  (v_market_ca, v_company_id, 'California', 'CA', 'West', true),
  (v_market_tx, v_company_id, 'Texas', 'TX', 'South', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. LENDERS
-- ============================================================
INSERT INTO lenders (id, company_id, name, slug, lender_type, display_order, is_active) VALUES
  (v_lender_goodleap_loan, v_company_id, 'GoodLeap (Loans)', 'goodleap-loans', 'loan', 1, true),
  (v_lender_goodleap_tpo,  v_company_id, 'GoodLeap (TPO)',   'goodleap-tpo',   'tpo',  2, true),
  (v_lender_lightreach,    v_company_id, 'LightReach',       'lightreach',      'lease', 3, true),
  (v_lender_mosaic,        v_company_id, 'Mosaic',           'mosaic',          'loan', 4, true),
  (v_lender_sunlight,      v_company_id, 'Sunlight',         'sunlight',        'loan', 5, true),
  (v_lender_dividend,      v_company_id, 'Dividend',         'dividend',        'loan', 6, true),
  (v_lender_enfin,         v_company_id, 'Enfin',            'enfin',           'loan', 7, true),
  (v_lender_climate_first, v_company_id, 'Climate First',    'climate-first',   'loan', 8, true),
  (v_lender_sunnova,       v_company_id, 'Sunnova',          'sunnova',         'tpo',  9, true),
  (v_lender_cash,          v_company_id, 'Cash',             'cash',            'cash', 10, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. LENDER PRODUCTS
-- NOTE: Rates and dealer fees are PLACEHOLDER values.
-- Austin must provide real numbers before production.
-- ============================================================
INSERT INTO lender_products (id, lender_id, name, product_code, term_months, interest_rate, apr,
  dealer_fee_percent, sales_facing_fee_percent, kin_margin_percent, display_order, is_active) VALUES
  -- GoodLeap Loans
  (v_prod_gl25_149, v_lender_goodleap_loan, '25yr 1.49%',  'GL-25-149', 300, 1.49, 1.49, 22.00, 25.00, 3.00, 1, true),
  (v_prod_gl25_299, v_lender_goodleap_loan, '25yr 2.99%',  'GL-25-299', 300, 2.99, 2.99, 18.00, 21.00, 3.00, 2, true),
  (v_prod_gl25_399, v_lender_goodleap_loan, '25yr 3.99%',  'GL-25-399', 300, 3.99, 3.99, 14.00, 17.00, 3.00, 3, true),
  -- GoodLeap TPO
  (v_prod_gl_tpo,   v_lender_goodleap_tpo,  'TPO Standard', 'GL-TPO-STD', 300, NULL, NULL, 0, 0, 0, 1, true),
  -- LightReach Lease
  (v_prod_lr_lease, v_lender_lightreach,     'Standard Lease', 'LR-LEASE', 300, NULL, NULL, 0, 0, 0, 1, true),
  -- Mosaic
  (v_prod_mosaic25, v_lender_mosaic,         '25yr 2.99%',  'MOS-25-299', 300, 2.99, 2.99, 20.00, 23.00, 3.00, 1, true),
  -- Sunlight
  (v_prod_sunlight, v_lender_sunlight,       '25yr 3.49%',  'SUN-25-349', 300, 3.49, 3.49, 18.00, 21.00, 3.00, 1, true),
  -- Dividend
  (v_prod_dividend, v_lender_dividend,       '25yr 2.99%',  'DIV-25-299', 300, 2.99, 2.99, 19.00, 22.00, 3.00, 1, true),
  -- Enfin
  (v_prod_enfin,    v_lender_enfin,          '25yr 3.49%',  'ENF-25-349', 300, 3.49, 3.49, 16.00, 19.00, 3.00, 1, true),
  -- Climate First
  (v_prod_cf_25,    v_lender_climate_first,  '25yr 2.99%',  'CF-25-299',  300, 2.99, 2.99, 18.00, 21.00, 3.00, 1, true),
  -- Sunnova TPO
  (v_prod_sunnova,  v_lender_sunnova,        'TPO Standard', 'SUN-TPO',   300, NULL, NULL, 0, 0, 0, 1, true),
  -- Cash
  (v_prod_cash,     v_lender_cash,           'Cash Purchase', 'CASH',     NULL, 0, 0, 0, 0, 0, 1, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. PRICING CONFIGS
-- ============================================================
INSERT INTO pricing_configs (id, company_id, installer_market_id, office_id, name,
  base_ppw, min_ppw, max_ppw, buffer_amount, buffer_ppw, state_tax_rate,
  min_panel_count, is_active) VALUES
  -- Company-wide default (no market, no office)
  (v_pricing_default, v_company_id, NULL, NULL, 'Default 2026',
   3.25, 2.50, 5.00, 0, 0, 0, 7, true),
  -- Florida market override
  (v_pricing_fl, v_company_id, v_market_fl, NULL, 'Florida 2026',
   3.10, 2.40, 4.80, 0, 0, 0, 7, true),
  -- California market override
  (v_pricing_ca, v_company_id, v_market_ca, NULL, 'California 2026',
   3.50, 2.80, 5.50, 0, 0, 0, 7, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. ADDER TEMPLATES
-- Matches live schema: adder_templates columns verified
-- ============================================================
INSERT INTO adder_templates (id, company_id, name, description, category, pricing_type,
  default_amount, min_amount, max_amount, is_customer_facing, eligible_for_itc,
  requires_approval, is_manual_toggle, is_auto_apply, is_active, display_order, pricing_tiers) VALUES

-- === BATTERIES ===
(v_adder_enphase_10kw,  v_company_id, '10kW Enphase Battery', NULL, 'battery',
 'fixed_amount', 15000, NULL, NULL, true, false, false, true, false, true, 10, NULL),
(v_adder_10kwh_battery, v_company_id, '10kWh Battery', NULL, 'battery',
 'custom', NULL, 5000, 25000, true, false, false, false, true, true, 11, NULL),
(v_adder_sunlight_bkup, v_company_id, 'Enphase Sunlight Backup', NULL, 'battery',
 'fixed_amount', 5000, NULL, NULL, true, false, false, true, false, true, 12, NULL),
(v_adder_franklin,      v_company_id, 'FranklinWH Home Power 10kW', NULL, 'battery',
 'fixed_amount', 15000, NULL, NULL, true, false, false, false, true, true, 13, NULL),
(v_adder_solark,        v_company_id, 'SolArk w/Homegrid 38.4kW Battery (Whole Home)', NULL, 'battery',
 'fixed_amount', 35000, NULL, NULL, true, false, false, true, false, true, 14, NULL),

-- === ELECTRICAL ===
(v_adder_sub_panel,     v_company_id, 'Sub Panel', NULL, 'electrical',
 'fixed_amount', 1500, NULL, NULL, true, false, false, true, false, true, 20, NULL),
(v_adder_mpu,           v_company_id, 'MPU', NULL, 'electrical',
 'custom', NULL, 500, 5000, false, false, false, true, false, true, 21, NULL),
(v_adder_derate_ca,     v_company_id, 'De-rate Breaker (CA)', NULL, 'electrical',
 'fixed_amount', 700, NULL, NULL, false, false, false, true, false, true, 22, NULL),
(v_adder_elec_upgrade,  v_company_id, 'Electrical Upgrade If Needed', NULL, 'electrical',
 'custom', NULL, 1000, 10000, true, false, false, false, false, true, 23, NULL),
(v_adder_lr_elec,       v_company_id, 'LR - Electrical Upgrade', NULL, 'electrical',
 'fixed_amount', 3500, NULL, NULL, true, false, false, false, true, true, 24, NULL),
(v_adder_prod_meter,    v_company_id, 'Production Meter Collar', NULL, 'electrical',
 'fixed_amount', 3000, NULL, NULL, false, false, false, true, false, true, 25, NULL),
(v_adder_gas_line,      v_company_id, 'Natural Gas Fuel Line', NULL, 'electrical',
 'fixed_amount', 2500, NULL, NULL, true, false, false, true, false, true, 26, NULL),

-- === ROOF ===
(v_adder_flat_roof,     v_company_id, 'Flat Roof', NULL, 'roof',
 'price_per_watt', NULL, NULL, NULL, false, false, false, false, true, true, 30,
 '[{"label": "Standard", "ppw": 0.10}, {"label": "Steep", "ppw": 0.20}]'::jsonb),
(v_adder_metal_roof,    v_company_id, 'Metal Roof', NULL, 'roof',
 'price_per_watt', 0.10, NULL, NULL, false, false, false, true, false, true, 31, NULL),
(v_adder_tile_roof,     v_company_id, 'Tile Roof', NULL, 'roof',
 'price_per_watt', NULL, NULL, NULL, false, false, false, false, true, true, 32,
 '[{"label": "Standard", "ppw": 0.15}, {"label": "Premium", "ppw": 0.25}]'::jsonb),
(v_adder_reroof,        v_company_id, 'Re-Roof', NULL, 'roof',
 'custom', NULL, 2000, 20000, true, false, false, true, false, true, 33, NULL),

-- === SITE ===
(v_adder_ground_mount,  v_company_id, 'Ground Mount', NULL, 'site',
 'price_per_watt', 0.80, NULL, NULL, false, false, false, false, true, true, 40, NULL),
(v_adder_trench_dirt,   v_company_id, 'Trenching (Dirt)', NULL, 'site',
 'custom', NULL, NULL, NULL, true, false, false, true, false, true, 41,
 '[{"label": "0-50ft", "amount": 1500}, {"label": "50-100ft", "amount": 2500}, {"label": "100ft+", "amount": 3500}]'::jsonb),
(v_adder_trench_conc,   v_company_id, 'Trenching (Concrete)', NULL, 'site',
 'custom', NULL, 1000, 10000, true, false, false, true, false, true, 42, NULL),
(v_adder_tree_remove,   v_company_id, 'Tree Removal', NULL, 'site',
 'custom', NULL, 500, 10000, true, false, false, true, false, true, 43, NULL),
(v_adder_tree_trim,     v_company_id, 'Tree Trimming', NULL, 'site',
 'custom', NULL, 200, 5000, true, false, false, true, false, true, 44, NULL),
(v_adder_ac_reloc,      v_company_id, 'A/C Relocation', NULL, 'site',
 'fixed_amount', 2000, NULL, NULL, false, false, false, true, false, true, 45, NULL),
(v_adder_remove_replace,v_company_id, 'Remove and Replace', NULL, 'site',
 'price_per_watt', 0.87, NULL, NULL, false, false, false, true, false, true, 46, NULL),

-- === SYSTEM SIZE (auto-apply) ===
(v_adder_small_lt4kw,   v_company_id, 'Small System < 4kW', NULL, 'system_size',
 'fixed_amount', 2500, NULL, NULL, false, false, false, false, true, true, 50, NULL),
(v_adder_small_4_6kw,   v_company_id, 'Small System 4kW-6kW', NULL, 'system_size',
 'fixed_amount', 1250, NULL, NULL, false, false, false, false, true, true, 51, NULL),
(v_adder_fl_small_5kw,  v_company_id, 'FL Small System <5kW', NULL, 'system_size',
 'fixed_amount', 950, NULL, NULL, false, false, false, false, true, true, 52, NULL),
(v_adder_ca_small_10pan,v_company_id, 'CA Small System Adder - 10 panels or less', NULL, 'system_size',
 'fixed_amount', 2000, NULL, NULL, true, false, false, false, true, true, 53, NULL),

-- === LENDER-SPECIFIC (auto-apply when lender selected) ===
(v_adder_enfin_tpo,     v_company_id, 'Enfin TPO Adder', NULL, 'lender',
 'price_per_watt', 0.10, NULL, NULL, false, false, false, false, true, true, 60, NULL),
(v_adder_gl_tpo,        v_company_id, 'GoodLeap TPO Adder', NULL, 'lender',
 'price_per_watt', NULL, NULL, NULL, false, false, false, false, true, true, 61,
 '[{"label": "Standard", "ppw": 0.10}, {"label": "Premium", "ppw": 0.15}]'::jsonb),
(v_adder_lr_tpo,        v_company_id, 'LightReach TPO Adder', NULL, 'lender',
 'price_per_watt', 0.10, NULL, NULL, false, false, false, false, true, true, 62, NULL),
(v_adder_sunnova_tpo,   v_company_id, 'Sunnova TPO Adder', NULL, 'lender',
 'price_per_watt', 0.10, NULL, NULL, false, false, false, false, true, true, 63, NULL),

-- === FEES ===
(v_adder_site_survey,   v_company_id, 'Site Survey', NULL, 'fee',
 'fixed_amount', 250, NULL, NULL, false, false, false, false, true, true, 70, NULL),
(v_adder_oom_distance,  v_company_id, 'OOM Distance Adder', NULL, 'fee',
 'fixed_amount', 500, NULL, NULL, false, false, false, false, true, true, 71, NULL),

-- === OTHER ===
(v_adder_generac,       v_company_id, '24kW Generac Generator', NULL, 'generator',
 'fixed_amount', 16250, NULL, NULL, true, false, false, true, false, true, 80, NULL),
(v_adder_solar_fan,     v_company_id, 'Solar Attic Fan', NULL, 'other',
 'fixed_amount', 850, NULL, NULL, true, false, false, true, false, true, 90, NULL),
(v_adder_amp_tax,       v_company_id, 'AMP Smart Tax Service', NULL, 'other',
 'fixed_amount', 850, NULL, NULL, true, false, false, true, false, true, 91, NULL)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ADDER SCOPE RULES
-- Schema: rule_type TEXT, rule_value TEXT, is_inclusion BOOLEAN
-- ============================================================
INSERT INTO adder_scope_rules (adder_template_id, rule_type, rule_value, is_inclusion) VALUES
  -- System size triggers
  (v_adder_small_lt4kw,    'system_size_max', '4000', true),
  (v_adder_small_4_6kw,    'system_size_min', '4000', true),
  (v_adder_small_4_6kw,    'system_size_max', '6000', true),
  (v_adder_fl_small_5kw,   'system_size_max', '5000', true),
  (v_adder_fl_small_5kw,   'state',           'FL',   true),
  (v_adder_ca_small_10pan, 'system_size_max', '4100', true),
  (v_adder_ca_small_10pan, 'state',           'CA',   true),

  -- State-specific adders
  (v_adder_derate_ca,      'state',           'CA',   true),

  -- Lender triggers (auto-apply TPO adders)
  (v_adder_enfin_tpo,      'lender',          'enfin',         true),
  (v_adder_gl_tpo,         'lender',          'goodleap-tpo',  true),
  (v_adder_lr_tpo,         'lender',          'lightreach',    true),
  (v_adder_sunnova_tpo,    'lender',          'sunnova',       true),

  -- LightReach electrical upgrade auto-applies for LR deals
  (v_adder_lr_elec,        'lender',          'lightreach',    true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. WORKFLOW STEP DEFINITIONS
-- ============================================================
INSERT INTO workflow_step_definitions (company_id, name, slug, description, step_type, display_order, is_required, is_blocking, is_active) VALUES
  (v_company_id, 'Title Check',      'title-check',     'Verify property ownership',              'title_check',    1, true,  true,  true),
  (v_company_id, 'Consumption',      'consumption',     'Enter utility usage data',               'consumption',    2, true,  true,  true),
  (v_company_id, 'Deal Details',     'deal-details',    'Confirm deal info and install address',  'deal_details',   3, true,  false, true),
  (v_company_id, 'Design',           'design',          'Request and review solar design',        'design',         4, true,  true,  true),
  (v_company_id, 'Proposal',         'proposal',        'Build and finalize pricing proposal',    'proposal',       5, true,  true,  true),
  (v_company_id, 'Financing',        'financing',       'Submit financing application',           'financing',      6, true,  true,  true),
  (v_company_id, 'Contracting',      'contracting',     'Send and sign install agreement',        'contracting',    7, true,  true,  true),
  (v_company_id, 'Verification',     'verification',    'Pre-submission QA checklist',            'verification',   8, true,  true,  true),
  (v_company_id, 'Submission',       'checklist',       'Submit to ops for intake review',        'checklist',      9, true,  true,  true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. GATE DEFINITIONS
-- ============================================================
INSERT INTO gate_definitions (company_id, name, description, gate_type, required_for_stage, display_order, is_required, is_active) VALUES
  -- Proposal gates
  (v_company_id, 'Design Complete',      'Design must be completed before proposal',     'auto_status',       'proposal_sent',      1, true, true),
  (v_company_id, 'Pricing Calculated',   'Pricing must be calculated',                   'manual_check',      'proposal_sent',      2, true, true),
  (v_company_id, 'Lender Selected',      'Lender/product must be selected',              'manual_check',      'proposal_sent',      3, true, true),

  -- Financing gates
  (v_company_id, 'Proposal Finalized',   'Proposal must be finalized before financing',  'auto_status',       'financing_applied',  1, true, true),
  (v_company_id, 'Lender Credentials',   'Rep must have verified lender credentials',    'manual_check',      'financing_applied',  2, true, true),

  -- Contract gates
  (v_company_id, 'Financing Approved',   'Financing must be approved',                   'auto_status',       'contract_sent',      1, true, true),
  (v_company_id, 'Stips Cleared',        'All stipulations must be cleared',             'auto_status',       'contract_sent',      2, false, true),

  -- Submission gates
  (v_company_id, 'Contract Signed',      'Install agreement must be signed',             'auto_status',       'submission_ready',   1, true, true),
  (v_company_id, 'Utility Bill Upload',  'Utility bill must be uploaded',                'file_uploaded',     'submission_ready',   2, true, true),
  (v_company_id, 'ID Verification',      'Customer ID must be uploaded',                 'file_uploaded',     'submission_ready',   3, true, true),
  (v_company_id, 'Manager Approval',     'Manager must approve for submission',          'approval_required', 'submitted',          1, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. TEST CONTACTS
-- ============================================================
INSERT INTO contacts (id, company_id, first_name, last_name, email, phone,
  address, city, state, zip, latitude, longitude,
  utility_company, monthly_electric_bill, annual_usage_kwh,
  contact_type, owner_id) VALUES
  -- FL contact with good design data
  (v_contact_1, v_company_id, 'Sarah', 'Johnson', 'sarah.j@test.com', '555-100-0001',
   '1234 Palm Ave', 'Tampa', 'FL', '33601', 27.9506, -82.4572,
   'Tampa Electric', 285.00, 18000,
   'customer', v_closer_id),
  -- CA contact
  (v_contact_2, v_company_id, 'Michael', 'Chen', 'michael.c@test.com', '555-100-0002',
   '901 Mears Ct', 'Stanford', 'CA', '94305', 37.4275, -122.1697,
   'PG&E', 350.00, 22000,
   'customer', v_closer_id),
  -- TX contact
  (v_contact_3, v_company_id, 'James', 'Williams', 'james.w@test.com', '555-100-0003',
   '5678 Ranch Rd', 'Austin', 'TX', '78701', 30.2672, -97.7431,
   'Austin Energy', 310.00, 20000,
   'customer', v_closer_id),
  -- Lead (no deal yet)
  (v_contact_4, v_company_id, 'Maria', 'Garcia', 'maria.g@test.com', '555-100-0004',
   '789 Oak St', 'Orlando', 'FL', '32801', 28.5383, -81.3792,
   'OUC', 225.00, 14000,
   'lead', v_closer_id),
  -- Small system contact (for testing small system adders)
  (v_contact_5, v_company_id, 'David', 'Lee', 'david.l@test.com', '555-100-0005',
   '321 Elm St', 'Miami', 'FL', '33101', 25.7617, -80.1918,
   'FPL', 150.00, 8000,
   'customer', v_closer_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. TEST DEALS (various stages for testing)
-- ============================================================

-- Deal 1: Design complete, ready for proposal (FL, 8kW system)
INSERT INTO deals (id, company_id, contact_id, deal_number, closer_id, setter_id, office_id,
  stage, install_address, install_city, install_state, install_zip, install_lat, install_lng,
  system_size_kw, panel_count, panel_model, inverter_model,
  annual_production_kwh, annual_usage_kwh, offset_percentage,
  monthly_kwh, annual_kwh, utility_company, monthly_bill,
  design_status, design_completed_at, target_offset,
  source) VALUES
  (v_deal_1, v_company_id, v_contact_1, 'KIN-2026-00001', v_closer_id, NULL, v_office_id,
   'design_complete', '1234 Palm Ave', 'Tampa', 'FL', '33601', 27.9506, -82.4572,
   8.20, 20, 'Hanwha Q Cells Q.PEAK DUO BLK ML-G10+ 410W', 'SolarEdge SE7600H',
   13200, 18000, 73.3,
   '[1200, 1300, 1500, 1600, 1800, 2000, 2100, 1900, 1700, 1500, 1300, 1100]'::jsonb, 18000,
   'Tampa Electric', 285.00,
   'design_completed', NOW() - INTERVAL '2 hours', 105,
   'repcard')
ON CONFLICT (id) DO NOTHING;

-- Deal 2: Design complete, ready for proposal (CA, 10kW system)
INSERT INTO deals (id, company_id, contact_id, deal_number, closer_id, setter_id, office_id,
  stage, install_address, install_city, install_state, install_zip, install_lat, install_lng,
  system_size_kw, panel_count, panel_model, inverter_model,
  annual_production_kwh, annual_usage_kwh, offset_percentage,
  monthly_kwh, annual_kwh, utility_company, monthly_bill,
  design_status, design_completed_at, target_offset,
  source) VALUES
  (v_deal_2, v_company_id, v_contact_2, 'KIN-2026-00002', v_closer_id, NULL, v_office_id,
   'design_complete', '901 Mears Ct', 'Stanford', 'CA', '94305', 37.4275, -122.1697,
   10.25, 25, 'REC Alpha Pure-R 410W', 'Enphase IQ8M-72-2-US',
   16500, 22000, 75.0,
   '[1600, 1700, 1900, 2000, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500]'::jsonb, 22000,
   'PG&E', 350.00,
   'design_completed', NOW() - INTERVAL '1 hour', 105,
   'repcard')
ON CONFLICT (id) DO NOTHING;

-- Deal 3: Appointment sat, no design yet (TX)
INSERT INTO deals (id, company_id, contact_id, deal_number, closer_id, setter_id, office_id,
  stage, install_address, install_city, install_state, install_zip, install_lat, install_lng,
  design_status, source) VALUES
  (v_deal_3, v_company_id, v_contact_3, 'KIN-2026-00003', v_closer_id, NULL, v_office_id,
   'appointment_sat', '5678 Ranch Rd', 'Austin', 'TX', '78701', 30.2672, -97.7431,
   'not_started', 'repcard')
ON CONFLICT (id) DO NOTHING;

-- Deal 4: Design complete, SMALL system (3.5kW — triggers small system adders)
INSERT INTO deals (id, company_id, contact_id, deal_number, closer_id, setter_id, office_id,
  stage, install_address, install_city, install_state, install_zip, install_lat, install_lng,
  system_size_kw, panel_count, panel_model, inverter_model,
  annual_production_kwh, annual_usage_kwh, offset_percentage,
  monthly_kwh, annual_kwh, utility_company, monthly_bill,
  design_status, design_completed_at, target_offset,
  source) VALUES
  (v_deal_4, v_company_id, v_contact_5, 'KIN-2026-00004', v_closer_id, NULL, v_office_id,
   'design_complete', '321 Elm St', 'Miami', 'FL', '33101', 25.7617, -80.1918,
   3.28, 8, 'Hanwha Q Cells Q.PEAK DUO BLK ML-G10+ 410W', 'SolarEdge SE3800H',
   5200, 8000, 65.0,
   '[550, 600, 700, 750, 800, 850, 800, 750, 700, 650, 600, 550]'::jsonb, 8000,
   'FPL', 150.00,
   'design_completed', NOW() - INTERVAL '30 minutes', 105,
   'repcard')
ON CONFLICT (id) DO NOTHING;

-- Deal 5: New lead (no design, no appointment)
INSERT INTO deals (id, company_id, contact_id, deal_number, closer_id, office_id,
  stage, install_address, install_city, install_state, install_zip,
  design_status, source) VALUES
  (v_deal_5, v_company_id, v_contact_4, 'KIN-2026-00005', v_closer_id, v_office_id,
   'new_lead', '789 Oak St', 'Orlando', 'FL', '32801',
   'not_started', 'repcard')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE. Summary:
-- 3 installer markets (FL, CA, TX)
-- 10 lenders + 12 lender products
-- 3 pricing configs (default + FL + CA)
-- 36 adder templates across 8 categories
-- 13 adder scope rules
-- 9 workflow step definitions
-- 11 gate definitions
-- 5 test contacts
-- 5 test deals (various stages + system sizes)
-- ============================================================

RAISE NOTICE 'Epic 7 seed data loaded successfully.';
RAISE NOTICE 'Deal 1 (KIN-2026-00001): FL 8.2kW — ready for proposal';
RAISE NOTICE 'Deal 2 (KIN-2026-00002): CA 10.25kW — ready for proposal';
RAISE NOTICE 'Deal 3 (KIN-2026-00003): TX — appointment sat, no design';
RAISE NOTICE 'Deal 4 (KIN-2026-00004): FL 3.28kW — small system, tests adder triggers';
RAISE NOTICE 'Deal 5 (KIN-2026-00005): FL — new lead';

END $$;
