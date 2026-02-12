# Epic 7: Proposal & Pricing Engine — Implementation Plan

## Overview

The proposal is the **pivot point** of the deal. It combines a design + adders + discounts + lender product and calculates the total price. Finalizing a proposal locks it and gates downstream steps (financing, contracting).

Closers typically create **multiple proposals** per deal to show options side by side (e.g., loan vs lease, with/without battery). One gets finalized.

**All core schema tables already exist** in kinos-migration-v1.sql. Small migration needed for enhancements discovered during planning.

---

## Migration 011: Epic 7 Schema Enhancements

### File: `supabase/migrations/011_proposal_pricing_enhancements.sql`

```sql
-- 1. Pricing configs: scope to market/office (not just company-wide)
ALTER TABLE pricing_configs 
  ADD COLUMN IF NOT EXISTS installer_market_id UUID REFERENCES installer_markets(id),
  ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id);

-- Resolution waterfall: office → market → company default
-- Query: find most specific active config for this deal's context
CREATE INDEX IF NOT EXISTS idx_pricing_configs_market ON pricing_configs(installer_market_id);
CREATE INDEX IF NOT EXISTS idx_pricing_configs_office ON pricing_configs(office_id);

-- 2. Adder templates: tiered pricing support
ALTER TABLE adder_templates
  ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_customer_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_manual_toggle BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_auto_apply BOOLEAN DEFAULT false;

-- pricing_tiers example for Trenching:
-- [{"label": "0-50ft", "amount": 1500}, {"label": "50-100ft", "amount": 2500}]
-- pricing_tiers example for Flat Roof PPW:
-- [{"label": "Low pitch", "ppw": 0.05}, {"label": "Steep pitch", "ppw": 0.15}]
-- When pricing_tiers is NOT NULL, UI shows a tier dropdown instead of default_amount.

-- 3. Adder scope rules: add system_size scope type
-- Already supports: market, state, city, zipcode, equipment, deal_template, sales_team, lender
-- ADD: system_size with min/max in scope_values
-- Format: scope_type = 'system_size', scope_values = ['min:4000', 'max:6000'] (watts)
-- No schema change needed — scope_values is TEXT[], evaluator handles the format.

-- 4. Proposal: add goal-seek tracking
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS is_goal_seek BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_seek_target_gross DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS original_base_ppw DECIMAL(8,4);
-- When closer uses goal-seek, we store the original PPW + target for audit trail.
```

---

## Phase 1: Pricing Engine (Pure Logic, Zero Side Effects)

### Install dependency
```bash
npm install big.js && npm install -D @types/big.js
```

### File: `lib/utils/pricing.ts`

All pure functions. Big.js for money math. No database calls. No side effects.

#### Core Types

