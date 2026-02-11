"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { CreditCard, Check, Clock, AlertTriangle, Upload } from "lucide-react"

const financingSteps = ["Applied", "Approved", "Stips Pending", "Stips Cleared", "Funded"]

function getStepIndex(stage: string): number {
  switch (stage) {
    case "financing_applied": return 0
    case "financing_approved": return 1
    default: return -1
  }
}

export function FinancingTab({ deal }: { deal: Deal }) {
  if (!deal.lender) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No financing yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Finalize a proposal to begin the financing process.
        </p>
      </div>
    )
  }

  const currentStep = getStepIndex(deal.stage)
  const hasStips = deal.stage === "financing_approved"

  return (
    <div className="space-y-6">
      {/* Lender Card */}
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
            {deal.lender[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{deal.lender}</p>
            <p className="text-sm text-muted-foreground">{deal.lenderProduct}</p>
          </div>
        </div>
      </div>

      {/* Status Tracker */}
      <div className="rounded-xl border border-border p-5">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Application Status
        </h4>
        <div className="flex items-center gap-2">
          {financingSteps.map((step, idx) => {
            const isDone = idx <= currentStep
            const isCurrent = idx === currentStep + 1
            return (
              <div key={step} className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                      isDone
                        ? "border-success bg-success"
                        : isCurrent
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 text-success-foreground" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center",
                    isDone ? "text-success" : isCurrent ? "text-primary" : "text-muted-foreground/50"
                  )}>
                    {step}
                  </span>
                </div>
                {idx < financingSteps.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 -mt-4",
                    idx < currentStep ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stips Section */}
      {hasStips && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-semibold text-foreground">Stipulations Pending</h4>
          </div>
          <div className="space-y-3">
            {[
              { label: "Utility Bill (Most Recent)", uploaded: false },
              { label: "Photo ID", uploaded: true },
              { label: "Proof of Homeownership", uploaded: false },
            ].map((stip) => (
              <div key={stip.label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                {stip.uploaded ? (
                  <Check className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("flex-1 text-sm", stip.uploaded ? "text-muted-foreground line-through" : "text-foreground")}>
                  {stip.label}
                </span>
                {!stip.uploaded && (
                  <button type="button" className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                    Upload
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rep Verification */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-foreground">
            Verified for {deal.lender}
          </span>
        </div>
      </div>
    </div>
  )
}
