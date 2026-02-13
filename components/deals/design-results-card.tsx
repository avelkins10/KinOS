"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DealForUI } from "@/lib/deals-mappers";
import { cn } from "@/lib/utils";
import {
  Zap,
  Sun,
  BarChart3,
  Battery,
  ExternalLink,
  RefreshCw,
  Calendar,
} from "lucide-react";

export interface DesignResultsCardProps {
  deal: DealForUI;
  onRequestRedesign?: () => void;
  className?: string;
}

export function DesignResultsCard({
  deal,
  onRequestRedesign,
  className,
}: DesignResultsCardProps) {
  const systemSize = deal.systemSize ?? 0;
  const panelCount = deal.panelCount ?? 0;
  const panelModel = deal.panelBrand ?? "—";
  const inverterModel = deal.inverterBrand ?? "—";
  const annualProduction = deal.annualProduction ?? 0;
  const offset = deal.offset ?? 0;
  const designCompletedAt = deal.designCompletedAt
    ? new Date(deal.designCompletedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const salesModeUrl = deal.auroraSalesModeUrl;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Design results</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Completed {designCompletedAt}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                System size
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {systemSize} kW
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sun className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Panels
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {panelCount}
            </p>
            <p className="text-xs text-muted-foreground">{panelModel}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Annual prod.
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {annualProduction > 0
                ? `${(annualProduction / 1000).toFixed(1)}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">MWh/yr</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Offset
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {offset}%
            </p>
          </div>
        </div>

        {/* Equipment details */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Equipment
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Panel model</p>
                <p className="text-sm font-semibold text-foreground">
                  {panelModel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inverter</p>
                <p className="text-sm font-semibold text-foreground">
                  {inverterModel}
                </p>
              </div>
            </div>
            {deal.batteryModel && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Battery className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Battery</p>
                  <p className="text-sm font-semibold text-foreground">
                    {deal.batteryModel}
                    {deal.batteryCount != null && ` × ${deal.batteryCount}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            Open Aurora to view layout and proposal.
          </div>
          <div className="flex min-h-[44px] flex-wrap items-center gap-2">
            {salesModeUrl && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="min-h-[44px] gap-2"
                onClick={() =>
                  window.open(salesModeUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="h-4 w-4" />
                Open Sales Mode
              </Button>
            )}
            {onRequestRedesign && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] gap-2"
                onClick={onRequestRedesign}
              >
                <RefreshCw className="h-4 w-4" />
                Request Redesign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
