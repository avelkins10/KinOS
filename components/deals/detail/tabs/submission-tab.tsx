"use client"

import { useState } from "react"
import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Check, AlertTriangle, Shield, Rocket } from "lucide-react"

interface Gate {
  id: string
  label: string
  type: "auto" | "manual" | "upload"
  passed: boolean
  detail?: string
}

function getGates(deal: Deal): Gate[] {
  const hasDesign = !!deal.systemSize
  const hasLender = !!deal.lender
  const hasValue = deal.dealValue > 0
  const isSigned = deal.stage === "contract_signed" || deal.stage === "submitted"

  return [
    { id: "g1", label: "Design completed", type: "auto", passed: hasDesign, detail: hasDesign ? "Aurora" : undefined },
    { id: "g2", label: "Proposal finalized", type: "auto", passed: hasValue, detail: hasValue ? "Auto-verified" : undefined },
    { id: "g3", label: "Financing approved", type: "auto", passed: hasLender && (deal.stage === "financing_approved" || deal.stage === "contract_signed" || deal.stage === "submitted"), detail: hasLender ? deal.lender ?? undefined : undefined },
    { id: "g4", label: "Contract signed", type: "auto", passed: isSigned, detail: isSigned ? "DocuSign" : undefined },
    { id: "g5", label: "Utility bill uploaded", type: "upload", passed: isSigned },
    { id: "g6", label: "Photo ID verified", type: "upload", passed: isSigned },
    { id: "g7", label: "Site photos uploaded", type: "upload", passed: deal.stage === "submitted" },
    { id: "g8", label: "Welcome call completed", type: "manual", passed: deal.stage === "submitted", detail: deal.stage === "submitted" ? "Sarah L." : undefined },
    { id: "g9", label: "Manager approval", type: "manual", passed: deal.stage === "submitted", detail: deal.stage === "submitted" ? "Sarah L." : undefined },
  ]
}

export function SubmissionTab({ deal }: { deal: Deal }) {
  const [submitted, setSubmitted] = useState(deal.stage === "submitted")
  const gates = getGates(deal)
  const passedCount = gates.filter((g) => g.passed).length
  const allPassed = passedCount === gates.length
  const isReady = allPassed && !submitted

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
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
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Pre-Intake Checklist</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {passedCount} of {gates.length} gates passed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", allPassed ? "bg-success" : "bg-primary")}
              style={{ width: `${(passedCount / gates.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {Math.round((passedCount / gates.length) * 100)}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3.5 transition-all",
              gate.passed
                ? "border-success/20 bg-success/5"
                : "border-border"
            )}
          >
            {gate.passed ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border">
                {gate.type === "auto" ? (
                  <Shield className="h-3 w-3 text-muted-foreground/40" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                )}
              </div>
            )}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", gate.passed ? "text-success" : "text-foreground")}>
                {gate.label}
              </p>
              {gate.detail && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{gate.detail}</p>
              )}
            </div>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase",
              gate.type === "auto" ? "bg-primary/10 text-primary" : gate.type === "upload" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            )}>
              {gate.type}
            </span>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          disabled={!isReady}
          onClick={() => setSubmitted(true)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all",
            isReady
              ? "bg-success text-success-foreground hover:bg-success/90 hover:shadow-xl hover:shadow-success/20 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          <Rocket className="h-5 w-5" />
          Submit to Quickbase
        </button>
      </div>
      {!allPassed && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Complete all {gates.length - passedCount} remaining gate{gates.length - passedCount > 1 ? "s" : ""} to enable submission
        </p>
      )}
    </div>
  )
}
