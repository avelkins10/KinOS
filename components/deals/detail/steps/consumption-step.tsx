"use client";

import React, { useState } from "react";
import type { DealForUI } from "@/lib/deals-mappers";
import { ConsumptionForm } from "@/components/deals/consumption-form";
import { Zap, Building2, DollarSign, BarChart3, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function DataField({
  label,
  value,
  icon: Icon,
  unit,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function ConsumptionStep({
  deal,
  onDealUpdated,
}: {
  deal: DealForUI;
  onDealUpdated?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasData =
    (deal.annualKwh != null && deal.annualKwh > 0) ||
    (Array.isArray(deal.monthlyKwh) && deal.monthlyKwh.some((v) => v > 0));
  const utilityCompany = deal.utilityCompany ?? deal.utilityAccount ?? "";
  const monthlyKwh = Array.isArray(deal.monthlyKwh)
    ? deal.monthlyKwh
    : deal.annualKwh != null
      ? Array(12).fill(Math.round(deal.annualKwh / 12))
      : [];
  const annualKwh =
    deal.annualKwh ??
    (monthlyKwh.length === 12 ? monthlyKwh.reduce((a, b) => a + b, 0) : 0);
  const monthlyBill = deal.monthlyBill;

  const handleSuccess = () => {
    setShowForm(false);
    setLoading(true);
    onDealUpdated?.();
    setTimeout(() => setLoading(false), 500);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Consumption</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the customer&apos;s monthly electric bill, annual kWh usage,
            and utility company.
          </p>
        </div>
        <ConsumptionForm
          dealId={deal.id}
          initialData={
            hasData
              ? {
                  utilityCompany: utilityCompany || "",
                  utilityTariff: deal.utilityTariff ?? "",
                  monthlyBill: monthlyBill ?? null,
                  annualKwh: annualKwh > 0 ? annualKwh : null,
                  monthlyKwh: monthlyKwh.length === 12 ? monthlyKwh : [],
                }
              : undefined
          }
          onSuccess={handleSuccess}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Consumption</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the customer&apos;s monthly electric bill, annual kWh usage,
            and utility company.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={hasData ? "outline" : "default"}
          onClick={() => setShowForm(true)}
          className="min-h-[44px] gap-2"
        >
          {hasData ? (
            <>
              <Pencil className="h-4 w-4" />
              Edit consumption
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Enter consumption data
            </>
          )}
        </Button>
      </div>

      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground">
              No consumption data yet
            </h4>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add utility company, annual kWh, and optional monthly breakdown to
              sync with Aurora and request designs.
            </p>
            <Button
              type="button"
              className="mt-5 min-h-[44px] gap-2"
              onClick={() => setShowForm(true)}
            >
              <Zap className="h-4 w-4" />
              Enter consumption data
            </Button>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Utility information
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <DataField
                icon={Building2}
                label="Utility company"
                value={utilityCompany || "—"}
              />
              <DataField
                icon={BarChart3}
                label="Annual kWh"
                value={annualKwh > 0 ? annualKwh.toLocaleString() : "—"}
                unit="kWh"
              />
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usage data
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <DataField
                icon={DollarSign}
                label="Monthly bill"
                value={monthlyBill != null ? `$${monthlyBill}` : "—"}
                unit="/mo"
              />
              <DataField
                icon={Zap}
                label="Annual kWh"
                value={annualKwh > 0 ? annualKwh.toLocaleString() : "—"}
                unit="kWh"
              />
              <DataField
                icon={BarChart3}
                label="Avg monthly kWh"
                value={
                  annualKwh > 0
                    ? Math.round(annualKwh / 12).toLocaleString()
                    : "—"
                }
                unit="kWh"
              />
            </div>
          </div>
          {monthlyKwh.length === 12 && monthlyKwh.some((v) => v > 0) && (
            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-5 py-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly usage breakdown
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-premium">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTH_LABELS.map((month, idx) => (
                      <tr key={month}>
                        <td className="text-sm font-medium text-foreground">
                          {month}
                        </td>
                        <td className="text-sm text-foreground">
                          {(monthlyKwh[idx] ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
