/**
 * Pure pricing engine — no DB, no side effects.
 * Implements waterfall from blueprint §6.9. All money math via Big.js.
 */

import Big from "big.js";

// --- Rounding defaults ---
const DOLLAR_SCALE = 2;
const PPW_SCALE = 4;
const ROUND_MODE = 2; // Big.js ROUND_HALF_UP

// --- Core types (plan §1.2) ---

export interface PricingInputs {
  systemSizeWatts: Big;
  basePPW: Big;
  basePPWAdjustments?: Big[];
  equipment?: CalculatedEquipment[];
  systemAdders?: CalculatedAdder[];
  valueAdders?: CalculatedAdder[];
  discounts?: CalculatedDiscount[];
  rebates?: CalculatedRebate[];
  dealerFeePercent: Big;
  downPayment?: Big;
  taxRate?: Big;
  financeProduct: FinanceProduct | null;
  stateCode?: string;
  rounding?: { scale: number; mode: number };
}

export interface PricingOutput {
  basePPW: Big;
  baseCost: Big;
  equipmentTotal: Big;
  systemAddersTotal: Big;
  valueAddersTotal: Big;
  addersAndEquipmentTotal: Big;
  baseCostWithAddersAndEquipment: Big;
  taxTotal: Big;
  baseCostWithTax: Big;
  dealerFeeFactor: Big;
  dealerFee: Big;
  baseCostWithDealerFees: Big;
  discountsTotal: Big;
  grossCostBeforeRebates: Big;
  rebatesReducingGross: Big;
  grossCost: Big;
  rebatesReducingNet: Big;
  federalRebateTotal: Big;
  financeCost: Big;
  netCost: Big;
  baseCostPPW: Big;
  grossPPW: Big;
  grossBeforeRebatesPPW: Big;
  netPPW: Big;
  commissionBase: Big;
  commissionBasePPW: Big;
  monthlyPayment: Big | null;
  calculatedEquipment: CalculatedEquipment[];
  calculatedSystemAdders: CalculatedAdder[];
  calculatedValueAdders: CalculatedAdder[];
  calculatedDiscounts: CalculatedDiscount[];
  calculatedRebates: CalculatedRebate[];
}

export interface CalculatedAdder {
  templateId?: string;
  name: string;
  pricingType: string;
  amount: Big;
  quantity: number;
  total: Big;
  ppw: Big;
  isAutoApply: boolean;
  isCustomerFacing: boolean;
  eligibleForItc: boolean;
  tierSelection?: string;
}

export interface CalculatedDiscount {
  type: string;
  amount: Big;
  total: Big;
  ppw: Big;
}

export interface CalculatedRebate {
  reducesGross?: boolean;
  reducesNet?: boolean;
  amount: Big;
  eligibleForItc?: boolean;
}

export interface CalculatedEquipment {
  name: string;
  amount: Big;
  total: Big;
}

export interface FinanceProduct {
  lenderSlug: string;
  lenderType: string;
  termMonths: number | null;
  interestRate: Big | null;
  salesFacingDealerFee: Big;
  escalatorPercent: Big | null;
  ratePerKwh: Big | null;
  estimatedMonthlyProductionKwh?: number;
}

export interface AdderTemplate {
  id: string;
  name: string;
  pricing_type: string;
  default_amount: number | null;
  pricing_tiers?: PricingTier[] | null;
  is_customer_facing?: boolean | null;
  eligible_for_itc?: boolean | null;
  is_auto_apply?: boolean | null;
  is_manual_toggle?: boolean | null;
}

export interface PricingTier {
  label: string;
  amount?: number;
  ppw?: number;
}

export interface AdderScopeRule {
  adder_template_id?: string;
  rule_type: string;
  rule_value: string;
  is_required?: boolean;
}

export interface DealContext {
  stateCode?: string;
  installerMarketId?: string;
  officeId?: string;
  systemSizeWatts: Big;
  panelModel?: string;
  inverterModel?: string;
  lenderSlug?: string;
  zipcode?: string;
  city?: string;
}

// --- Helpers ---

function sumAmounts(items: { total: Big }[]): Big {
  return items.reduce((sum, i) => sum.plus(i.total), new Big(0));
}

function sumRebatesByType(
  rebates: CalculatedRebate[],
  type: "reducesGross" | "reducesNet",
): Big {
  return rebates
    .filter((r) => r[type])
    .reduce((sum, r) => sum.plus(r.amount), new Big(0));
}