```typescript
import Big from 'big.js';

// --- INPUTS ---

interface PricingInputs {
  systemSizeWatts: Big;           // From design: system_size_kw * 1000
  basePPW: Big;                   // From pricing config (resolved by market/office)
  basePPWAdjustments: Big[];      // Market/team PPW adjustments
  equipment: CalculatedEquipment[];
  systemAdders: CalculatedAdder[];  // Auto-applied by rules engine
  valueAdders: CalculatedAdder[];   // Rep-selected (manual toggle)
  discounts: CalculatedDiscount[];
  rebates: CalculatedRebate[];
  dealerFeePercent: Big;          // Sales-facing dealer fee (includes KIN margin)
  downPayment: Big;
  taxRate: Big;                   // State-specific (most solar states = 0)
  financeProduct: FinanceProduct | null;
  stateCode: string;
  rounding: { scale: number; mode: number };
}

interface CalculatedAdder {
  id: string;
  name: string;
  pricingType: 'fixed_amount' | 'price_per_watt' | 'custom';
  amount: Big;          // Dollar amount OR per-watt rate
  quantity: number;     // Default 1
  total: Big;           // Calculated: fixed=amount*qty, ppw=amount*systemWatts
  ppw: Big;             // This adder expressed as PPW
  isAutoApplied: boolean;
  isCustomerFacing: boolean;
  eligibleForItc: boolean;
  tier?: string;        // Selected tier label if tiered adder
}

interface CalculatedDiscount {
  id: string;
  name: string;
  discountType: 'fixed_amount' | 'percentage' | 'per_watt';
  amount: Big;
  total: Big;
  ppw: Big;
  isCustomerFacing: boolean;
}

interface CalculatedRebate {
  id: string;
  name: string;
  amount: Big;
  reducesGross: boolean;  // Applied before financing
  reducesNet: boolean;    // Applied after financing (e.g., ITC)
  isFederalItc: boolean;
}

interface FinanceProduct {
  lenderSlug: string;
  lenderType: 'loan' | 'tpo' | 'ppa' | 'lease' | 'cash';
  termMonths: number;
  rate: Big;              // APR for loans, escalator for TPO
  ratePerKwh?: Big;       // For PPA
  dealerFeePercent: Big;  // Sales-facing (includes KIN markup)
  lenderDealerFee: Big;   // Actual lender fee (hidden)
  kinMargin: Big;         // Delta = KIN's margin
}

// --- OUTPUTS ---

interface PricingOutput {
  // Core waterfall
  basePPW: Big;
  baseCost: Big;                          // systemSizeWatts × basePPW
  equipmentTotal: Big;
  systemAddersTotal: Big;
  valueAddersTotal: Big;
  addersAndEquipmentTotal: Big;
  baseCostWithAddersAndEquipment: Big;

  // Tax layer
  taxTotal: Big;
  baseCostWithTax: Big;

  // Dealer fee layer
  dealerFeeFactor: Big;
  dealerFee: Big;
  baseCostWithDealerFees: Big;

  // Discount layer
  discountsTotal: Big;
  grossCostBeforeRebates: Big;

  // Rebate layer
  rebatesReducingGross: Big;
  grossCost: Big;
  rebatesReducingNet: Big;
  federalRebateTotal: Big;

  // Finance layer
  financeCost: Big;
  netCost: Big;

  // PPW variants
  baseCostPPW: Big;
  grossPPW: Big;
  grossBeforeRebatesPPW: Big;
  netPPW: Big;

  // Commission
  commissionBase: Big;
  commissionBasePPW: Big;

  // Monthly payment
  monthlyPayment: Big | null;

  // Itemized breakdowns (for UI display)
  calculatedEquipment: CalculatedEquipment[];
  calculatedSystemAdders: CalculatedAdder[];
  calculatedValueAdders: CalculatedAdder[];
  calculatedDiscounts: CalculatedDiscount[];
  calculatedRebates: CalculatedRebate[];
}
```

#### Functions to Implement

1. **`calculatePricing(inputs: PricingInputs): PricingOutput`**
   Full waterfall from blueprint §6.9:
   - Base PPW (with adjustments) × system watts = base cost
   - \+ Equipment total
   - \+ System adders (auto-applied)
   - \+ Value adders (rep-selected)
   - \+ Tax (state-specific, usually 0 for solar)
   - ÷ Dealer fee factor (gross-up for positive fees)
   - − Discounts
   - − Rebates (gross-reducing)
   - = Gross cost
   - − Down payment + lender adjustments
   - − Rebates (net-reducing, including ITC)
   - = Net cost
   - All PPW variants calculated
   - Monthly payment calculated

2. **`calculateAdderTotal(adders: CalculatedAdder[]): Big`**
   Sum of all adder totals.

3. **`calculateDealerFee(baseCostWithAddersAndTax: Big, dealerFeePercent: Big): { factor: Big, feeAmount: Big, grossedUpCost: Big }`**
   Gross-up math. Positive fee: `cost / (1 - fee%)`. Negative fee: `cost / (1 / (1 + |fee%|))`.

4. **`calculateITC(grossCostBeforeRebates: Big, itcRate?: Big): Big`**
   Federal ITC. Default 30% through 2032. Returns dollar amount.

