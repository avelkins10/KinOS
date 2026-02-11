"use client";

import { useState } from "react";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import {
  DealWorkflowStepper,
  getStepIndexFromStage,
  WORKFLOW_STEPS,
} from "./workflow-stepper";
import { DealAssignmentStep } from "./steps/deal-assignment-step";
import { ConsumptionStep } from "./steps/consumption-step";
import { DesignsStep } from "./steps/designs-step";
import { ProposalStep } from "./steps/proposal-step";
import { FinancingStep } from "./steps/financing-step";
import { ContractingStep } from "./steps/contracting-step";
import { WelcomeCallStep } from "./steps/welcome-call-step";
import { PreIntakeStep } from "./steps/pre-intake-step";
import { ProjectSubmissionStep } from "./steps/project-submission-step";
import { DollarSign } from "lucide-react";

function StepContent({
  stepIndex,
  deal,
  dealDetail,
}: {
  stepIndex: number;
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  switch (stepIndex) {
    case 0:
      return <DealAssignmentStep deal={deal} dealDetail={dealDetail} />;
    case 1:
      return <ConsumptionStep deal={deal} />;
    case 2:
      return <DesignsStep deal={deal} />;
    case 3:
      return <ProposalStep deal={deal} dealDetail={dealDetail} />;
    case 4:
      return <FinancingStep deal={deal} dealDetail={dealDetail} />;
    case 5:
      return <ContractingStep deal={deal} dealDetail={dealDetail} />;
    case 6:
      return <WelcomeCallStep deal={deal} />;
    case 7:
      return <PreIntakeStep deal={deal} dealDetail={dealDetail} />;
    case 8:
      return <ProjectSubmissionStep deal={deal} dealDetail={dealDetail} />;
    default:
      return null;
  }
}

export function DealWorkflowLayout({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  const currentStepIndex = getStepIndexFromStage(deal.stage);
  const [activeStepIndex, setActiveStepIndex] = useState(currentStepIndex);

  const progress = Math.round(
    ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100,
  );

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Workflow Stepper */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-card">
        {/* Progress Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Progress
            </span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DealWorkflowStepper
            currentStepIndex={currentStepIndex}
            activeStepIndex={activeStepIndex}
            onStepClick={setActiveStepIndex}
          />
        </div>

        {/* Deal Value Footer */}
        {deal.dealValue > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Deal Value
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight text-foreground">
              ${deal.dealValue.toLocaleString()}
            </p>
            {(deal.monthlyPayment ?? deal.lenderProduct) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {deal.monthlyPayment != null && `$${deal.monthlyPayment}/mo`}
                {deal.monthlyPayment != null && deal.lenderProduct && " · "}
                {deal.lenderProduct ?? ""}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="mx-auto max-w-3xl px-8 py-8 animate-slide-in"
          key={activeStepIndex}
        >
          <StepContent
            stepIndex={activeStepIndex}
            deal={deal}
            dealDetail={dealDetail}
          />
        </div>
      </div>
    </div>
  );
}