// --- 1. calculatePricing (main waterfall) ---

export function calculatePricing(inputs: PricingInputs): PricingOutput {
  const systemSizeWatts = inputs.systemSizeWatts;
  const rounding = inputs.rounding ?? { scale: DOLLAR_SCALE, mode: ROUND_MODE };
  const round = (v: Big, scale = rounding.scale) =>
    v.round(scale, rounding.mode as 0 | 1 | 2 | 3);

  const adjustments = inputs.basePPWAdjustments ?? [];
  const basePPW = adjustments.reduce(
    (sum, adj) => sum.plus(adj),
    inputs.basePPW,
  );

  const equipment = inputs.equipment ?? [];
  const systemAdders = inputs.systemAdders ?? [];
  const valueAdders = inputs.valueAdders ?? [];
  const discounts = inputs.discounts ?? [];
  const rebates = inputs.rebates ?? [];
  const taxRate = inputs.taxRate ?? new Big(0);
  const downPayment = inputs.downPayment ?? new Big(0);

  const equipmentTotal = sumAmounts(equipment);
  const systemAddersTotal = sumAmounts(systemAdders);
  const valueAddersTotal = sumAmounts(valueAdders);
  const addersAndEquipmentTotal = equipmentTotal
    .plus(systemAddersTotal)
    .plus(valueAddersTotal);
  const baseCost = round(systemSizeWatts.times(basePPW));
  const baseCostWithAddersAndEquipment = baseCost.plus(addersAndEquipmentTotal);

  const taxTotal = round(baseCostWithAddersAndEquipment.times(taxRate));
  const baseCostWithTax = baseCost.plus(taxTotal);

  const {
    feeAmount: dealerFee,
    factor: dealerFeeFactor,
    grossedUpCost,
  } = calculateDealerFee(
    baseCostWithAddersAndEquipment.plus(taxTotal),
    inputs.dealerFeePercent,
    rounding,
  );
  const baseCostWithDealerFees = grossedUpCost;

  const discountsTotal = sumAmounts(discounts);
  const grossCostBeforeRebates = baseCostWithDealerFees.minus(discountsTotal);

  const rebatesReducingGross = sumRebatesByType(rebates, "reducesGross");
  const grossCost = grossCostBeforeRebates.minus(rebatesReducingGross);

  const federalRebateTotal = calculateITC(grossCostBeforeRebates, new Big(0.3));
  const rebatesReducingNet = sumRebatesByType(rebates, "reducesNet").plus(
    federalRebateTotal,
  );

  let financeCost = grossCost.minus(downPayment);
  const netCost = financeCost.minus(rebatesReducingNet);

  const ppw = (v: Big) =>
    systemSizeWatts.gt(0)
      ? v.div(systemSizeWatts).round(PPW_SCALE, rounding.mode as 0 | 1 | 2 | 3)
      : new Big(0);

  const commissionBase = grossCostBeforeRebates.minus(dealerFee);

  let monthlyPayment: Big | null = null;
  if (inputs.financeProduct) {
    monthlyPayment = calculateMonthlyPayment(
      financeCost,
      inputs.financeProduct,
      systemSizeWatts,
    );
  }

  return {
    basePPW,
    baseCost,
    equipmentTotal,
    systemAddersTotal,
    valueAddersTotal,
    addersAndEquipmentTotal,
    baseCostWithAddersAndEquipment,
    taxTotal,
    baseCostWithTax,
    dealerFeeFactor,
    dealerFee,
    baseCostWithDealerFees,
    discountsTotal,
    grossCostBeforeRebates,
    rebatesReducingGross,
    grossCost,
    rebatesReducingNet,
    federalRebateTotal,
    financeCost,
    netCost,
    baseCostPPW: ppw(baseCost),
    grossPPW: ppw(grossCost),
    grossBeforeRebatesPPW: ppw(grossCostBeforeRebates),
    netPPW: ppw(netCost),
    commissionBase,
    commissionBasePPW: ppw(commissionBase),
    monthlyPayment,
    calculatedEquipment: equipment,
    calculatedSystemAdders: systemAdders,
    calculatedValueAdders: valueAdders,
    calculatedDiscounts: discounts,
    calculatedRebates: rebates,
  };
}

// --- 2. calculateAdderTotal ---