5. **`goalSeekPPW(targetGrossCost: Big, systemSizeWatts: Big, addersAndEquipmentTotal: Big, taxRate: Big, dealerFeePercent: Big, discountsTotal: Big, minPPW: Big, maxPPW: Big): Big | null`**
   Inverse solve: closer enters desired gross cost, engine returns required base PPW.
   Returns null if result falls outside admin-configured min/max bounds.
   Formula: work backwards through the waterfall to isolate basePPW.

6. **`calculateMonthlyPayment(financeCost: Big, rate: Big, termMonths: number, lenderType: string): Big | null`**
   - Loan: standard amortization `P * r(1+r)^n / ((1+r)^n - 1)`
   - TPO/Lease: `rate_per_kwh × estimated_monthly_production` or flat amount
   - Cash: null

7. **`calculateCommissionBase(grossCostBeforeRebates: Big, dealerFee: Big): Big`**
   `grossCostBeforeRebates - dealerFee`. Flows to Quickbase/Sequifi.

8. **`calculateAdderAmount(adder: AdderTemplate, systemSizeWatts: Big, quantity: number, tierSelection?: string, customAmount?: Big): CalculatedAdder`**
   Resolves a single adder template into a calculated amount:
   - `fixed_amount`: `defaultAmount × quantity`
   - `price_per_watt`: `defaultAmount × systemSizeWatts`
   - `custom`: uses `customAmount` (rep-entered)
   - If tiered: looks up selected tier from `pricing_tiers` JSON

9. **`resolveApplicableAdders(templates: AdderTemplate[], scopeRules: AdderScopeRule[], dealContext: DealContext): ApplicableAdder[]`**
   Evaluates which adder templates apply to this deal based on scope rules:
   - `market` → match deal's installer market
   - `state` → match deal's state code
   - `equipment` → match design's panel/inverter/battery models
   - `lender` → match selected lender
   - `system_size` → parse `min:XXXX` / `max:XXXX` from scope_values, compare to system watts
   - `deal_template` → match deal type
   - `sales_team` → match closer's team
   - Empty scope = available everywhere
   - `is_required` on scope rule = auto-apply (system adder)
   - Otherwise = available for manual toggle (value adder)

#### Unit Tests: `lib/utils/__tests__/pricing.test.ts`

Test cases:
- Standard 8kW system, $3.25 PPW, 2 fixed adders, GoodLeap 25yr loan, 25% dealer fee
- Goal-seek: target $45,000 gross, verify PPW within bounds
- Goal-seek: target impossible (below min PPW), returns null
- Zero adders, zero discounts (simplest case)
- TPO monthly payment calculation
- System size adder: 3.5kW system triggers "Small System < 4kW" adder
- Equipment adder: Enphase inverter triggers per-watt adder
- Lender adder: GoodLeap TPO selected triggers TPO adder
- Negative dealer fee handling
- ITC calculation on gross cost

---

## Phase 2: Seed Data

### File: `supabase/seed/epic7-pricing-seed.sql`

**NOTE: Austin must verify all dollar amounts, rates, and dealer fees before this runs in production. These are reasonable defaults based on Enerflo screenshots and solar industry standards.**

#### Installer Markets
```sql
-- Florida, California, Texas (minimum viable)
INSERT INTO installer_markets (company_id, name, states, is_active)
VALUES
  ('<COMPANY_ID>', 'Florida', ARRAY['FL'], true),
  ('<COMPANY_ID>', 'California', ARRAY['CA'], true),
  ('<COMPANY_ID>', 'Texas', ARRAY['TX'], true);
```

#### Pricing Configs
```sql
-- Company-wide default
INSERT INTO pricing_configs (company_id, name, base_ppw, min_ppw, max_ppw, is_active, effective_date)
VALUES ('<COMPANY_ID>', 'Default 2026', 3.25, 2.50, 5.00, true, '2026-01-01');

-- Per-market overrides (Austin: fill in real numbers)
-- INSERT INTO pricing_configs (company_id, installer_market_id, name, base_ppw, min_ppw, max_ppw, ...)
-- VALUES ('<COMPANY_ID>', '<FL_MARKET_ID>', 'Florida 2026', 3.10, 2.40, 4.80, ...);
```

