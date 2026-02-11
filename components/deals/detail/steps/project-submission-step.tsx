"use client"

import React from "react"

import { useState } from "react"
import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Check, Rocket, Zap, CreditCard, FileText, ClipboardCheck } from "lucide-react"

interface ReviewItem {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  ok: boolean
}

function getReviewItems(deal: Deal): ReviewItem[] {
  const hasDesign = !!deal.systemSize
  const hasLender = !!deal.lender
  const isSigned = deal.stage === "contract_signed" || deal.stage === "submitted"
  return [
    { label: "System Design", value: hasDesign ? `${deal.systemSize} kW, ${deal.panelCount} panels` : "Not complete", icon: Zap, ok: hasDesign },
    { label: "Proposal", value: deal.dealValue > 0 ? `$${deal.dealValue.toLocaleString()} net` : "Not created", icon: FileText, ok: deal.dealValue > 0 },
    { label: "Financing", value: hasLender ? `${deal.lender} - ${deal.lenderProduct}` : "Not submitted", icon: CreditCard, ok: hasLender },
    { label: "Contracts", value: isSigned ? "All signed" : "Not signed", icon: FileText, ok: isSigned },
    { label: "Pre-Intake", value: deal.stage === "submitted" ? "All gates passed" : "Incomplete", icon: ClipboardCheck, ok: deal.stage === "submitted" },
  ]
}

export function ProjectSubmissionStep({ deal }: { deal: Deal }) {
  const [submitted, setSubmitted] = useState(deal.stage === "submitted")
  const items = getReviewItems(deal)
  const allOk = items.every((i) => i.ok)

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Project Submission</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Submitted to Quickbase</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            QB ID: QB-2026-{deal.id.replace("d", "")}4821 {"·"} Feb 8, 2026 at 2:34 PM
          </p>
          <div className="mt-4 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success">
            All gates passed. Deal successfully submitted.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Project Submission</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review everything before submitting to Quickbase.
        </p>
      </div>

      {/* Review Summary */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4",
                item.ok ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                item.ok ? "bg-success/15" : "bg-destructive/15"
              )}>
                {item.ok ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Icon className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.value}</p>
              </div>
              {item.ok ? (
                <span className="text-xs font-bold text-success">Ready</span>
              ) : (
                <span className="text-xs font-bold text-destructive">Required</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Deal Value Summary */}
      {deal.dealValue > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Deal Value</span>
            <span className="text-2xl font-bold text-foreground">${deal.dealValue.toLocaleString()}</span>
          </div>
          {deal.monthlyPayment && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Payment</span>
              <span className="text-lg font-semibold text-primary">${deal.monthlyPayment}/mo</span>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          disabled={!allOk}
          onClick={() => setSubmitted(true)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all",
            allOk
              ? "bg-success text-success-foreground hover:bg-success/90 hover:shadow-xl hover:shadow-success/20 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          <Rocket className="h-5 w-5" />
          Submit to Quickbase
        </button>
      </div>
      {!allOk && (
        <p className="text-center text-xs text-muted-foreground">
          Complete all required items above to enable submission.
        </p>
      )}
    </div>
  )
}
