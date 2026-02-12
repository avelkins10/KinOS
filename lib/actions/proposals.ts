"use server";

import Big from "big.js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getActivePricingConfig,
  getAdderTemplatesForDeal,
} from "@/lib/actions/pricing-data";
import {
  calculatePricing,
  calculateAdderAmount,
  type PricingInputs,
  type CalculatedAdder,
  type FinanceProduct,
  type AdderTemplate,
} from "@/lib/utils/pricing";
import { transitionDealStage } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/constants/pipeline";
import type { Database } from "@/lib/supabase/database.types";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];
type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];
type ProposalAdderRow = Database["public"]["Tables"]["proposal_adders"]["Row"];
type ProposalAdderInsert =
  Database["public"]["Tables"]["proposal_adders"]["Insert"];
type ProposalDiscountRow =
  Database["public"]["Tables"]["proposal_discounts"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];

export interface ProposalWithRelations extends ProposalRow {
  lender?: { id: string; name: string; slug: string } | null;
  lender_product?: { id: string; name: string } | null;
  proposal_adders?: ProposalAdderRow[];
  proposal_discounts?: ProposalDiscountRow[];
}

export interface ProposalUpdateData {
  base_ppw?: number;
  is_goal_seek?: boolean;
  goal_seek_target_gross?: number | null;
  original_base_ppw?: number | null;
  lender_id?: string | null;
  lender_product_id?: string | null;
  down_payment?: number;
  adders?: Array<{
    adder_template_id?: string | null;
    name: string;
    pricing_type: string;
    amount: number;
    quantity: number;
    total: number;
    is_auto_applied?: boolean;
    is_customer_facing?: boolean;
    eligible_for_itc?: boolean;
    tier_selection?: string;
    custom_amount?: number;
  }>;
  discounts?: Array<{
    name: string;
    discount_type: string;
    amount: number;
    total: number;
  }>;
}

export async function getProposalsByDeal(
  dealId: string,
): Promise<{ data: ProposalWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("id, company_id")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (!deal) return { data: null, error: "Deal not found or access denied" };

    const { data: proposals, error: pError } = await supabase
      .from("proposals")
      .select(
        `
        *,
        lender:lenders(id, name, slug),
        lender_product:lender_products(id, name)
      `,
      )
      .eq("deal_id", dealId)
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (pError) return { data: null, error: pError.message };

    const { data: adders } = await supabase
      .from("proposal_adders")
      .select("*")
      .in(
        "proposal_id",
        (proposals ?? []).map((p) => p.id),
      );
    const { data: discounts } = await supabase
      .from("proposal_discounts")
      .select("*")
      .in(
        "proposal_id",
        (proposals ?? []).map((p) => p.id),
      );

    const addersByProposal = (adders ?? []).reduce(
      (acc, a) => {
        if (!acc[a.proposal_id]) acc[a.proposal_id] = [];
        acc[a.proposal_id].push(a);
        return acc;
      },
      {} as Record<string, ProposalAdderRow[]>,
    );
    const discountsByProposal = (discounts ?? []).reduce(
      (acc, d) => {
        if (!acc[d.proposal_id]) acc[d.proposal_id] = [];
        acc[d.proposal_id].push(d);
        return acc;
      },
      {} as Record<string, ProposalDiscountRow[]>,
    );

    const result: ProposalWithRelations[] = (proposals ?? []).map((p) => ({
      ...p,
      lender: Array.isArray(p.lender) ? p.lender[0] : p.lender,
      lender_product: Array.isArray(p.lender_product)
        ? p.lender_product[0]
        : p.lender_product,
      proposal_adders: addersByProposal[p.id] ?? [],
      proposal_discounts: discountsByProposal[p.id] ?? [],
    }));
    return { data: result, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to get proposals",
    };
  }
}