#### Lenders
```sql
INSERT INTO lenders (company_id, name, slug, lender_type, is_integrated, status) VALUES
  ('<CID>', 'GoodLeap (Loans)', 'goodleap-loans', 'loan', true, 'active'),
  ('<CID>', 'GoodLeap (TPO)', 'goodleap-tpo', 'tpo', true, 'active'),
  ('<CID>', 'LightReach', 'lightreach', 'lease', true, 'active'),
  ('<CID>', 'Mosaic', 'mosaic', 'loan', true, 'active'),
  ('<CID>', 'Sunlight', 'sunlight', 'loan', true, 'active'),
  ('<CID>', 'Dividend', 'dividend', 'loan', true, 'active'),
  ('<CID>', 'Enfin', 'enfin', 'loan', true, 'active'),
  ('<CID>', 'Climate First', 'climate-first', 'loan', true, 'active'),
  ('<CID>', 'Sunnova', 'sunnova', 'tpo', true, 'active'),
  ('<CID>', 'Cash', 'cash', 'cash', false, 'active');
-- Austin: confirm this list. Missing any?
```

#### Lender Products (Austin: fill in real rates + dealer fees)
```sql
-- Example structure — Austin must provide real values
INSERT INTO lender_products (lender_id, name, product_code, term_months, apr, lender_dealer_fee, sales_facing_dealer_fee, status) VALUES
  ('<GOODLEAP_LOANS_ID>', '25yr 1.49%', 'GL-25-149', 300, 0.0149, 0.2200, 0.2500, 'active'),
  ('<GOODLEAP_LOANS_ID>', '25yr 2.99%', 'GL-25-299', 300, 0.0299, 0.1800, 0.2100, 'active'),
  ('<GOODLEAP_LOANS_ID>', '25yr 3.99%', 'GL-25-399', 300, 0.0399, 0.1400, 0.1700, 'active');
-- ... repeat for each lender
-- CRITICAL: lender_dealer_fee vs sales_facing_dealer_fee is KIN's margin engine.
-- The delta (kin_markup) is auto-calculated by the GENERATED ALWAYS AS column.
```

#### Adder Templates (from Enerflo screenshots)

