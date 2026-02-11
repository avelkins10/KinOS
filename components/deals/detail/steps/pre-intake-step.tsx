"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Check, Shield, Upload, AlertTriangle, ClipboardCheck } from "lucide-react"

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
  const isSigned = deal.stage === "contracting" || deal.stage === "pre_intake" || deal.stage === "submitted" || deal.stage === "intake_approved"
  const isSubmitted = deal.stage === "submitted" || deal.stage === "intake_approved"

  return [
    { id: "g1", label: "Design completed in Aurora", type: "auto", passed: hasDesign, detail: hasDesign ? "Aurora verified" : undefined },
    { id: "g2", label: "Proposal finalized", type: "auto", passed: hasValue, detail: hasValue ? "Auto-verified" : undefined },
    { id: "g3", label: "Financing approved", type: "auto", passed: hasLender && (deal.stage === "financing" || isSigned || isSubmitted), detail: hasLender ? deal.lender ?? undefined : undefined },
    { id: "g4", label: "All contracts signed", type: "auto", passed: isSigned, detail: isSigned ? "DocuSign" : undefined },
    { id: "g5", label: "Welcome call completed", type: "manual", passed: isSubmitted || isSigned, detail: isSigned ? "Completed by Sarah L." : undefined },
    { id: "g6", label: "Utility bill uploaded", type: "upload", passed: isSigned },
    { id: "g7", label: "Photo ID verified", type: "upload", passed: isSigned },
    { id: "g8", label: "Site photos uploaded", type: "upload", passed: isSubmitted },
    { id: "g9", label: "HOA approval (if applicable)", type: "manual", passed: isSubmitted, detail: isSubmitted ? "N/A - No HOA" : undefined },
    { id: "g10", label: "Manager approval", type: "manual", passed: isSubmitted, detail: isSubmitted ? "Sarah L." : undefined },
  ]
}

const typeLabels = {
  auto: { bg: "bg-primary/10 text-primary", label: "Auto" },
  manual: { bg: "bg-accent/10 text-accent", label: "Manual" },
  upload: { bg: "bg-chart-4/10 text-chart-4", label: "Upload" },
}

export function PreIntakeStep({ deal }: { deal: Deal }) {
  const gates = getGates(deal)
  const passedCount = gates.filter((g) => g.passed).length
  const allPassed = passedCount === gates.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Pre-Intake Checklist</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All required documents and gates before project submission.
          </p>
        </div>
        {allPassed && (
          <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">All Gates Passed</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">Gate Progress</span>
            <span className="text-xs font-bold text-muted-foreground">{passedCount}/{gates.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", allPassed ? "bg-success" : "bg-primary")}
              style={{ width: `${(passedCount / gates.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gates */}
      <div className="space-y-2">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 transition-all",
              gate.passed ? "border-success/20 bg-success/5" : "border-border bg-card"
            )}
          >
            {gate.passed ? (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success">
                <Check className="h-3.5 w-3.5 text-success-foreground" strokeWidth={3} />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border">
                {gate.type === "upload" ? (
                  <Upload className="h-3 w-3 text-muted-foreground/40" />
                ) : gate.type === "auto" ? (
                  <Shield className="h-3 w-3 text-muted-foreground/40" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-warning/60" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", gate.passed ? "text-success" : "text-foreground")}>{gate.label}</p>
              {gate.detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{gate.detail}</p>}
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase", typeLabels[gate.type].bg)}>
              {typeLabels[gate.type].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