export async function createProposal(
  dealId: string,
): Promise<{ data: ProposalRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .eq("company_id", user.companyId)
      .is("deleted_at", null)
      .single();
    if (dealError || !deal) {
      return { data: null, error: dealError?.message ?? "Deal not found" };
    }

    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("deal_id", dealId)
      .is("deleted_at", null);
    const nextOrder = (existing?.length ?? 0) + 1;
    const name = `Proposal ${nextOrder}`;

    const { data: config } = await getActivePricingConfig(
      user.companyId,
      (deal as DealRow & { installer_market_id?: string })
        .installer_market_id ?? undefined,
      deal.office_id ?? undefined,
    );
    const basePpw = config?.base_ppw ?? 3.25;

    const { data: adderData } = await getAdderTemplatesForDeal(deal as DealRow);
    const systemSizeWatts =
      deal.system_size_kw != null
        ? new Big(Number(deal.system_size_kw)).times(1000)
        : new Big(0);

    const insert: ProposalInsert = {
      deal_id: dealId,
      name,
      display_order: nextOrder,
      status: "draft",
      aurora_design_id:
        (deal as DealRow & { aurora_design_id?: string }).aurora_design_id ??
        null,
      design_name:
        (deal as DealRow & { design_name?: string }).design_name ?? null,
      system_size_kw: deal.system_size_kw,
      panel_count:
        (deal as DealRow & { panel_count?: number }).panel_count ?? null,
      panel_model:
        (deal as DealRow & { panel_model?: string }).panel_model ?? null,
      panel_wattage:
        (deal as DealRow & { panel_wattage?: number }).panel_wattage ?? null,
      inverter_model:
        (deal as DealRow & { inverter_model?: string }).inverter_model ?? null,
      annual_production_kwh:
        (deal as DealRow & { annual_production_kwh?: number })
          .annual_production_kwh ?? null,
      annual_consumption_kwh:
        (deal as DealRow & { annual_consumption_kwh?: number })
          .annual_consumption_kwh ?? null,
      offset_percentage:
        (deal as DealRow & { offset_percentage?: number }).offset_percentage ??
        null,
      base_ppw: basePpw,
      updated_by: user.userId ?? undefined,
    };

    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert(insert)
      .select()
      .single();
    if (insertError) return { data: null, error: insertError.message };
    if (!proposal) return { data: null, error: "Failed to create proposal" };

    if (adderData?.autoApplied?.length) {
      const templateRows = adderData.autoApplied as (AdderTemplate & {
        id: string;
      })[];
      for (const t of templateRows) {
        const calc = calculateAdderAmount(t, systemSizeWatts, 1);
        await supabase.from("proposal_adders").insert({
          proposal_id: proposal.id,
          adder_template_id: t.id,
          name: t.name,
          pricing_type: t.pricing_type,
          amount: calc.amount.toNumber(),
          quantity: 1,
          total: calc.total.toNumber(),
          ppw: calc.ppw.toNumber(),
          is_auto_applied: true,
          is_customer_facing: t.is_customer_facing ?? true,
          eligible_for_itc: t.eligible_for_itc ?? false,
        });
      }
    }

    await supabase.from("activities").insert({
      deal_id: dealId,
      user_id: user.userId ?? undefined,
      activity_type: "proposal_created",
      title: "Proposal created",
      description: `Proposal "${name}" created`,
      metadata: { proposal_id: proposal.id },
    });

    return { data: proposal as ProposalRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to create proposal",
    };
  }
}