```sql
-- ACTIVE adders extracted from Enerflo (both pages)
-- Format: name, status, pricing_type, default_amount, is_auto_apply, is_manual_toggle, is_customer_visible, category

INSERT INTO adder_templates (company_id, name, pricing_type, default_amount, is_auto_apply, is_manual_toggle, is_customer_visible, category, is_active, pricing_tiers) VALUES

-- === BATTERIES ===
('<CID>', '10kW Enphase Battery', 'fixed_amount', 15000, false, true, true, 'battery', true, NULL),
('<CID>', '10kWh Battery', 'custom', NULL, true, false, true, 'battery', true, NULL),
('<CID>', 'Enphase Sunlight Backup', 'fixed_amount', 5000, false, true, true, 'battery', true, NULL),
('<CID>', 'FranklinWH Home Power 10kW', 'fixed_amount', 15000, true, false, true, 'battery', true, NULL),
('<CID>', 'SolArk w/Homegrid 38.4kw Battery (Whole Home)', 'fixed_amount', 35000, false, true, true, 'battery', true, NULL),

-- === ELECTRICAL ===
('<CID>', 'Sub Panel', 'fixed_amount', 1500, false, true, true, 'electrical', true, NULL),
('<CID>', 'MPU', 'custom', NULL, false, true, false, 'electrical', true, NULL),
('<CID>', 'De-rate Breaker (CA)', 'fixed_amount', 700, false, true, false, 'electrical', true, NULL),
('<CID>', 'Electrical Upgrade If Needed', 'custom', NULL, false, false, true, 'electrical', true, NULL),
('<CID>', 'LR - Electrical Upgrade', 'fixed_amount', 3500, true, false, true, 'electrical', true, NULL),
('<CID>', 'Production Meter Collar', 'fixed_amount', 3000, false, true, false, 'electrical', true, NULL),
('<CID>', 'Natural Gas Fuel Line', 'fixed_amount', 2500, false, true, true, 'electrical', true, NULL),

-- === ROOF ===
('<CID>', 'Flat Roof', 'price_per_watt', NULL, true, false, false, 'roof', true,
  '[{"label": "Standard", "ppw": 0.10}, {"label": "Steep", "ppw": 0.20}]'::jsonb),
('<CID>', 'Metal Roof', 'price_per_watt', 0.10, false, true, false, 'roof', true, NULL),
('<CID>', 'Metal Roof Adder', 'price_per_watt', 0.10, false, true, false, 'roof', true, NULL),
('<CID>', 'Tile Roof', 'price_per_watt', NULL, true, false, false, 'roof', true,
  '[{"label": "Standard", "ppw": 0.15}, {"label": "Premium", "ppw": 0.25}]'::jsonb),
('<CID>', 'Re-Roof', 'custom', NULL, false, true, true, 'roof', true, NULL),
('<CID>', 'Attic Insulation', 'custom', NULL, false, true, true, 'roof', true, NULL),
('<CID>', 'Relocate Pipe Vent', 'custom', NULL, false, true, true, 'roof', true, NULL),

-- === SITE ===
('<CID>', 'Ground Mount', 'price_per_watt', 0.80, true, false, false, 'site', true, NULL),
('<CID>', '(Aurora) Ground Mount', 'price_per_watt', 0.80, false, true, true, 'site', true, NULL),
('<CID>', 'Trenching (Dirt)', 'custom', NULL, false, true, true, 'site', true,
  '[{"label": "0-50ft", "amount": 1500}, {"label": "50-100ft", "amount": 2500}, {"label": "100ft+", "amount": 3500}]'::jsonb),
('<CID>', 'Trenching (Concrete)', 'custom', NULL, false, true, true, 'site', true, NULL),
('<CID>', 'Tree Removal', 'custom', NULL, false, true, true, 'site', true, NULL),
('<CID>', 'Tree Trimming', 'custom', NULL, false, true, true, 'site', true, NULL),
('<CID>', 'A/C Relocation', 'fixed_amount', 2000, false, true, false, 'site', true, NULL),
('<CID>', 'Remove and Replace', 'price_per_watt', 0.87, false, true, false, 'site', true, NULL),
('<CID>', 'Thermal Solar Removal', 'custom', NULL, false, true, true, 'site', true, NULL),
('<CID>', 'Lathe/Stucco Inspection (LP)', 'fixed_amount', 500, false, true, false, 'site', true, NULL),
('<CID>', 'HVAC', 'custom', NULL, false, true, true, 'site', true, NULL),

-- === SYSTEM SIZE ===
('<CID>', 'Small System < 4kW', 'fixed_amount', 2500, true, false, false, 'system_size', true, NULL),
('<CID>', 'Small System 4kw-6kw', 'fixed_amount', 1250, true, false, false, 'system_size', true, NULL),
('<CID>', 'FL Small System <5kW', 'fixed_amount', 950, true, false, false, 'system_size', true, NULL),
('<CID>', 'CA Small System Adder - 10 panels or less', 'fixed_amount', 2000, true, false, true, 'system_size', true, NULL),

-- === LENDER-SPECIFIC (auto-apply when lender selected) ===
('<CID>', 'Enfin TPO Adder', 'price_per_watt', 0.10, true, false, false, 'lender', true, NULL),
('<CID>', 'GoodLeap TPO Adder', 'price_per_watt', NULL, true, false, false, 'lender', true,
  '[{"label": "Standard", "ppw": 0.10}, {"label": "Premium", "ppw": 0.15}]'::jsonb),
('<CID>', 'LightReach TPO Adder', 'price_per_watt', 0.10, true, false, false, 'lender', true, NULL),
('<CID>', 'Sunnova TPO Adder', 'price_per_watt', 0.10, true, false, false, 'lender', true, NULL),

-- === FEES ===
('<CID>', 'Dealer Fee (Kin Capital)', 'custom', NULL, false, true, false, 'fee', true, NULL),
('<CID>', 'Cancellation Fee', 'custom', NULL, false, true, false, 'fee', true, NULL),
('<CID>', 'Site Survey', 'fixed_amount', 250, true, false, false, 'fee', true, NULL),
('<CID>', 'OOM Distance Adder', 'fixed_amount', 500, true, false, false, 'fee', true, NULL),
('<CID>', 'EXTRA LONG DISTANCE ADDER', 'fixed_amount', 1000, true, false, false, 'fee', true, NULL),
('<CID>', 'Tier 2', 'fixed_amount', 1250, true, false, false, 'fee', true, NULL),

-- === GENERATORS ===
('<CID>', '24kW Generac Generator', 'fixed_amount', 16250, false, true, true, 'generator', true, NULL),

-- === OTHER ===
('<CID>', 'Solar Attic Fan', 'fixed_amount', 850, false, true, true, 'other', true, NULL),
('<CID>', 'MMU', 'custom', NULL, false, true, false, 'other', true, NULL),
('<CID>', 'AMP Smart Tax Service', 'fixed_amount', 850, false, true, true, 'other', true, NULL);

-- NOTE: Draft/inactive adders from Enerflo NOT included:
-- AMP Smart Module Adder (Draft), Amp Smart Smart Home (Draft), AMP Smart Team (Draft), 
-- Tariff(AMP Smart) (Draft), 10kW Enphase Battery (Draft)
```

