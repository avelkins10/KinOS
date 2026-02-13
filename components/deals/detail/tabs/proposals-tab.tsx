"use client"

import type { DealForUI } from "@/lib/deals-mappers"
import type { DealDetail } from "@/lib/actions/deals"
import { cn } from "@/lib/utils"
import { Check, FileText } from "lucide-react"

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  ready: "bg-primary/10 text-primary border-primary/20",
  finalized: "bg-success/10 text-success border-success/20",
  superseded: "bg-muted text-muted-foreground border-border",
}

export function ProposalsTab({
  deal,
  dealDetail,
}: {
  deal: DealForUI
  dealDetail?: DealDetail | null
}) {
  const proposals = dealDetail?.proposals ?? []

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No proposals yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Complete the design phase first, then create proposals from the Proposals step.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((p) => {
          const status = p.status ?? "draft"
          const grossCost = p.gross_cost != null ? Number(p.gross_cost) : null
          const monthlyPayment = p.monthly_payment != null ? Number(p.monthly_payment) : null
          const grossPpw = p.gross_ppw != null ? Number(p.gross_ppw) : null
          const netCost = p.net_cost != null ? Number(p.net_cost) : null
          const dealerFee = p.sales_facing_dealer_fee != null ? Number(p.sales_facing_dealer_fee) : null

          return (
            <div
              key={p.id}
              className={cn(
                "relative rounded-xl border-2 p-5 transition-all",
                status === "finalized"
                  ? "border-success/40 bg-success/5"
                  : "border-border hover:border-primary/20"
              )}
            >
              {status === "finalized" && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                  <Check className="h-3 w-3" /> Active
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{p.name ?? "Untitled Proposal"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.system_size_kw != null ? `${Number(p.system_size_kw)} kW` : "—"}
                {p.panel_count != null ? ` · ${p.panel_count} panels` : ""}
              </p>
              <div className="mt-4">
                {monthlyPayment != null ? (
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    ${monthlyPayment.toFixed(2)}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                ) : grossCost != null ? (
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    ${grossCost.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">No pricing</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {netCost != null ? `Net: $${netCost.toLocaleString()}` : ""}
                  {netCost != null && grossPpw != null ? " · " : ""}
                  {grossPpw != null ? `${grossPpw.toFixed(2)} $/W` : ""}
                  {dealerFee != null ? ` · Fee: ${dealerFee}%` : ""}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                    statusStyles[status] ?? statusStyles.draft
                  )}
                >
                  {status}
                </span>
                {p.finalized_at && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(p.finalized_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