export async function updateProposal(
  proposalId: string,
  data: ProposalUpdateData,
): Promise<{ data: ProposalRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*, deal:deals(id, company_id, system_size_kw)")
      .eq("id", proposalId)
      .is("deleted_at", null)
      .single();
    if (fetchError || !proposal) {
      return { data: null, error: fetchError?.message ?? "Proposal not found" };
    }
    const deal = Array.isArray(proposal.deal)
      ? proposal.deal[0]
      : proposal.deal;
    if (
      !deal ||
      (deal as { company_id: string }).company_id !== user.companyId
    ) {
      return { data: null, error: "Proposal not found or access denied" };
    }
    if (proposal.status === "finalized" || proposal.status === "superseded") {
      return {
        data: null,
        error: "Cannot update finalized or superseded proposal",
      };
    }

    const systemSizeKw =
      proposal.system_size_kw ??
      (deal as { system_size_kw?: number }).system_size_kw;
    const systemSizeWatts =
      systemSizeKw != null
        ? new Big(Number(systemSizeKw)).times(1000)
        : new Big(0);
    const downPayment = new Big(
      data.down_payment ?? proposal.down_payment ?? 0,
    );
    const taxRate = new Big(0.07);

    const effectiveLenderId =
      data.lender_id !== undefined ? data.lender_id : proposal.lender_id;
    const effectiveProductId =
      data.lender_product_id !== undefined
        ? data.lender_product_id
        : proposal.lender_product_id;

    let financeProduct: FinanceProduct | null = null;
    let dealerFeePercent = new Big(
      proposal.sales_facing_dealer_fee != null
        ? Number(proposal.sales_facing_dealer_fee)
        : 0,
    );
    let salesFacingDealerFeeToPersist: number | null =
      proposal.sales_facing_dealer_fee;
    let lenderActualDealerFeeToPersist: number | null =
      proposal.lender_actual_dealer_fee;

    if (effectiveLenderId && effectiveProductId) {
      const { data: product, error: productError } = await supabase
        .from("lender_products")
        .select("*")
        .eq("id", effectiveProductId)
        .eq("lender_id", effectiveLenderId)
        .single();
      if (!productError && product) {
        const { data: lender } = await supabase
          .from("lenders")
          .select("slug")
          .eq("id", product.lender_id)
          .single();
        const salesFacingPercent =
          product.sales_facing_fee_percent ?? product.dealer_fee_percent ?? 0;
        dealerFeePercent = new Big(Number(salesFacingPercent));
        salesFacingDealerFeeToPersist = Number(salesFacingPercent);
        lenderActualDealerFeeToPersist =
          product.dealer_fee_percent != null
            ? Number(product.dealer_fee_percent)
            : null;
        financeProduct = {
          lenderSlug: (lender as { slug?: string } | null)?.slug ?? "",
          lenderType: "loan",
          termMonths: product.term_months ?? null,
          interestRate:
            product.interest_rate != null
              ? new Big(Number(product.interest_rate))
              : null,
          salesFacingDealerFee: dealerFeePercent,
          escalatorPercent:
            product.escalator_percent != null
              ? new Big(Number(product.escalator_percent))
              : null,
          ratePerKwh: null,
          estimatedMonthlyProductionKwh: proposal.annual_production_kwh
            ? Number(proposal.annual_production_kwh) / 12
            : undefined,
        };
      } else {
        financeProduct =
          proposal.lender_id && proposal.lender_product_id
            ? {
                lenderSlug:
                  (proposal as ProposalRow & { lender_slug?: string })
                    .lender_slug ?? "",
                lenderType:
                  (proposal as ProposalRow & { lender_type?: string })
                    .lender_type ?? "loan",
                termMonths:
                  (proposal as ProposalRow & { term_months?: number })
                    .term_months ?? null,
                interestRate:
                  (proposal as ProposalRow & { interest_rate?: number })
                    .interest_rate != null
                    ? new Big(
                        (proposal as ProposalRow & { interest_rate?: number })
                          .interest_rate as number,
                      )
                    : null,
                salesFacingDealerFee: dealerFeePercent,
                escalatorPercent: null,
                ratePerKwh: null,
                estimatedMonthlyProductionKwh: proposal.annual_production_kwh
                  ? Number(proposal.annual_production_kwh) / 12
                  : undefined,
              }
            : null;
      }
    }

    const basePPW = new Big(data.base_ppw ?? proposal.base_ppw ?? 0);

    const valueAdders: CalculatedAdder[] = [];
    if (data.adders?.length) {
      for (const a of data.adders) {
        valueAdders.push({
          name: a.name,
          pricingType: a.pricing_type,
          amount: new Big(a.amount),
          quantity: a.quantity,
          total: new Big(a.total),
          ppw: systemSizeWatts.gt(0)
            ? new Big(a.total).div(systemSizeWatts)
            : new Big(0),
          isAutoApply: a.is_auto_applied ?? false,
          isCustomerFacing: a.is_customer_facing ?? true,
          eligibleForItc: a.eligible_for_itc ?? false,
        });
      }
    }

    const inputs: PricingInputs = {
      systemSizeWatts,
      basePPW,
      valueAdders,
      discounts: [],
      rebates: [],
      dealerFeePercent,
      downPayment,
      taxRate,
      financeProduct,
    };
    const out = calculatePricing(inputs);

    const update: ProposalUpdate & {
      is_goal_seek?: boolean;
      goal_seek_target_gross?: number | null;
      original_base_ppw?: number | null;
      sales_facing_dealer_fee?: number | null;
      lender_actual_dealer_fee?: number | null;
    } = {
      base_ppw: data.base_ppw ?? proposal.base_ppw,
      lender_id:
        data.lender_id !== undefined ? data.lender_id : proposal.lender_id,
      lender_product_id:
        data.lender_product_id !== undefined
          ? data.lender_product_id
          : proposal.lender_product_id,
      down_payment: data.down_payment ?? proposal.down_payment,
      base_price: out.baseCost.toNumber(),
      adder_total: out.addersAndEquipmentTotal.toNumber(),
      base_system_cost: out.baseCostWithAddersAndEquipment.toNumber(),
      dealer_fee_amount: out.dealerFee.toNumber(),
      gross_cost: out.grossCost.toNumber(),
      gross_ppw: out.grossPPW.toNumber(),
      net_cost: out.netCost.toNumber(),
      net_ppw: out.netPPW.toNumber(),
      tax_amount: out.taxTotal.toNumber(),
      discount_total: out.discountsTotal.toNumber(),
      commission_base: out.commissionBase.toNumber(),
      commission_ppw: out.commissionBasePPW.toNumber(),
      monthly_payment: out.monthlyPayment?.toNumber() ?? null,
      finance_cost: out.financeCost.toNumber(),
      federal_rebate_base: out.grossCostBeforeRebates.toNumber(),
      federal_rebate_amount: out.federalRebateTotal.toNumber(),
      updated_by: user.userId ?? undefined,
    };
    if (salesFacingDealerFeeToPersist != null)
      update.sales_facing_dealer_fee = salesFacingDealerFeeToPersist;
    if (lenderActualDealerFeeToPersist != null)
      update.lender_actual_dealer_fee = lenderActualDealerFeeToPersist;
    if (data.is_goal_seek !== undefined)
      update.is_goal_seek = data.is_goal_seek;
    if (data.goal_seek_target_gross !== undefined)
      update.goal_seek_target_gross = data.goal_seek_target_gross;
    if (data.original_base_ppw !== undefined)
      update.original_base_ppw = data.original_base_ppw;

    const { data: updated, error: updateError } = await supabase
      .from("proposals")
      .update(update as ProposalUpdate)
      .eq("id", proposalId)
      .select()
      .single();
    if (updateError) return { data: null, error: updateError.message };

    if (data.adders) {
      await supabase
        .from("proposal_adders")
        .delete()
        .eq("proposal_id", proposalId);
      for (const a of data.adders) {
        await supabase.from("proposal_adders").insert({
          proposal_id: proposalId,
          adder_template_id: a.adder_template_id ?? null,
          name: a.name,
          pricing_type: a.pricing_type,
          amount: a.amount,
          quantity: a.quantity,
          total: a.total,
          is_auto_applied: a.is_auto_applied ?? false,
          is_customer_facing: a.is_customer_facing ?? true,
          eligible_for_itc: a.eligible_for_itc ?? false,
          tier_selection: a.tier_selection ?? null,
          custom_amount: a.custom_amount ?? null,
        } as ProposalAdderInsert & {
          tier_selection?: string | null;
          custom_amount?: number | null;
        });
      }
    }
    if (data.discounts?.length) {
      await supabase
        .from("proposal_discounts")
        .delete()
        .eq("proposal_id", proposalId);
      for (const d of data.discounts) {
        await supabase.from("proposal_discounts").insert({
          proposal_id: proposalId,
          name: d.name,
          discount_type: d.discount_type,
          amount: d.amount,
          total: d.total,
          is_customer_facing: true,
        });
      }
    }

    return { data: updated as ProposalRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to update proposal",
    };
  }
}