#### Adder Scope Rules (auto-apply triggers)
```sql
-- System size triggers
INSERT INTO adder_scope_rules (adder_template_id, scope_type, scope_values, is_required) VALUES
  ('<SMALL_SYSTEM_4KW_ID>', 'system_size', ARRAY['max:4000'], true),
  ('<SMALL_SYSTEM_4_6KW_ID>', 'system_size', ARRAY['min:4000', 'max:6000'], true),
  ('<FL_SMALL_5KW_ID>', 'system_size', ARRAY['max:5000'], true),
  ('<CA_SMALL_10PANEL_ID>', 'system_size', ARRAY['max:4100'], true);  -- ~10 panels × 410W

-- State triggers
INSERT INTO adder_scope_rules (adder_template_id, scope_type, scope_values, is_required) VALUES
  ('<FL_SMALL_5KW_ID>', 'state', ARRAY['FL'], true),
  ('<CA_SMALL_10PANEL_ID>', 'state', ARRAY['CA'], true),
  ('<DERATE_BREAKER_CA_ID>', 'state', ARRAY['CA'], false);

-- Lender triggers (auto-apply TPO adders when lender selected)
INSERT INTO adder_scope_rules (adder_template_id, scope_type, scope_values, is_required) VALUES
  ('<ENFIN_TPO_ADDER_ID>', 'lender', ARRAY['enfin'], true),
  ('<GOODLEAP_TPO_ADDER_ID>', 'lender', ARRAY['goodleap-tpo'], true),
  ('<LIGHTREACH_TPO_ADDER_ID>', 'lender', ARRAY['lightreach'], true),
  ('<SUNNOVA_TPO_ADDER_ID>', 'lender', ARRAY['sunnova'], true);
```

---

## Phase 3: Server Actions & Data Layer

### File: `lib/actions/proposals.ts`

