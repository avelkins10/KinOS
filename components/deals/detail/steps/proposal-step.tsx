"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Plus, Check, Eye, Edit, Copy, FileText, DollarSign } from "lucide-react"

interface Proposal {
  id: string
  name: string
  lender: string
  product: string
  monthlyPayment: number
  netCost: number
  status: "draft" | "ready" | "finalized"
  dealerFee: number
  ppw: number
}

function getMockProposals(deal: Deal): Proposal[] {
  if (!deal.dealValue || !deal.lender) return []
  const ppw = deal.systemSize ? deal.dealValue / (deal.systemSize * 1000) : 0
  return [
    {
      id: "p1",
      name: "Option A - Primary",
      lender: deal.lender,
      product: deal.lenderProduct ?? "25yr Loan",
      monthlyPayment: deal.monthlyPayment ?? 0,
      netCost: deal.dealValue,
      status: "finalized",
      dealerFee: 0,
      ppw,
    },
    {
      id: "p2",
      name: "Option B - Lower Monthly",
      lender: "GoodLeap",
      product: "25yr Loan",
      monthlyPayment: (deal.monthlyPayment ?? 180) * 0.88,
      netCost: deal.dealValue * 1.06,
      status: "ready",
      dealerFee: 6,
      ppw: ppw * 1.06,
    },
  ]
}

const statusStyles = {
  draft: "bg-muted text-muted-foreground border-border",
  ready: "bg-primary/10 text-primary border-primary/20",
  finalized: "bg-success/10 text-success border-success/20",
}

export function ProposalStep({ deal }: { deal: Deal }) {
  const proposals = getMockProposals(deal)

  if (proposals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Proposal</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a proposal with pricing, adders, discounts, and lender selection.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No proposals yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Complete the design phase first, then create proposals to present to the customer.
          </p>
          <button
            type="button"
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            <Plus className="h-4 w-4" />
            Build Proposal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Proposal</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {proposals.length} proposal options configured.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New Option
        </button>
      </div>

      {/* Pricing Summary */}
      <div className="rounded-xl border border-border p-5">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing Breakdown
        </h4>
        <div className="space-y-2">
          {[
            { label: "Base System Price", value: deal.dealValue * 0.85 },
            { label: "Equipment Adders", value: deal.dealValue * 0.08 },
            { label: "Site Adders", value: deal.dealValue * 0.04 },
            { label: "Discounts", value: -(deal.dealValue * 0.02), isDiscount: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={cn("text-sm font-medium", row.isDiscount ? "text-success" : "text-foreground")}>
                {row.isDiscount ? "-" : ""}${Math.abs(row.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-border pt-3">
            <span className="text-sm font-bold text-foreground">Net Cost</span>
            <div className="flex items-center gap-2">
              {deal.systemSize && (
                <span className="text-xs text-muted-foreground">
                  ${(deal.dealValue / (deal.systemSize * 1000)).toFixed(2)}/W
                </span>
              )}
              <span className="text-lg font-bold text-foreground">
                ${(deal.dealValue * 0.95).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proposals */}
      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative rounded-xl border-2 p-5 transition-all",
              p.status === "finalized" ? "border-success/40 bg-success/5" : "border-border hover:border-primary/20"
            )}
          >
            {p.status === "finalized" && (
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                <Check className="h-3 w-3" /> Active
              </span>
            )}
            <p className="text-sm font-semibold text-foreground">{p.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.lender} {"·"} {p.product}
            </p>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                ${p.monthlyPayment.toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Net: ${p.netCost.toLocaleString()} {"·"} Dealer Fee: {p.dealerFee}% {"·"} ${p.ppw.toFixed(2)}/W
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", statusStyles[p.status])}>
                {p.status}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <button type="button" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Eye className="h-3 w-3" /> View
              </button>
              <button type="button" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Edit className="h-3 w-3" /> Edit
              </button>
              <button type="button" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Copy className="h-3 w-3" /> Clone
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
