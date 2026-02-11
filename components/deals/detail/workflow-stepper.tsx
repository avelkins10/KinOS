"use client"

import type { DealStage } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WorkflowStep {
  key: string
  label: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "consumption", label: "Consumption" },
  { key: "deal_details", label: "Deal Details" },
  { key: "design", label: "Design" },
  { key: "proposal", label: "Proposal" },
  { key: "financing", label: "Financing" },
  { key: "contracting", label: "Contracting" },
  { key: "welcome_call", label: "Welcome Call" },
  { key: "pre_intake", label: "Pre-Intake Checklist" },
]

// Map deal stages to workflow step progress
function getStepIndex(stage: DealStage): number {
  switch (stage) {
    case "new_lead":
    case "appointment_set":
      return 0
    case "appointment_completed":
      return 1
    case "design_in_progress":
      return 2
    case "proposal_sent":
      return 3
    case "financing_applied":
    case "financing_approved":
      return 4
    case "contract_signed":
      return 5
    case "submitted":
      return 7
    default:
      return 0
  }
}

export function WorkflowStepper({ stage }: { stage: DealStage }) {
  const currentIndex = getStepIndex(stage)
  const progress = Math.round(((currentIndex + 1) / WORKFLOW_STEPS.length) * 100)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Workflow
      </h3>
      <div className="space-y-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isUpcoming = idx > currentIndex

          return (
            <div key={step.key} className="flex items-stretch gap-3">
              {/* Vertical Line + Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isDone && "border-success bg-success",
                    isCurrent && "border-primary bg-primary/10 animate-pulse-glow",
                    isUpcoming && "border-border bg-muted"
                  )}
                >
                  {isDone && <Check className="h-3 w-3 text-success-foreground" />}
                  {isCurrent && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[16px]",
                      idx < currentIndex ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
              {/* Label */}
              <div className="pb-3">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isDone && "text-success",
                    isCurrent && "text-primary font-semibold",
                    isUpcoming && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
