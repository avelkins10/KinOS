"use client";

import React from "react";

import type { DealStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Check,
  UserCheck,
  Zap,
  Palette,
  FileText,
  CreditCard,
  PenTool,
  PhoneCall,
  ClipboardCheck,
  Rocket,
} from "lucide-react";

export interface WorkflowStep {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "deal_assignment", label: "Deal Assignment", icon: UserCheck },
  { key: "consumption", label: "Consumption", icon: Zap },
  { key: "designs", label: "Designs", icon: Palette },
  { key: "proposal", label: "Proposal", icon: FileText },
  { key: "financing", label: "Financing", icon: CreditCard },
  { key: "contracting", label: "Contracting", icon: PenTool },
  { key: "welcome_call", label: "Welcome Call", icon: PhoneCall },
  { key: "pre_intake", label: "Pre-Intake Checklist", icon: ClipboardCheck },
  { key: "project_submission", label: "Project Submission", icon: Rocket },
];

export function getStepIndexFromStage(stage: DealStage): number {
  switch (stage) {
    case "new_lead":
      return 0;
    case "design_requested":
      return 1;
    case "design_complete":
      return 2;
    case "proposal":
      return 3;
    case "financing":
      return 4;
    case "contracting":
      return 5;
    case "pre_intake":
      return 7;
    case "submitted":
    case "intake_approved":
      return 8;
    default:
      return 0;
  }
}

export function DealWorkflowStepper({
  currentStepIndex,
  activeStepIndex,
  onStepClick,
}: {
  currentStepIndex: number;
  activeStepIndex: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <nav className="flex flex-col" aria-label="Deal workflow">
      {WORKFLOW_STEPS.map((step, idx) => {
        const isDone = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;
        const isActive = idx === activeStepIndex;
        const isClickable = idx <= currentStepIndex;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex">
            {/* Left: circle + connecting line */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isDone && "border-success bg-success cursor-pointer",
                  isCurrent && "border-primary bg-primary/15 cursor-pointer",
                  !isDone &&
                    !isCurrent &&
                    "border-border bg-muted cursor-default",
                  isActive &&
                    isDone &&
                    "ring-2 ring-success/30 ring-offset-1 ring-offset-card",
                  isActive &&
                    isCurrent &&
                    "ring-2 ring-primary/30 ring-offset-1 ring-offset-card",
                )}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.label}${isDone ? " (completed)" : isCurrent ? " (in progress)" : " (not started)"}`}
              >
                {isDone ? (
                  <Check
                    className="h-3.5 w-3.5 text-success-foreground"
                    strokeWidth={3}
                  />
                ) : isCurrent ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse-glow" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-border" />
                )}
              </button>
              {/* Connecting line */}
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[8px]",
                    idx < currentStepIndex ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Right: label row */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(idx)}
              disabled={!isClickable}
              className={cn(
                "ml-3 flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 mb-1 text-left transition-all duration-200",
                isActive && "bg-primary/8",
                isClickable && !isActive && "hover:bg-muted/60 cursor-pointer",
                !isClickable && "cursor-default opacity-50",
              )}
            >
              <StepIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isDone && "text-success",
                  isCurrent && "text-primary",
                  !isDone && !isCurrent && "text-muted-foreground/40",
                )}
              />
              <span
                className={cn(
                  "text-[13px] font-medium leading-tight",
                  isDone && "text-foreground",
                  isCurrent && "text-primary font-semibold",
                  isActive &&
                    !isCurrent &&
                    isDone &&
                    "text-foreground font-semibold",
                  !isDone && !isCurrent && "text-muted-foreground/40",
                )}
              >
                {step.label}
              </span>
              {isDone && (
                <span className="ml-auto text-[10px] font-semibold text-success/70">
                  Done
                </span>
              )}
              {isCurrent && (
                <span className="ml-auto text-[10px] font-semibold text-primary/70">
                  Current
                </span>
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
