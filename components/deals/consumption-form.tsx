"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

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

export interface ConsumptionData {
  utilityCompany: string;
  utilityTariff: string;
  monthlyBill: number | null;
  annualKwh: number | null;
  monthlyKwh: number[];
}

const defaultMonthly = (): number[] => Array(12).fill(0);

export interface ConsumptionFormProps {
  dealId: string;
  initialData?: ConsumptionData | null;
  onSuccess?: () => void;
  className?: string;
}

export function ConsumptionForm({
  dealId,
  initialData,
  onSuccess,
  className,
}: ConsumptionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [utilityCompany, setUtilityCompany] = useState(
    initialData?.utilityCompany ?? "",
  );
  const [utilityTariff, setUtilityTariff] = useState(
    initialData?.utilityTariff ?? "",
  );
  const [monthlyBill, setMonthlyBill] = useState<string>(
    initialData?.monthlyBill != null ? String(initialData.monthlyBill) : "",
  );
  const [annualKwh, setAnnualKwh] = useState<string>(
    initialData?.annualKwh != null ? String(initialData.annualKwh) : "",
  );
  const [monthlyKwh, setMonthlyKwh] = useState<number[]>(
    initialData?.monthlyKwh?.length === 12
      ? [...initialData.monthlyKwh]
      : defaultMonthly(),
  );

  const annualFromMonthly = useMemo(
    () => monthlyKwh.reduce((a, b) => a + b, 0),
    [monthlyKwh],
  );
  const hasCompleteMonthly = monthlyKwh.every((v) => v > 0);
  const effectiveAnnual = hasCompleteMonthly
    ? annualFromMonthly
    : parseFloat(annualKwh) || 0;

  const chartData = useMemo(() => {
    const values = hasCompleteMonthly
      ? monthlyKwh
      : effectiveAnnual > 0
        ? Array(12)
            .fill(0)
            .map(() => Math.round(effectiveAnnual / 12))
        : defaultMonthly();
    return MONTH_LABELS.map((month, i) => ({
      month,
      kwh: values[i] ?? 0,
    }));
  }, [monthlyKwh, hasCompleteMonthly, effectiveAnnual]);

  const handleMonthlyChange = (index: number, value: string) => {
    const num = parseFloat(value) || 0;
    setMonthlyKwh((prev) => {
      const next = [...prev];
      next[index] = num;
      return next;
    });
  };

  const handleAnnualChange = (value: string) => {
    setAnnualKwh(value);
    const num = parseFloat(value);
    if (!Number.isNaN(num) && num > 0) {
      const perMonth = Math.round(num / 12);
      setMonthlyKwh(Array(12).fill(perMonth));
    }
  };

  const isValid =
    (parseFloat(annualKwh) > 0 || hasCompleteMonthly) &&
    utilityCompany.trim().length > 0;
  const parsedBill = parseFloat(monthlyBill);
  const monthlyBillNum = Number.isNaN(parsedBill) ? undefined : parsedBill;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast({
        title: "Validation error",
        description:
          "Provide utility company and either annual kWh (>0) or complete 12 monthly kWh values (all >0).",
        variant: "destructive",
      });
      return;
    }
    const finalAnnual =
      parseFloat(annualKwh) > 0 ? parseFloat(annualKwh) : annualFromMonthly;
    const finalMonthly = hasCompleteMonthly
      ? monthlyKwh
      : Array(12).fill(Math.round(finalAnnual / 12));

    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/aurora`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_consumption",
          monthly_kwh: finalMonthly,
          annual_kwh: finalAnnual,
          utility_company: utilityCompany.trim(),
          utility_tariff: utilityTariff.trim() || undefined,
          monthly_bill: monthlyBillNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save consumption");
      }
      toast({
        title: "Consumption saved",
        description: "Data saved to KinOS and Aurora.",
      });
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utility & usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="utility-company">Utility company</Label>
              <Input
                id="utility-company"
                value={utilityCompany}
                onChange={(e) => setUtilityCompany(e.target.value)}
                placeholder="e.g. PG&E"
                required
                aria-label="Utility company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utility-tariff">
                Utility tariff / rate plan (optional)
              </Label>
              <Input
                id="utility-tariff"
                value={utilityTariff}
                onChange={(e) => setUtilityTariff(e.target.value)}
                placeholder="e.g. E-19"
                aria-label="Utility tariff"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthly-bill">Monthly electric bill ($)</Label>
              <Input
                id="monthly-bill"
                type="number"
                min={0}
                step={1}
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(e.target.value)}
                placeholder="e.g. 245"
                aria-label="Monthly bill in dollars"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-kwh">Annual kWh usage</Label>
              <Input
                id="annual-kwh"
                type="number"
                min={0}
                step={1}
                value={annualKwh}
                onChange={(e) => handleAnnualChange(e.target.value)}
                placeholder="e.g. 14400"
                aria-label="Annual kWh"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Monthly kWh breakdown (optional)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter monthly values or use annual to auto-fill. Chart updates in
            real time.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {MONTH_LABELS.map((month, i) => (
              <div key={month} className="space-y-1">
                <Label htmlFor={`month-${i}`} className="text-xs">
                  {month}
                </Label>
                <Input
                  id={`month-${i}`}
                  type="number"
                  min={0}
                  step={1}
                  value={monthlyKwh[i] === 0 ? "" : monthlyKwh[i]}
                  onChange={(e) => handleMonthlyChange(i, e.target.value)}
                  placeholder="0"
                  className="h-9"
                  aria-label={`${month} kWh`}
                />
              </div>
            ))}
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value} kWh`, "kWh"]}
                />
                <Bar
                  dataKey="kwh"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="kWh"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={!isValid || loading}
          className="min-h-[44px]"
        >
          {loading ? "Saving…" : "Save consumption"}
        </Button>
      </div>
    </form>
  );
}