export async function finalizeProposal(
  proposalId: string,
  userId?: string,
): Promise<{ data: ProposalRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }
    const effectiveUserId = userId ?? user.userId ?? "";
    if (!effectiveUserId) {
      return { data: null, error: "User not found" };
    }

    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*, deal:deals(id, company_id, closer_id)")
      .eq("id", proposalId)
      .is("deleted_at", null)
      .single();
    if (fetchError || !proposal) {
      return { data: null, error: fetchError?.message ?? "Proposal not found" };
    }
    const deal = Array.isArray(proposal.deal)
      ? proposal.deal[0]
      : proposal.deal;
    if (
      !deal ||
      (deal as { company_id: string }).company_id !== user.companyId
    ) {
      return { data: null, error: "Proposal not found or access denied" };
    }
    const closerId = (deal as { closer_id?: string }).closer_id;
    const isCloserOrAdmin =
      user.role === "admin" ||
      (user.role === "closer" && closerId === effectiveUserId);
    if (!isCloserOrAdmin) {
      return {
        data: null,
        error: "Only the assigned closer or admin can finalize",
      };
    }

    if (!proposal.aurora_design_id) {
      return { data: null, error: "Design must be linked before finalizing" };
    }
    if (!proposal.gross_cost || proposal.gross_cost <= 0) {
      return {
        data: null,
        error: "Pricing must be calculated before finalizing",
      };
    }
    if (
      !proposal.lender_id &&
      (proposal as ProposalRow & { financing_method?: string })
        .financing_method !== "cash"
    ) {
      return { data: null, error: "Lender must be selected (or choose Cash)" };
    }

    await supabase
      .from("proposals")
      .update({ status: "superseded" })
      .eq("deal_id", proposal.deal_id)
      .eq("status", "finalized");

    const { data: finalized, error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: effectiveUserId,
        updated_by: effectiveUserId,
      })
      .eq("id", proposalId)
      .select()
      .single();
    if (updateError) return { data: null, error: updateError.message };

    await supabase
      .from("deals")
      .update({
        active_proposal_id: proposalId,
        updated_by: effectiveUserId,
      })
      .eq("id", proposal.deal_id);

    await transitionDealStage(proposal.deal_id, "proposal_sent" as DealStage);

    await supabase.from("activities").insert({
      deal_id: proposal.deal_id,
      user_id: effectiveUserId,
      activity_type: "proposal_finalized",
      title: "Proposal finalized",
      description: `Proposal finalized: $${Number(proposal.gross_cost).toLocaleString()} gross, $${Number(proposal.gross_ppw).toFixed(2)}/W`,
      metadata: {
        proposal_id: proposalId,
        gross_cost: proposal.gross_cost,
        gross_ppw: proposal.gross_ppw,
      },
    });

    return { data: finalized as ProposalRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to finalize proposal",
    };
  }
}

