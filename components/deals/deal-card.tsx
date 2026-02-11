"use client";

import type { DealForUI } from "@/lib/deals-mappers";
import { cn } from "@/lib/utils";
import { MapPin, Zap, Clock } from "lucide-react";
import Link from "next/link";

export function DealCard({ deal }: { deal: DealForUI }) {
  const isStale = deal.daysInStage > 7;
  const isWarning = deal.daysInStage > 5 && deal.daysInStage <= 7;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="group block rounded-lg border border-border bg-card p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {deal.customerName}
        </p>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
          {deal.closer?.avatar ?? "?"}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {deal.address}, {deal.city}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {deal.systemSize && (
          <span className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            <Zap className="h-2.5 w-2.5" />
            {deal.systemSize} kW
          </span>
        )}
        {deal.lender && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {deal.lender}
          </span>
        )}
      </div>

      {/* Progress + Age */}
      <div className="mt-3 flex items-center justify-between">
        {deal.dealValue > 0 ? (
          <span className="text-xs font-semibold text-card-foreground">
            ${(deal.dealValue / 1000).toFixed(1)}k
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">No value yet</span>
        )}
        <div
          className={cn(
            "flex items-center gap-1 text-[10px] font-medium",
            isStale
              ? "text-destructive"
              : isWarning
                ? "text-warning"
                : "text-muted-foreground",
          )}
        >
          <Clock className="h-2.5 w-2.5" />
          {deal.daysInStage}d
        </div>
      </div>

      {/* Subtle progress bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-500"
          style={{
            width: `${Math.min((deal.daysInPipeline / 60) * 100, 100)}%`,
          }}
        />
      </div>
    </Link>
  );
}
