"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Sun, Zap, BarChart3, ExternalLink, Clock, Check } from "lucide-react"

export function DesignsStep({ deal }: { deal: Deal }) {
  const hasDesign = !!deal.systemSize

  if (!hasDesign) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Designs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a design from Aurora to begin the system design process.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sun className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No design yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create an Aurora project to generate a solar design for this customer.
          </p>
          <button
            type="button"
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            <ExternalLink className="h-4 w-4" />
            Create Aurora Project
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Designs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aurora design results for this project.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-bold text-success">Design Complete</span>
        </div>
      </div>

      {/* Design Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Size</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{deal.systemSize} kW</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sun className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Panels</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{deal.panelCount}</p>
          <p className="text-xs text-muted-foreground">{deal.panelBrand}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Annual Prod.</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {deal.annualProduction ? `${(deal.annualProduction / 1000).toFixed(1)}` : "--"}
          </p>
          <p className="text-xs text-muted-foreground">MWh/yr</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Offset</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{deal.offset ?? "--"}%</p>
        </div>
      </div>

      {/* Equipment Detail */}
      <div className="rounded-xl border border-border p-5">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Panel Brand</p>
              <p className="text-sm font-semibold text-foreground">{deal.panelBrand}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inverter</p>
              <p className="text-sm font-semibold text-foreground">{deal.inverterBrand}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aurora Link */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Design completed 3 days ago</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Aurora
        </button>
      </div>
    </div>
  )
}