export async function unfinalizeProposal(
  proposalId: string,
  userId: string,
): Promise<{ data: ProposalRow | null; error: string | null }> {
  try {
    const user = await getCurrentUser();
    if (!user?.companyId || user.role !== "admin") {
      return { data: null, error: "Admin only" };
    }

    const supabase = await createClient();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, deal_id")
      .eq("id", proposalId)
      .eq("status", "finalized")
      .single();
    if (!proposal)
      return { data: null, error: "Proposal not found or not finalized" };

    await supabase
      .from("proposals")
      .update({
        status: "draft",
        finalized_at: null,
        finalized_by: null,
        unfinalized_at: new Date().toISOString(),
        unfinalized_by: userId,
        updated_by: userId,
      })
      .eq("id", proposalId);

    await supabase
      .from("deals")
      .update({ active_proposal_id: null, updated_by: userId })
      .eq("id", proposal.deal_id);

    await supabase.from("activities").insert({
      deal_id: proposal.deal_id,
      user_id: userId,
      activity_type: "proposal_unfinalized",
      title: "Proposal unfinalized",
      description: "Proposal unfinalized by admin",
      metadata: { proposal_id: proposalId },
    });

    const { data: updated } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();
    return { data: updated as ProposalRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to unfinalize proposal",
    };
  }
}

