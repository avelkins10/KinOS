import { describe, it, expect } from "vitest";
import Big from "big.js";
import {
  calculatePricing,
  calculateAdderTotal,
  calculateAdderAmount,
  calculateDealerFee,
  calculateITC,
  goalSeekPPW,
  calculateMonthlyPayment,
  calculateCommissionBase,
  resolveApplicableAdders,
  type PricingInputs,
  type CalculatedAdder,
  type FinanceProduct,
  type AdderTemplate,
  type AdderScopeRule,
  type DealContext,
} from "../pricing";

describe("pricing", () => {
  const systemSizeWatts = new Big(8000);
  const basePPW = new Big(3.25);
  const dealerFeePercent = new Big(0.25);
  const taxRate = new Big(0.07);

  describe("calculatePricing", () => {
    it("standard 8kW system, $3.25 PPW, 2 fixed adders, 25% dealer fee", () => {
      const adder1: CalculatedAdder = {
        name: "Electrical Upgrade",
        pricingType: "fixed_amount",
        amount: new Big(1500),
        quantity: 1,
        total: new Big(1500),
        ppw: new Big(0.1875),
        isAutoApply: false,
        isCustomerFacing: true,
        eligibleForItc: false,
      };
      const adder2: CalculatedAdder = {
        name: "Roof Work",
        pricingType: "fixed_amount",
        amount: new Big(500),
        quantity: 1,
        total: new Big(500),
        ppw: new Big(0.0625),
        isAutoApply: false,
        isCustomerFacing: true,
        eligibleForItc: false,
      };
      const inputs: PricingInputs = {
        systemSizeWatts,
        basePPW,
        valueAdders: [adder1, adder2],
        dealerFeePercent,
        taxRate,
        financeProduct: {
          lenderSlug: "goodleap",
          lenderType: "loan",
          termMonths: 300,
          interestRate: new Big(2.99),
          salesFacingDealerFee: dealerFeePercent,
          escalatorPercent: null,
          ratePerKwh: null,
          estimatedMonthlyProductionKwh: 1100,
        },
      };
      const out = calculatePricing(inputs);
      expect(out.baseCost.toNumber()).toBe(26000);
      expect(out.valueAddersTotal.toNumber()).toBe(2000);
      expect(out.baseCostWithAddersAndEquipment.toNumber()).toBe(28000);
      expect(out.taxTotal.toNumber()).toBe(1960);
      expect(out.grossCostBeforeRebates.toNumber()).toBeGreaterThan(28000);
      expect(out.commissionBase.toNumber()).toBeGreaterThan(0);
      expect(out.monthlyPayment).not.toBeNull();
      expect(out.monthlyPayment!.toNumber()).toBeGreaterThan(0);
    });

    it("zero adders, zero discounts (simplest case)", () => {
      const inputs: PricingInputs = {
        systemSizeWatts,
        basePPW,
        dealerFeePercent: new Big(0),
        taxRate: new Big(0),
        financeProduct: null,
      };
      const out = calculatePricing(inputs);
      expect(out.baseCost.toNumber()).toBe(26000);
      expect(out.addersAndEquipmentTotal.toNumber()).toBe(0);
      expect(out.discountsTotal.toNumber()).toBe(0);
      expect(out.grossCost.toNumber()).toBe(26000);
      expect(out.commissionBase.toNumber()).toBe(26000);
      expect(out.monthlyPayment).toBeNull();
    });

    it("negative dealer fee handling", () => {
      const inputs: PricingInputs = {
        systemSizeWatts,
        basePPW,
        dealerFeePercent: new Big(-0.05),
        taxRate: new Big(0),
        financeProduct: null,
      };
      const out = calculatePricing(inputs);
      expect(out.dealerFee.toNumber()).toBeLessThan(0);
      expect(out.baseCostWithDealerFees.toNumber()).toBeLessThan(
        out.baseCost.toNumber(),
      );
    });

    it("ITC calculation on gross cost", () => {
      const itc = calculateITC(new Big(30000), new Big(0.3));
      expect(itc.toNumber()).toBe(9000);
    });
  });

  describe("calculateAdderTotal", () => {
    it("sums adder totals", () => {
      const adders: CalculatedAdder[] = [
        {
          name: "A",
          pricingType: "fixed_amount",
          amount: new Big(100),
          quantity: 1,
          total: new Big(100),
          ppw: new Big(0),
          isAutoApply: false,
          isCustomerFacing: true,
          eligibleForItc: false,
        },
        {
          name: "B",
          pricingType: "fixed_amount",
          amount: new Big(200),
          quantity: 2,
          total: new Big(400),
          ppw: new Big(0),
          isAutoApply: false,
          isCustomerFacing: true,
          eligibleForItc: false,
        },
      ];
      expect(calculateAdderTotal(adders).toNumber()).toBe(500);
    });
  });

  describe("calculateAdderAmount", () => {
    it("fixed_amount: defaultAmount × quantity", () => {
      const template: AdderTemplate = {
        id: "t1",
        name: "Flat adder",
        pricing_type: "fixed_amount",
        default_amount: 500,
      };
      const calc = calculateAdderAmount(template, new Big(8000), 2);
      expect(calc.total.toNumber()).toBe(1000);
    });

    it("price_per_watt: amount × systemSizeWatts", () => {
      const template: AdderTemplate = {
        id: "t2",
        name: "PPW adder",
        pricing_type: "price_per_watt",
        default_amount: 0.1,
      };
      const calc = calculateAdderAmount(template, new Big(8000), 1);
      expect(calc.total.toNumber()).toBe(0.1 * 8);
    });

    it("tiered adder: Flat Roof Standard vs Steep", () => {
      const template: AdderTemplate = {
        id: "t3",
        name: "Flat Roof",
        pricing_type: "price_per_watt",
        default_amount: 0.05,
        pricing_tiers: [
          { label: "Standard", ppw: 0.05 },
          { label: "Steep", ppw: 0.15 },
        ],
      };
      const standard = calculateAdderAmount(
        template,
        new Big(8000),
        1,
        "Standard",
      );
      const steep = calculateAdderAmount(template, new Big(8000), 1, "Steep");
      expect(standard.total.toNumber()).toBe(0.05 * 8);
      expect(steep.total.toNumber()).toBe(0.15 * 8);
    });

    it("tiered adder: Trenching 0-50ft vs 100ft+", () => {
      const template: AdderTemplate = {
        id: "t4",
        name: "Trenching",
        pricing_type: "fixed_amount",
        default_amount: 1500,
        pricing_tiers: [
          { label: "0-50ft", amount: 1500 },
          { label: "50-100ft", amount: 2500 },
          { label: "100ft+", amount: 4000 },
        ],
      };
      const short = calculateAdderAmount(template, new Big(8000), 1, "0-50ft");
      const long = calculateAdderAmount(template, new Big(8000), 1, "100ft+");
      expect(short.total.toNumber()).toBe(1500);
      expect(long.total.toNumber()).toBe(4000);
    });

    it("custom adder uses customAmount", () => {
      const template: AdderTemplate = {
        id: "t5",
        name: "Custom",
        pricing_type: "custom",
        default_amount: 0,
      };
      const calc = calculateAdderAmount(
        template,
        new Big(8000),
        1,
        undefined,
        new Big(2500),
      );
      expect(calc.total.toNumber()).toBe(2500);
    });
  });

  describe("calculateDealerFee", () => {
    it("gross-up for positive fee", () => {
      const cost = new Big(10000);
      const feePct = new Big(0.25);
      const { factor, feeAmount, grossedUpCost } = calculateDealerFee(
        cost,
        feePct,
      );
      expect(factor.toNumber()).toBe(0.75);
      expect(grossedUpCost.toNumber()).toBeCloseTo(10000 / 0.75, 0);
      expect(feeAmount.toNumber()).toBeCloseTo(10000 / 0.75 - 10000, 0);
    });

    it("discount math for negative fee", () => {
      const cost = new Big(10000);
      const feePct = new Big(-0.05);
      const { grossedUpCost, feeAmount } = calculateDealerFee(cost, feePct);
      expect(grossedUpCost.toNumber()).toBeLessThan(10000);
      expect(feeAmount.toNumber()).toBeLessThan(0);
    });
  });

  describe("goalSeekPPW", () => {
    it("target $45000 gross returns PPW within bounds", () => {
      const addersTotal = new Big(2000);
      const taxRate = new Big(0.07);
      const dealerFee = new Big(0.25);
      const discounts = new Big(0);
      const minPPW = new Big(2.5);
      const maxPPW = new Big(5);
      const result = goalSeekPPW(
        new Big(45000),
        systemSizeWatts,
        addersTotal,
        taxRate,
        dealerFee,
        discounts,
        minPPW,
        maxPPW,
      );
      expect(result).not.toBeNull();
      expect(result!.gte(minPPW)).toBe(true);
      expect(result!.lte(maxPPW)).toBe(true);
    });

    it("target impossible (below min PPW) returns null", () => {
      const addersTotal = new Big(50000);
      const taxRate = new Big(0);
      const dealerFee = new Big(0);
      const discounts = new Big(0);
      const minPPW = new Big(2.5);
      const maxPPW = new Big(5);
      const result = goalSeekPPW(
        new Big(10000),
        systemSizeWatts,
        addersTotal,
        taxRate,
        dealerFee,
        discounts,
        minPPW,
        maxPPW,
      );
      expect(result).toBeNull();
    });
  });

  describe("calculateMonthlyPayment", () => {
    it("loan: standard amortization", () => {
      const product: FinanceProduct = {
        lenderSlug: "goodleap",
        lenderType: "loan",
        termMonths: 300,
        interestRate: new Big(2.99),
        salesFacingDealerFee: new Big(0.25),
        escalatorPercent: null,
        ratePerKwh: null,
      };
      const payment = calculateMonthlyPayment(new Big(30000), product);
      expect(payment).not.toBeNull();
      expect(payment!.toNumber()).toBeGreaterThan(0);
    });

    it("TPO: rate_per_kwh × estimated_monthly_production", () => {
      const product: FinanceProduct = {
        lenderSlug: "goodleap-tpo",
        lenderType: "tpo",
        termMonths: null,
        interestRate: null,
        salesFacingDealerFee: new Big(0),
        escalatorPercent: new Big(2),
        ratePerKwh: new Big(0.095),
        estimatedMonthlyProductionKwh: 1100,
      };
      const payment = calculateMonthlyPayment(new Big(0), product);
      expect(payment).not.toBeNull();
      expect(payment!.toNumber()).toBeCloseTo(0.095 * 1100, 0);
    });

    it("cash returns null", () => {
      const product: FinanceProduct = {
        lenderSlug: "cash",
        lenderType: "cash",
        termMonths: null,
        interestRate: null,
        salesFacingDealerFee: new Big(0),
        escalatorPercent: null,
        ratePerKwh: null,
      };
      expect(calculateMonthlyPayment(new Big(30000), product)).toBeNull();
    });
  });

  describe("calculateCommissionBase", () => {
    it("grossCostBeforeRebates - dealerFee", () => {
      const base = calculateCommissionBase(new Big(40000), new Big(8000));
      expect(base.toNumber()).toBe(32000);
    });
  });

  describe("resolveApplicableAdders", () => {
    it("system size: 3.5kW triggers Small System < 4kW adder", () => {
      const templates: AdderTemplate[] = [
        {
          id: "small",
          name: "Small System < 4kW",
          pricing_type: "fixed_amount",
          default_amount: 500,
          is_auto_apply: true,
        },
      ];
      const rules: AdderScopeRule[] = [
        {
          adder_template_id: "small",
          rule_type: "system_size_max",
          rule_value: "4000",
          is_required: true,
        },
      ];
      const ctx: DealContext = {
        systemSizeWatts: new Big(3500),
      };
      const { autoApplied, manualToggle } = resolveApplicableAdders(
        templates,
        rules,
        ctx,
      );
      expect(autoApplied.length).toBe(1);
      expect(autoApplied[0].name).toBe("Small System < 4kW");
    });

    it("equipment: Enphase inverter triggers per-watt adder", () => {
      const templates: AdderTemplate[] = [
        {
          id: "enphase",
          name: "Enphase adder",
          pricing_type: "price_per_watt",
          default_amount: 0.1,
        },
      ];
      const rules: AdderScopeRule[] = [
        {
          adder_template_id: "enphase",
          rule_type: "equipment",
          rule_value: "enphase",
        },
      ];
      const ctx: DealContext = {
        systemSizeWatts: new Big(8000),
        inverterModel: "Enphase IQ8",
      };
      const { manualToggle } = resolveApplicableAdders(templates, rules, ctx);
      expect(manualToggle.length).toBe(1);
    });

    it("lender: GoodLeap TPO selected triggers TPO adder", () => {
      const templates: AdderTemplate[] = [
        {
          id: "tpo",
          name: "GoodLeap TPO",
          pricing_type: "fixed_amount",
          default_amount: 1000,
        },
      ];
      const rules: AdderScopeRule[] = [
        {
          adder_template_id: "tpo",
          rule_type: "lender",
          rule_value: "goodleap-tpo",
        },
      ];
      const ctx: DealContext = {
        systemSizeWatts: new Big(8000),
        lenderSlug: "goodleap-tpo",
      };
      const { manualToggle } = resolveApplicableAdders(templates, rules, ctx);
      expect(manualToggle.length).toBe(1);
    });

    it("empty scope = available everywhere (manual toggle)", () => {
      const templates: AdderTemplate[] = [
        {
          id: "any",
          name: "Anywhere adder",
          pricing_type: "fixed_amount",
          default_amount: 200,
        },
      ];
      const rules: AdderScopeRule[] = [];
      const ctx: DealContext = { systemSizeWatts: new Big(8000) };
      const { manualToggle } = resolveApplicableAdders(templates, rules, ctx);
      expect(manualToggle.length).toBe(1);
    });
  });
});
