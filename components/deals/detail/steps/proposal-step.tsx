"use client";

import React, { useState, useEffect, useCallback } from "react";
import Big from "big.js";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import {
  getProposalsByDeal,
  createProposal,
  updateProposal,
  finalizeProposal,
  deleteProposal,
  duplicateProposal,
  type ProposalWithRelations,
} from "@/lib/actions/proposals";
import {
  getLendersWithProducts,
  getAdderTemplatesForDealByDealId,
} from "@/lib/actions/pricing-data";
import { calculateAdderAmount, goalSeekPPW } from "@/lib/utils/pricing";
import type { AdderTemplate } from "@/lib/utils/pricing";
import { ProposalList } from "@/components/deals/proposal-list";
import { ProposalPricingCard } from "@/components/deals/proposal-pricing-card";
import { ProposalAddersCard } from "@/components/deals/proposal-adders-card";
import { ProposalFinancingCard } from "@/components/deals/proposal-financing-card";
import { ProposalSummaryCard } from "@/components/deals/proposal-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Sun, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_INDEX } from "@/lib/constants/pipeline";

export function ProposalStep({
  deal,
  dealDetail,
  onDealUpdated,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
  onDealUpdated?: () => void;
}) {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<ProposalWithRelations[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lenders, setLenders] =
    useState<Awaited<ReturnType<typeof getLendersWithProducts>>["data"]>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [basePpw, setBasePpw] = useState(3.25);
  const [goalSeekTarget, setGoalSeekTarget] = useState("");
  const [useGoalSeek, setUseGoalSeek] = useState(false);
  const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [adderTemplates, setAdderTemplates] = useState<{
    autoApplied: AdderTemplate[];
    manualToggle: AdderTemplate[];
  } | null>(null);
  const [manualAdderSelections, setManualAdderSelections] = useState<
    Record<string, { enabled: boolean; tier?: string; customAmount?: number }>
  >({});
  const minPpw = 2.5;
  const maxPpw = 5;

  const dealStageIndex =
    STAGE_INDEX[deal.stage as keyof typeof STAGE_INDEX] ?? -1;
  const designComplete = dealStageIndex >= STAGE_INDEX["design_complete"];
  const systemSizeKw =
    deal.systemSize ??
    (dealDetail?.proposals?.[0] as { system_size_kw?: number } | undefined)
      ?.system_size_kw ??
    null;

  const loadProposals = useCallback(async () => {
    const { data, error } = await getProposalsByDeal(deal.id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    setProposals(data ?? []);
    if (data?.length && !activeId) setActiveId(data[0].id);
    if (data?.length && activeId && !data.some((p) => p.id === activeId))
      setActiveId(data[0].id);
  }, [deal.id, activeId, toast]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const companyId = (dealDetail as { company_id?: string } | undefined)
    ?.company_id;
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      const { data } = await getLendersWithProducts(
        companyId,
        deal.state || undefined,
      );
      if (!cancelled) setLenders(data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, deal.state]);

  useEffect(() => {
    setLoading(false);
  }, [proposals]);

  const activeProposal = proposals.find((p) => p.id === activeId);

  // Sync local state when active proposal changes so each proposal uses its own stored values.
  useEffect(() => {
    if (!activeProposal) return;
    setBasePpw(activeProposal.base_ppw ?? 3.25);
    setGoalSeekTarget(
      (activeProposal as { goal_seek_target_gross?: number | null })
        .goal_seek_target_gross != null
        ? String(
            (activeProposal as { goal_seek_target_gross?: number })
              .goal_seek_target_gross,
          )
        : "",
    );
    setUseGoalSeek(
      !!(activeProposal as { is_goal_seek?: boolean }).is_goal_seek,
    );
    setSelectedLenderId(activeProposal.lender_id ?? null);
    setSelectedProductId(activeProposal.lender_product_id ?? null);
    const savedManual = (activeProposal.proposal_adders ?? [])
      .filter((a) => !a.is_auto_applied)
      .reduce(
        (acc, a) => {
          const row = a as {
            tier_selection?: string | null;
            custom_amount?: number | null;
          };
          acc[a.name] = {
            enabled: true,
            tier: row.tier_selection ?? undefined,
            customAmount: row.custom_amount ?? undefined,
          };
          return acc;
        },
        {} as Record<
          string,
          { enabled: boolean; tier?: string; customAmount?: number }
        >,
      );
    setManualAdderSelections(savedManual);
  }, [activeProposal?.id]);

  const selectedLenderSlug =
    lenders?.find((l) => l.lender.id === selectedLenderId)?.lender.slug ??
    undefined;

  useEffect(() => {
    if (!deal.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await getAdderTemplatesForDealByDealId(
        deal.id,
        selectedLenderSlug,
      );
      if (!cancelled && data) setAdderTemplates(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [deal.id, selectedLenderSlug]);
  const activeDealProposalId =
    (dealDetail as { active_proposal_id?: string } | undefined)
      ?.active_proposal_id ?? null;

  const handleNewProposal = async () => {
    setSaving(true);
    const { data, error } = await createProposal(deal.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    if (data) {
      toast({ title: "Proposal created", description: data.name });
      loadProposals();
      setActiveId(data.id);
      onDealUpdated?.();
    }
  };

  const handleDuplicate = async (id: string) => {
    setSaving(true);
    const { data, error } = await duplicateProposal(id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    if (data) {
      toast({ title: "Proposal duplicated", description: data.name });
      loadProposals();
      setActiveId(data.id);
      onDealUpdated?.();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteProposal(id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Proposal deleted" });
    loadProposals();
    if (activeId === id)
      setActiveId(proposals.find((p) => p.id !== id)?.id ?? null);
    onDealUpdated?.();
  };

  const systemSizeWatts =
    systemSizeKw != null
      ? new Big(Number(systemSizeKw)).times(1000)
      : new Big(0);

  const handleSaveDraft = async () => {
    if (!activeProposal || activeProposal.status !== "draft") return;
    setSaving(true);

    let effectiveBasePpw = basePpw;
    if (useGoalSeek && goalSeekTarget) {
      const targetNum = Number(goalSeekTarget);
      if (isNaN(targetNum) || targetNum <= 0) {
        setSaving(false);
        return;
      }
      const targetGross = new Big(targetNum);
      let addersTotal = new Big(0);
      if (adderTemplates?.autoApplied?.length) {
        for (const t of adderTemplates.autoApplied) {
          const calc = calculateAdderAmount(t, systemSizeWatts, 1);
          addersTotal = addersTotal.plus(calc.total);
        }
      }
      for (const t of adderTemplates?.manualToggle ?? []) {
        const sel = manualAdderSelections[t.name];
        if (sel?.enabled) {
          const calc = calculateAdderAmount(
            t,
            systemSizeWatts,
            1,
            sel.tier,
            sel.customAmount != null ? new Big(sel.customAmount) : undefined,
          );
          addersTotal = addersTotal.plus(calc.total);
        }
      }
      const dealerFeePercent = new Big(
        activeProposal.sales_facing_dealer_fee ?? 0,
      );
      const derived = goalSeekPPW(
        targetGross,
        systemSizeWatts,
        addersTotal,
        new Big(0.07),
        dealerFeePercent,
        new Big(0),
        new Big(minPpw),
        new Big(maxPpw),
      );
      if (derived != null) {
        effectiveBasePpw = derived.toNumber();
        setBasePpw(effectiveBasePpw);
      }
    }

    const adders: Array<{
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
    }> = [];
    if (adderTemplates?.autoApplied?.length) {
      for (const t of adderTemplates.autoApplied) {
        const calc = calculateAdderAmount(t, systemSizeWatts, 1);
        adders.push({
          adder_template_id: t.id,
          name: t.name,
          pricing_type: t.pricing_type,
          amount: calc.amount.toNumber(),
          quantity: 1,
          total: calc.total.toNumber(),
          is_auto_applied: true,
          is_customer_facing: t.is_customer_facing ?? true,
          eligible_for_itc: t.eligible_for_itc ?? false,
        });
      }
    }
    for (const t of adderTemplates?.manualToggle ?? []) {
      const sel = manualAdderSelections[t.name];
      if (!sel?.enabled) continue;
      const calc = calculateAdderAmount(
        t,
        systemSizeWatts,
        1,
        sel.tier,
        sel.customAmount != null ? new Big(sel.customAmount) : undefined,
      );
      adders.push({
        adder_template_id: t.id,
        name: t.name,
        pricing_type: t.pricing_type,
        amount: calc.amount.toNumber(),
        quantity: 1,
        total: calc.total.toNumber(),
        is_auto_applied: false,
        is_customer_facing: t.is_customer_facing ?? true,
        eligible_for_itc: t.eligible_for_itc ?? false,
        tier_selection: sel.tier,
        custom_amount: sel.customAmount,
      });
    }

    const payload = {
      base_ppw: effectiveBasePpw,
      lender_id: selectedLenderId,
      lender_product_id: selectedProductId,
      down_payment: activeProposal.down_payment ?? undefined,
      adders: adders.length ? adders : undefined,
      is_goal_seek: useGoalSeek ? true : undefined,
      goal_seek_target_gross:
        useGoalSeek && goalSeekTarget ? Number(goalSeekTarget) : undefined,
      original_base_ppw:
        useGoalSeek && activeProposal.base_ppw != null
          ? activeProposal.base_ppw
          : undefined,
    };

    const { error } = await updateProposal(activeProposal.id, payload);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Draft saved" });
    loadProposals();
    onDealUpdated?.();
  };

  const handleFinalize = async () => {
    if (!activeProposal || !dealDetail) return;
    const user = (dealDetail as { currentUser?: { id?: string } })
      .currentUser as { id?: string } | undefined;
    const userId = user?.id ?? "";
    if (!userId) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { data, error } = await finalizeProposal(activeProposal.id, userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    if (data) {
      toast({
        title: "Proposal finalized",
        description: `$${Number(data.gross_cost).toLocaleString()} gross, $${Number(data.gross_ppw).toFixed(2)}/W`,
      });
      loadProposals();
      onDealUpdated?.();
    }
  };

  if (!designComplete) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-foreground">Proposal</h3>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h4 className="text-lg font-semibold text-foreground">
              Design required
            </h4>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Complete the Design step and link a design before building
              proposals.
            </p>
            <Button asChild variant="outline" className="mt-4 gap-2">
              <a href="#designs">
                <Link2 className="h-4 w-4" /> Go to Designs
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Proposal</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Build and compare proposals. Finalize one to advance the deal.
        </p>
      </div>

      {/* Design summary */}
      <Card className="bg-muted/30">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <Sun className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {systemSizeKw != null ? `${systemSizeKw.toFixed(2)} kW` : "—"}{" "}
            system
            {deal.panelCount != null && ` · ${deal.panelCount} panels`}
            {deal.panelBrand && ` · ${deal.panelBrand}`}
            {deal.annualProduction != null &&
              ` · ${Number(deal.annualProduction).toLocaleString()} kWh/yr`}
            {deal.offset != null &&
              ` · ${Number(deal.offset).toFixed(0)}% offset`}
          </span>
        </CardContent>
      </Card>

      <ProposalList
        proposals={proposals}
        activeProposalId={activeId}
        onSelect={setActiveId}
        onNew={handleNewProposal}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isDeleting={deletingId}
      />

      {proposals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h4 className="text-lg font-semibold text-foreground">
              No proposals yet
            </h4>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create a proposal to combine design, adders, and financing.
            </p>
            <Button
              onClick={handleNewProposal}
              disabled={saving}
              className="mt-4 gap-2"
            >
              New Proposal
            </Button>
          </CardContent>
        </Card>
      )}

      {activeProposal && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ProposalPricingCard
              basePpw={basePpw}
              minPpw={minPpw}
              maxPpw={maxPpw}
              systemSizeKw={systemSizeKw}
              baseCost={basePpw * (systemSizeKw ?? 0) * 1000}
              goalSeekTarget={goalSeekTarget}
              useGoalSeek={useGoalSeek}
              onBasePpwChange={setBasePpw}
              onGoalSeekChange={setGoalSeekTarget}
              onUseGoalSeekChange={setUseGoalSeek}
              disabled={activeProposal.status === "finalized"}
            />
            <ProposalFinancingCard
              lenders={lenders ?? []}
              selectedLenderId={selectedLenderId}
              selectedProductId={selectedProductId}
              dealerFeePercent={activeProposal.sales_facing_dealer_fee}
              monthlyPayment={activeProposal.monthly_payment}
              onLenderChange={(id) => {
                setSelectedLenderId(id);
                setSelectedProductId(null);
              }}
              onProductChange={setSelectedProductId}
              stateCode={deal.state}
              disabled={activeProposal.status === "finalized"}
            />
          </div>
          <ProposalAddersCard
            autoApplied={
              adderTemplates?.autoApplied?.map((t) => {
                const calc = calculateAdderAmount(t, systemSizeWatts, 1);
                return {
                  id: t.id,
                  name: t.name,
                  amount: calc.amount.toNumber(),
                  total: calc.total.toNumber(),
                  quantity: 1,
                  pricingType: t.pricing_type,
                  isAutoApplied: true,
                };
              }) ?? []
            }
            manualAdders={
              adderTemplates?.manualToggle?.map((t) => {
                const sel = manualAdderSelections[t.name];
                const enabled = sel?.enabled ?? false;
                const calc = calculateAdderAmount(
                  t,
                  systemSizeWatts,
                  1,
                  sel?.tier,
                  sel?.customAmount != null
                    ? new Big(sel.customAmount)
                    : undefined,
                );
                return {
                  id: t.id,
                  name: t.name,
                  amount: calc.amount.toNumber(),
                  total: calc.total.toNumber(),
                  quantity: 1,
                  pricingType: t.pricing_type,
                  tiers: t.pricing_tiers ?? undefined,
                  selectedTier: sel?.tier,
                  customAmount: sel?.customAmount,
                  enabled,
                };
              }) ?? []
            }
            onToggle={(name, enabled) => {
              setManualAdderSelections((prev) => ({
                ...prev,
                [name]: { ...(prev[name] ?? {}), enabled },
              }));
            }}
            onTierChange={(name, tier) => {
              setManualAdderSelections((prev) => ({
                ...prev,
                [name]: { ...prev[name], tier },
              }));
            }}
            onCustomAmountChange={(name, value) => {
              setManualAdderSelections((prev) => ({
                ...prev,
                [name]: { ...prev[name], customAmount: value },
              }));
            }}
            runningTotal={(() => {
              let total = 0;
              adderTemplates?.autoApplied?.forEach((t) => {
                const calc = calculateAdderAmount(t, systemSizeWatts, 1);
                total += calc.total.toNumber();
              });
              adderTemplates?.manualToggle?.forEach((t) => {
                const sel = manualAdderSelections[t.name];
                if (sel?.enabled) {
                  const calc = calculateAdderAmount(
                    t,
                    systemSizeWatts,
                    1,
                    sel.tier,
                    sel.customAmount != null
                      ? new Big(sel.customAmount)
                      : undefined,
                  );
                  total += calc.total.toNumber();
                }
              });
              return total;
            })()}
            disabled={activeProposal.status === "finalized"}
          />
          <ProposalSummaryCard
            data={{
              baseCost: Number(activeProposal.base_price) || 0,
              adderTotal: Number(activeProposal.adder_total) || 0,
              taxTotal: Number(activeProposal.tax_amount) || 0,
              dealerFee: Number(activeProposal.dealer_fee_amount) || 0,
              discountTotal: Number(activeProposal.discount_total) || 0,
              grossCost: Number(activeProposal.gross_cost) || 0,
              grossPpw: Number(activeProposal.gross_ppw) || 0,
              netCost: Number(activeProposal.net_cost) || 0,
              netPpw: Number(activeProposal.net_ppw) || 0,
              commissionBase: Number(activeProposal.commission_base) || 0,
              monthlyPayment: activeProposal.monthly_payment,
              federalRebate: activeProposal.federal_rebate_amount ?? undefined,
            }}
            systemSizeKw={systemSizeKw}
            showCommission
          />
          {activeProposal.status === "draft" && (
            <div className="flex gap-2">
              <Button onClick={handleSaveDraft} disabled={saving}>
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                variant="default"
                onClick={handleFinalize}
                disabled={saving}
              >
                Finalize proposal
              </Button>
            </div>
          )}
          {activeProposal.status === "finalized" &&
            activeProposal.id === activeDealProposalId && (
              <p className="text-sm text-muted-foreground">
                This is the active finalized proposal.
              </p>
            )}
        </>
      )}
    </div>
  );
}