export async function deleteProposal(
  proposalId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { error: "Unauthorized" };
    }

    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, deal_id, status")
      .eq("id", proposalId)
      .is("deleted_at", null)
      .single();
    if (!proposal) return { error: "Proposal not found" };
    if (proposal.status !== "draft") {
      return { error: "Only draft proposals can be deleted" };
    }

    const { error } = await supabase
      .from("proposals")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.userId ?? undefined,
        updated_by: user.userId ?? undefined,
      })
      .eq("id", proposalId);
    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete proposal",
    };
  }
}

export async function duplicateProposal(
  proposalId: string,
): Promise<{ data: ProposalRow | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    const { data: source, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .is("deleted_at", null)
      .single();
    if (fetchError || !source) {
      return { data: null, error: fetchError?.message ?? "Proposal not found" };
    }
    if ((source as { company_id?: string }).company_id !== user.companyId) {
      return { data: null, error: "Proposal not found or access denied" };
    }

    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("deal_id", source.deal_id)
      .is("deleted_at", null);
    const nextOrder = (existing?.length ?? 0) + 1;
    const name = `Proposal ${nextOrder} (copy)`;

    const {
      id: _id,
      status: _s,
      finalized_at: _fa,
      finalized_by: _fb,
      aurora_proposal_id: _ap,
      ...rest
    } = source;
    const insert: ProposalInsert = {
      ...rest,
      name,
      display_order: nextOrder,
      status: "draft",
      finalized_at: null,
      finalized_by: null,
      aurora_proposal_id: null,
      updated_by: user.userId ?? undefined,
    };

    const { data: newProposal, error: insertError } = await supabase
      .from("proposals")
      .insert(insert)
      .select()
      .single();
    if (insertError) return { data: null, error: insertError.message };
    if (!newProposal)
      return { data: null, error: "Failed to duplicate proposal" };

    const { data: adders } = await supabase
      .from("proposal_adders")
      .select("*")
      .eq("proposal_id", proposalId);
    for (const a of adders ?? []) {
      const { id: _aid, proposal_id: _pid, ...aRest } = a;
      await supabase.from("proposal_adders").insert({
        ...aRest,
        proposal_id: newProposal.id,
      });
    }
    const { data: discounts } = await supabase
      .from("proposal_discounts")
      .select("*")
      .eq("proposal_id", proposalId);
    for (const d of discounts ?? []) {
      const { id: _did, proposal_id: _pid, ...dRest } = d;
      await supabase.from("proposal_discounts").insert({
        ...dRest,
        proposal_id: newProposal.id,
      });
    }

    return { data: newProposal as ProposalRow, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to duplicate proposal",
    };
  }
}
