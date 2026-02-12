"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ProposalSummaryData {
  baseCost: number;
  adderTotal: number;
  taxTotal: number;
  dealerFee: number;
  discountTotal: number;
  grossCost: number;
  grossPpw: number;
  netCost: number;
  netPpw: number;
  commissionBase: number;
  monthlyPayment: number | null;
  federalRebate?: number;
}

export function ProposalSummaryCard({
  data,
  systemSizeKw,
  showCommission,
}: {
  data: ProposalSummaryData;
  systemSizeKw: number | null;
  showCommission?: boolean;
}) {
  const {
    baseCost,
    adderTotal,
    taxTotal,
    dealerFee,
    discountTotal,
    grossCost,
    grossPpw,
    netCost,
    netPpw,
    commissionBase,
    monthlyPayment,
    federalRebate,
  } = data;

  const row = (label: string, value: number | string, isDiscount?: boolean) => (
    <div key={label} className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          isDiscount && value !== 0 && "text-emerald-600",
        )}
      >
        {typeof value === "number"
          ? (isDiscount && value > 0 ? "-" : "") +
            "$" +
            Math.abs(value).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : value}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <h4 className="text-sm font-semibold">Summary</h4>
      </CardHeader>
      <CardContent className="space-y-2">
        {row("Base cost", baseCost)}
        {row("Adders", adderTotal)}
        {row("Tax", taxTotal)}
        {row("Dealer fee", dealerFee)}
        {discountTotal !== 0 && row("Discounts", discountTotal, true)}
        {federalRebate != null &&
          federalRebate > 0 &&
          row("Federal ITC", federalRebate, true)}
        <Separator />
        {row("Gross cost", grossCost)}
        {systemSizeKw != null && systemSizeKw > 0 && (
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Gross $/W</span>
            <span className="font-medium">${grossPpw.toFixed(2)}/W</span>
          </div>
        )}
        <Separator />
        {row("Net cost", netCost)}
        {systemSizeKw != null && systemSizeKw > 0 && (
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">Net $/W</span>
            <span className="font-medium">${netPpw.toFixed(2)}/W</span>
          </div>
        )}
        {monthlyPayment != null && monthlyPayment > 0 && (
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Monthly payment</span>
            <span>
              $
              {monthlyPayment.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
        {showCommission && commissionBase > 0 && (
          <>
            <Separator />
            <div className="flex justify-between py-1.5 text-xs text-muted-foreground">
              <span>Commission base</span>
              <span>
                $
                {commissionBase.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
