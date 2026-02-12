"use server";

import Big from "big.js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { resolveApplicableAdders } from "@/lib/utils/pricing";
import type {
  AdderTemplate,
  AdderScopeRule,
  DealContext,
} from "@/lib/utils/pricing";
import type { Database } from "@/lib/supabase/database.types";

type PricingConfigRow = Database["public"]["Tables"]["pricing_configs"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type AdderTemplateRow = Database["public"]["Tables"]["adder_templates"]["Row"];
type AdderScopeRuleRow =
  Database["public"]["Tables"]["adder_scope_rules"]["Row"];
type LenderRow = Database["public"]["Tables"]["lenders"]["Row"];
type LenderProductRow = Database["public"]["Tables"]["lender_products"]["Row"];
type InstallerMarketRow =
  Database["public"]["Tables"]["installer_markets"]["Row"];

export interface LenderWithProducts {
  lender: LenderRow;
  products: LenderProductRow[];
}

/** Resolution waterfall: office → market → company default */
export async function getActivePricingConfig(
  companyId: string,
  marketId?: string,
  officeId?: string,
): Promise<{ data: PricingConfigRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || user.companyId !== companyId) {
      return { data: null, error: "Unauthorized" };
    }

    if (officeId) {
      const { data, error } = await supabase
        .from("pricing_configs")
        .select("*")
        .eq("company_id", companyId)
        .eq("office_id", officeId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) return { data: null, error: error.message };
      if (data) return { data, error: null };
    }

    if (marketId) {
      const { data, error } = await supabase
        .from("pricing_configs")
        .select("*")
        .eq("company_id", companyId)
        .eq("installer_market_id", marketId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) return { data: null, error: error.message };
      if (data) return { data, error: null };
    }

    const { data, error } = await supabase
      .from("pricing_configs")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get pricing config",
    };
  }
}

function rowToAdderTemplate(row: AdderTemplateRow): AdderTemplate {
  const rowWithTiers = row as AdderTemplateRow & {
    pricing_tiers?: { label: string; amount?: number; ppw?: number }[] | null;
  };
  const tiers = rowWithTiers.pricing_tiers ?? null;
  return {
    id: row.id,
    name: row.name,
    pricing_type: row.pricing_type,
    default_amount: row.default_amount,
    pricing_tiers: tiers ?? undefined,
    is_customer_facing: row.is_customer_facing ?? true,
    eligible_for_itc: row.eligible_for_itc,
    is_auto_apply:
      (row as AdderTemplateRow & { is_auto_apply?: boolean }).is_auto_apply ??
      false,
    is_manual_toggle:
      (row as AdderTemplateRow & { is_manual_toggle?: boolean })
        .is_manual_toggle ?? true,
  };
}

function rowToScopeRule(row: AdderScopeRuleRow): AdderScopeRule {
  const r = row as AdderScopeRuleRow & { is_required?: boolean };
  return {
    adder_template_id: row.adder_template_id,
    rule_type: row.rule_type,
    rule_value: row.rule_value,
    is_required: r.is_required ?? false,
  };
}

export async function getAdderTemplatesForDeal(deal: DealRow): Promise<{
  data: { autoApplied: AdderTemplate[]; manualToggle: AdderTemplate[] } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || deal.company_id !== user.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: templates, error: tError } = await supabase
      .from("adder_templates")
      .select("*")
      .eq("company_id", deal.company_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (tError) return { data: null, error: tError.message };

    const { data: rules, error: rError } = await supabase
      .from("adder_scope_rules")
      .select("*");

    if (rError) return { data: null, error: rError.message };

    const systemSizeWatts =
      deal.system_size_kw != null
        ? new Big(Number(deal.system_size_kw)).times(1000)
        : new Big(0);
    const overrideLenderSlug = (
      deal as DealRow & { _overrideLenderSlug?: string }
    )._overrideLenderSlug;
    const ctx: DealContext = {
      stateCode: (deal as DealRow & { state?: string }).state ?? undefined,
      installerMarketId:
        (deal as DealRow & { installer_market_id?: string })
          .installer_market_id ?? undefined,
      officeId: deal.office_id ?? undefined,
      systemSizeWatts,
      panelModel:
        (deal as DealRow & { panel_model?: string }).panel_model ?? undefined,
      inverterModel:
        (deal as DealRow & { inverter_model?: string }).inverter_model ??
        undefined,
      lenderSlug:
        overrideLenderSlug ??
        (deal as DealRow & { lender_slug?: string }).lender_slug ??
        undefined,
    };

    const templateList = (templates ?? []).map(rowToAdderTemplate);
    const scopeRules = (rules ?? []).map(rowToScopeRule);
    const { autoApplied, manualToggle } = resolveApplicableAdders(
      templateList,
      scopeRules,
      ctx,
    );
    return { data: { autoApplied, manualToggle }, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get adder templates",
    };
  }
}

/** Fetch deal by id then resolve adder templates. Optional lender slug override for scope rules. */
export async function getAdderTemplatesForDealByDealId(
  dealId: string,
  overrideLenderSlug?: string,
): Promise<{
  data: { autoApplied: AdderTemplate[]; manualToggle: AdderTemplate[] } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }
    const { data: deal, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (error || !deal) {
      return { data: null, error: error?.message ?? "Deal not found" };
    }
    const dealWithOverride = overrideLenderSlug
      ? { ...deal, _overrideLenderSlug: overrideLenderSlug }
      : deal;
    return getAdderTemplatesForDeal(dealWithOverride as DealRow);
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get adder templates",
    };
  }
}

export async function getLendersWithProducts(
  companyId: string,
  stateCode?: string,
): Promise<{ data: LenderWithProducts[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId || user.companyId !== companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: lenders, error: lError } = await supabase
      .from("lenders")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (lError) return { data: null, error: lError.message };
    if (!lenders?.length) return { data: [], error: null };

    const { data: products, error: pError } = await supabase
      .from("lender_products")
      .select("*")
      .eq("is_active", true)
      .in(
        "lender_id",
        lenders.map((l) => l.id),
      )
      .order("display_order", { ascending: true });

    if (pError) return { data: null, error: pError.message };

    const productList = products ?? [];
    const result: LenderWithProducts[] = lenders.map((lender) => {
      let list = productList.filter((p) => p.lender_id === lender.id);
      if (stateCode && list.length) {
        list = list.filter(
          (p) =>
            !p.available_states?.length ||
            p.available_states.includes(stateCode),
        );
      }
      return { lender, products: list };
    });
    return { data: result, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get lenders",
    };
  }
}

export async function getInstallerMarket(
  stateCode: string,
  city?: string,
  zipcode?: string,
): Promise<{ data: InstallerMarketRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("installer_markets")
      .select("*")
      .eq("company_id", user.companyId)
      .eq("state", stateCode)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get installer market",
    };
  }
}