export function calculateAdderTotal(adders: CalculatedAdder[]): Big {
  return adders.reduce((sum, a) => sum.plus(a.total), new Big(0));
}

// --- 3. calculateAdderAmount (single adder from template) ---

export function calculateAdderAmount(
  adder: AdderTemplate,
  systemSizeWatts: Big,
  quantity: number,
  tierSelection?: string,
  customAmount?: Big,
): CalculatedAdder {
  const defaultAmt = new Big(adder.default_amount ?? 0);
  let amount: Big;
  let total: Big;

  if (adder.pricing_type === "custom" && customAmount != null) {
    amount = customAmount;
    total = amount.times(quantity);
  } else if (adder.pricing_tiers && adder.pricing_tiers.length > 0) {
    const tier = tierSelection
      ? adder.pricing_tiers.find((t) => t.label === tierSelection)
      : adder.pricing_tiers[0];
    if (tier) {
      if (tier.ppw != null) {
        amount = new Big(tier.ppw).times(systemSizeWatts).div(1000);
        total = amount.times(quantity);
      } else {
        amount = new Big(tier.amount ?? 0);
        total = amount.times(quantity);
      }
    } else {
      amount = defaultAmt;
      total = amount.times(quantity);
    }
  } else if (adder.pricing_type === "price_per_watt") {
    amount = defaultAmt.times(systemSizeWatts).div(1000);
    total = amount.times(quantity);
  } else {
    amount = defaultAmt;
    total = amount.times(quantity);
  }

  const ppw = systemSizeWatts.gt(0)
    ? total.div(systemSizeWatts).round(PPW_SCALE, ROUND_MODE)
    : new Big(0);

  return {
    templateId: adder.id,
    name: adder.name,
    pricingType: adder.pricing_type,
    amount,
    quantity,
    total,
    ppw,
    isAutoApply: adder.is_auto_apply ?? false,
    isCustomerFacing: adder.is_customer_facing ?? true,
    eligibleForItc: adder.eligible_for_itc ?? false,
    tierSelection,
  };
}

// --- 4. calculateDealerFee ---

export function calculateDealerFee(
  baseCostWithAddersAndTax: Big,
  dealerFeePercent: Big,
  rounding?: { scale: number; mode: number },
): { factor: Big; feeAmount: Big; grossedUpCost: Big } {
  const mode = rounding?.mode ?? ROUND_MODE;
  const scale = rounding?.scale ?? DOLLAR_SCALE;
  const round = (v: Big) => v.round(scale, mode as 0 | 1 | 2 | 3);

  const factor = dealerFeePercent.gte(0)
    ? new Big(1).minus(dealerFeePercent).round(6)
    : new Big(1).plus(dealerFeePercent.abs());

  const grossedUpCost = round(baseCostWithAddersAndTax.div(factor));
  const feeAmount = grossedUpCost.minus(baseCostWithAddersAndTax);

  return {
    factor,
    feeAmount,
    grossedUpCost,
  };
}

// --- 5. calculateITC ---

export function calculateITC(grossCostBeforeRebates: Big, itcRate?: Big): Big {
  const rate = itcRate ?? new Big(0.3);
  return grossCostBeforeRebates.times(rate).round(DOLLAR_SCALE, ROUND_MODE);
}

// --- 6. goalSeekPPW ---

export function goalSeekPPW(
  targetGrossCost: Big,
  systemSizeWatts: Big,
  addersAndEquipmentTotal: Big,
  taxRate: Big,
  dealerFeePercent: Big,
  discountsTotal: Big,
  minPPW: Big,
  maxPPW: Big,
): Big | null {
  if (systemSizeWatts.lte(0)) return null;

  const rounding = { scale: 6, mode: ROUND_MODE };
  const round = (v: Big) => v.round(4, ROUND_MODE);

  const grossCostBeforeRebates = targetGrossCost.plus(discountsTotal);
  const { factor } = calculateDealerFee(new Big(0), dealerFeePercent, rounding);
  const costBeforeDealerFee = grossCostBeforeRebates.times(factor);
  const baseCostWithAddersAndTax = costBeforeDealerFee;
  const baseCostWithAdders = baseCostWithAddersAndTax.div(
    new Big(1).plus(taxRate),
  );
  const baseCost = baseCostWithAdders.minus(addersAndEquipmentTotal);
  const ppw = baseCost.div(systemSizeWatts);

  const result = round(ppw);
  if (result.lt(minPPW) || result.gt(maxPPW)) return null;
  return result;
}