```typescript
'use server'

// 1. getProposalsByDeal(dealId: string)
//    Returns all proposals for a deal with adders, discounts, lender info.
//    Ordered by display_order. Includes status badge (draft/ready/finalized/superseded).

// 2. createProposal(dealId: string)
//    Creates draft proposal, snapshots design data from deal:
//    - system_size_kw, panel_count, panel_model, panel_wattage, inverter_model
//    - annual_production_kwh, annual_consumption_kwh, offset_percentage
//    Names it "Proposal N" based on count.
//    Loads active pricing config → sets initial base_ppw.
//    Runs adder rules → pre-populates auto-applied adders.

// 3. updateProposal(proposalId: string, data: ProposalUpdateData)
//    Updates pricing inputs. Recalculates full waterfall.
//    Saves calculated outputs to proposal row + proposal_adders/discounts.
//    Does NOT advance deal stage (that's finalize).

// 4. finalizeProposal(proposalId: string, userId: string)
//    Guards:
//    - Only assigned closer or admin can finalize
//    - Lender credential check (user_lender_credentials)
//    - Completeness: design linked, pricing calculated, lender selected (unless cash)
//    Actions:
//    - Supersede any previously finalized proposal on this deal
//    - Set status='finalized', finalized_at, finalized_by
//    - Set deal.active_proposal_id = this proposal
//    - Advance deal stage to 'proposal_sent' (or 'proposal_accepted' if skipping presentation)
//    - Log activity
//    - Trigger Aurora pricing sync (if enabled)

// 5. unfinalizeProposal(proposalId: string, userId: string)
//    Admin-only. Unlocks proposal back to 'draft'. Clears deal.active_proposal_id.

// 6. deleteProposal(proposalId: string)
//    Only drafts. Cascades to proposal_adders and proposal_discounts.

// 7. duplicateProposal(proposalId: string)
//    Clones as new draft with all adders/discounts. Name = "Proposal N (copy)".
//    Use case: "show them the same system with LightReach instead of GoodLeap"
```

### File: `lib/actions/pricing-data.ts`

```typescript
'use server'

// 1. getActivePricingConfig(companyId: string, marketId?: string, officeId?: string)
//    Resolution waterfall: office → market → company default.
//    Returns base_ppw, min_ppw, max_ppw.

// 2. getAdderTemplatesForDeal(deal: Deal)
//    Loads all active adder_templates + their scope_rules.
//    Evaluates each against deal context:
//    - deal.state, deal.installer_market, deal.system_size_kw
//    - deal.panel_model, deal.inverter_model (equipment match)
//    - deal.lender_slug (lender match)
//    Returns: { autoApplied: AdderTemplate[], manualToggle: AdderTemplate[] }

// 3. getLendersWithProducts(companyId: string, stateCode?: string)
//    Active lenders + active products.
//    If stateCode provided, filters products by available_states.
//    Includes dealer fee info (sales-facing, not actual lender fee).

// 4. getInstallerMarket(stateCode: string, city?: string, zipcode?: string)
//    Resolve deal address → installer market.
//    Match: zipcode → city → state (most specific wins).
```

### File: `lib/actions/aurora-pricing-sync.ts`

```typescript
'use server'

// 1. syncPricingToAurora(dealId: string)
//    Only runs if deal has aurora_design_id.
//    Steps from blueprint §6.7:
//    a. Delete previously-synced KinOS adders from Aurora
//    b. Push base PPW to Aurora design pricing
//    c. Push KinOS-calculated adders to Aurora design adders
//    d. Log sync in aurora_pricing_syncs table

// 2. logAuroraPricingSync(dealId: string, syncData: SyncPayload)
//    Audit trail. Stores payload_sent, response_received, aurora_adder_ids.
```

---

## Phase 4: Proposal Step UI

### File: `components/deals/proposal-step.tsx`

Main stepper component. Available when deal is at `design_complete` or later.

**Layout sections (top to bottom):**

1. **Design Summary Banner** — read-only snapshot from design
   - System size, panel count, model, production, offset

2. **Proposal Tabs** — one tab per proposal + "New Proposal" button
   - Active/finalized proposal highlighted
   - "Duplicate" and "Delete" actions on draft proposals

3. **Pricing Card** (`components/deals/proposal-pricing-card.tsx`)
   - Base PPW input (editable, validates against min/max)
   - Base Cost display (PPW × system watts, live-calculated)
   - OR Goal-Seek input: "Target Gross Cost: $[____]" → auto-calculates PPW
   - PPW slider showing min/max range with current position
   - Red validation if PPW outside bounds

