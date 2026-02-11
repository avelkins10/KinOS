"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"

interface Lender {
  id: string
  name: string
  products: string[]
  active: boolean
  apiEnabled: boolean
  avgApprovalDays: number
  approvalRate: number
  color: string
}

const LENDERS: Lender[] = [
  { id: "l1", name: "LightReach", products: ["25yr PPA", "20yr PPA"], active: true, apiEnabled: true, avgApprovalDays: 2, approvalRate: 82, color: "bg-chart-1" },
  { id: "l2", name: "GoodLeap", products: ["25yr Loan", "20yr Loan", "15yr Loan"], active: true, apiEnabled: true, avgApprovalDays: 1, approvalRate: 78, color: "bg-primary" },
  { id: "l3", name: "Mosaic", products: ["25yr Loan", "20yr Loan"], active: true, apiEnabled: true, avgApprovalDays: 3, approvalRate: 75, color: "bg-chart-2" },
  { id: "l4", name: "Climate First Bank", products: ["HELOC", "Home Equity Loan"], active: true, apiEnabled: false, avgApprovalDays: 7, approvalRate: 68, color: "bg-success" },
  { id: "l5", name: "Dividend", products: ["25yr Loan", "20yr Loan"], active: true, apiEnabled: true, avgApprovalDays: 2, approvalRate: 80, color: "bg-chart-4" },
  { id: "l6", name: "EnFin", products: ["25yr Loan", "20yr Loan", "12yr Loan"], active: true, apiEnabled: false, avgApprovalDays: 4, approvalRate: 72, color: "bg-accent" },
  { id: "l7", name: "Sunlight", products: ["25yr Loan", "20yr Loan"], active: false, apiEnabled: false, avgApprovalDays: 5, approvalRate: 65, color: "bg-muted-foreground" },
]

export default function AdminLendersPage() {
  const [search, setSearch] = useState("")

  const filtered = LENDERS.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lenders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure lending partners, products, and API connections.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Lender
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lenders..."
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lender) => (
          <div
            key={lender.id}
            className={cn(
              "group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md",
              !lender.active && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    lender.color + "/15"
                  )}
                >
                  <Building2 className={cn("h-5 w-5", lender.color.replace("bg-", "text-"))} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {lender.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    {lender.active ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                    {lender.apiEnabled && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        API
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                aria-label={`Actions for ${lender.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Products */}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lender.products.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Approval</p>
                <p className="text-sm font-semibold text-foreground">
                  {lender.approvalRate}%
                </p>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Days</p>
                <p className="text-sm font-semibold text-foreground">
                  {lender.avgApprovalDays}d
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