// --- 7. calculateMonthlyPayment ---

export function calculateMonthlyPayment(
  financeCost: Big,
  product: FinanceProduct,
  systemSizeWatts?: Big,
): Big | null {
  if (product.lenderType === "cash" || product.lenderType === "Cash") {
    return null;
  }

  if (
    product.lenderType === "tpo" ||
    product.lenderType === "TPO" ||
    product.lenderType === "lease"
  ) {
    if (
      product.ratePerKwh != null &&
      product.estimatedMonthlyProductionKwh != null
    ) {
      return product.ratePerKwh
        .times(product.estimatedMonthlyProductionKwh)
        .round(DOLLAR_SCALE, ROUND_MODE);
    }
    return null;
  }

  const rate = product.interestRate;
  const termMonths = product.termMonths;
  if (rate == null || termMonths == null || termMonths <= 0) return null;

  const r = rate.div(12).div(100);
  const n = termMonths;
  const onePlusR = new Big(1).plus(r);
  const onePlusRPowN = onePlusR.pow(n);
  const numerator = financeCost.times(r).times(onePlusRPowN);
  const denominator = onePlusRPowN.minus(1);
  if (denominator.eq(0)) return null;
  return numerator.div(denominator).round(DOLLAR_SCALE, ROUND_MODE);
}

// --- 8. calculateCommissionBase ---

export function calculateCommissionBase(
  grossCostBeforeRebates: Big,
  dealerFee: Big,
): Big {
  return grossCostBeforeRebates.minus(dealerFee);
}

// --- 9. resolveApplicableAdders ---

export function resolveApplicableAdders(
  templates: AdderTemplate[],
  scopeRules: AdderScopeRule[],
  dealContext: DealContext,
): { autoApplied: AdderTemplate[]; manualToggle: AdderTemplate[] } {
  const autoApplied: AdderTemplate[] = [];
  const manualToggle: AdderTemplate[] = [];

  const systemWatts = dealContext.systemSizeWatts;

  for (const template of templates) {
    const templateId = (template as AdderTemplate & { id: string }).id;
    const rules = scopeRules.filter(
      (r) =>
        (r.adder_template_id ??
          (r as { adder_template_id?: string }).adder_template_id) ===
        templateId,
    );

    let applies = true;
    let isRequired = false;

    if (rules.length === 0) {
      manualToggle.push(template);
      continue;
    }

    for (const rule of rules) {
      const scopeRule = rule as AdderScopeRule & { is_required?: boolean };
      if (scopeRule.is_required) isRequired = true;

      if (rule.rule_type === "system_size_min") {
        const minWatts = parseFloat(rule.rule_value);
        if (isNaN(minWatts) || systemWatts.lt(minWatts)) applies = false;
      } else if (rule.rule_type === "system_size_max") {
        const maxWatts = parseFloat(rule.rule_value);
        if (isNaN(maxWatts) || systemWatts.gt(maxWatts)) applies = false;
      } else if (rule.rule_type === "state") {
        const states = rule.rule_value
          .split(",")
          .map((s) => s.trim().toUpperCase());
        if (
          dealContext.stateCode &&
          !states.includes(dealContext.stateCode.toUpperCase())
        ) {
          applies = false;
        }
      } else if (rule.rule_type === "installer_market") {
        if (
          dealContext.installerMarketId &&
          dealContext.installerMarketId !== rule.rule_value
        ) {
          applies = false;
        }
      } else if (rule.rule_type === "equipment") {
        const val = rule.rule_value.toLowerCase();
        const panelMatch = dealContext.panelModel?.toLowerCase().includes(val);
        const invMatch = dealContext.inverterModel?.toLowerCase().includes(val);
        if (!panelMatch && !invMatch) applies = false;
      } else if (rule.rule_type === "lender") {
        const lenderSlug = (rule.rule_value || "").toLowerCase();
        if (
          dealContext.lenderSlug &&
          dealContext.lenderSlug.toLowerCase() !== lenderSlug
        ) {
          applies = false;
        }
      }
    }

    if (!applies) continue;
    if (isRequired) autoApplied.push(template);
    else manualToggle.push(template);
  }

  return { autoApplied, manualToggle };
}