4. **Adders Card** (`components/deals/proposal-adders-card.tsx`)
   - **Auto-applied section** (system adders): shown with lock icon, can't be toggled off
     - Small system adders, lender-specific adders, equipment adders
   - **Manual toggle section** (value adders): checkboxes
     - Each shows name, pricing type, amount, total
     - Tiered adders: dropdown to select tier
     - Custom adders: dollar input field for rep to enter amount
     - PPW adders: shows calculated total based on system size
   - Running adder total at bottom

5. **Financing Card** (`components/deals/proposal-financing-card.tsx`)
   - Lender dropdown (filtered by state availability)
   - Product dropdown (filtered by selected lender)
   - Dealer fee display: "25.00%" (sales-facing, read-only — set by product)
   - Monthly payment: auto-calculated
   - For TPO/lease: show escalator %, rate/kWh

6. **Summary Card** (`components/deals/proposal-summary-card.tsx`)
   - Full waterfall breakdown:
     Base Cost → + Adders → + Dealer Fee → - Discounts → = Gross Cost ($/W)
     → - ITC (30%) → = Net Cost ($/W) → Monthly Payment
   - Commission base (visible to closer)

7. **Actions**
   - [Save Draft] — saves without advancing
   - [Finalize Proposal] — runs all guards, locks proposal, advances deal
   - Finalized proposals show "Unfinalize" (admin only)

**Key UX behaviors:**
- All pricing recalculates live on input change (debounced 300ms)
- Goal-seek: type target gross → PPW auto-fills → all downstream recalculates
- Lender change triggers: re-evaluate lender-specific adders, recalculate dealer fee, recalculate monthly payment
- System size from design is read-only (can't change in proposal — go back to design)
- Toast notifications on save/finalize with key numbers

### Supporting components:
- `components/deals/proposal-pricing-card.tsx`
- `components/deals/proposal-adders-card.tsx`
- `components/deals/proposal-financing-card.tsx`
- `components/deals/proposal-summary-card.tsx`
- `components/deals/proposal-list.tsx` — tab bar for multiple proposals

---

## Phase 5: Aurora Pricing Sync

Triggered on proposal finalize (if Aurora sync is enabled).

Uses `lib/actions/aurora-pricing-sync.ts` to:
1. Delete previous KinOS-synced adders from Aurora design
2. Push base PPW to Aurora design pricing endpoint
3. Push each KinOS adder to Aurora design adders endpoint
4. Log sync in aurora_pricing_syncs

This ensures Aurora's web proposal shows the same numbers as KinOS.

**Not critical for v1 launch** — can be enabled later when Aurora is used for financing presentations.

---

## Implementation Order

```
Phase 1: Pricing engine (pure functions + tests)        — 0 dependencies
Phase 2: Migration 011 + seed data                       — 0 dependencies
Phase 3: Server actions (proposals, pricing-data)        — depends on 1, 2
Phase 4: Proposal step UI                                — depends on 3
Phase 5: Aurora pricing sync                             — depends on 3 (lower priority)
```

Phases 1 and 2 can be built in parallel.

---

## What This Unlocks

- **Epic 8 (Financing):** Finalized proposal → submit to lender API
- **Epic 9 (Contracting):** Finalized proposal → merge fields into PandaDoc templates
- **Epic 10 (Submission):** Proposal data → Quickbase submission payload
- **Full closer workflow:** Design complete → build proposal(s) → compare options → finalize → finance → contract → submit

---

## Data Austin Needs to Provide Before Production Seed

1. **Lender products**: exact names, rates, terms, dealer fees (lender_dealer_fee AND sales_facing_dealer_fee) for each product
2. **Base PPW per market**: FL, CA, TX default PPW + min/max bounds
3. **Verify adder list**: confirm amounts from Enerflo screenshots are current
4. **Any adders missing** from the seed list above
