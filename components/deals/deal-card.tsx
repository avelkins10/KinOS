"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Zap, Clock, Building2 } from "lucide-react"

export function DealCard({ deal }: { deal: Deal }) {
  const isStale = deal.daysInStage > 7
  const isWarning = deal.daysInStage > 5 && deal.daysInStage <= 7

  return (
    <a
      href={`/deals/${deal.id}`}
      className="card-premium group block p-3.5 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Customer name + value */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-card-foreground group-hover:text-primary transition-colors leading-tight">
          {deal.customerName}
        </p>
        {deal.dealValue > 0 ? (
          <span className="shrink-0 text-xs font-bold text-card-foreground">
            ${(deal.dealValue / 1000).toFixed(1)}k
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-muted-foreground/50">--</span>
        )}
      </div>

      {/* System size + Days in stage */}
      <div className="mt-2 flex items-center gap-2">
        {deal.systemSize ? (
          <span className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Zap className="h-2.5 w-2.5" />
            {deal.systemSize} kW
          </span>
        ) : (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50">
            No design
          </span>
        )}
        <div
          className={cn(
            "ml-auto flex items-center gap-1 text-[10px] font-semibold",
            isStale
              ? "text-destructive"
              : isWarning
                ? "text-warning"
                : "text-muted-foreground"
          )}
        >
          <Clock className="h-2.5 w-2.5" />
          {deal.daysInStage}d
        </div>
      </div>

      {/* Closer + Office */}
      <div className="mt-2.5 flex items-center gap-2 border-t border-border/60 pt-2.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
          {deal.closer.avatar}
        </div>
        <span className="truncate text-[11px] font-medium text-muted-foreground">
          {deal.closer.name}
        </span>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Building2 className="h-2.5 w-2.5" />
          <span className="truncate max-w-[80px]">{deal.closer.office.replace(" Office", "")}</span>
        </div>
      </div>
    </a>
  )
}
