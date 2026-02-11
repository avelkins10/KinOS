"use client";

import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Check,
  Clock,
  AlertTriangle,
  Upload,
  Send,
} from "lucide-react";

const financingSteps = ["Applied", "Approved", "Stips Cleared", "Funded"];

function getFinancingStep(stage: string): number {
  switch (stage) {
    case "financing_applied":
      return 0;
    case "financing_approved":
      return 1;
    case "contract_signed":
      return 2;
    case "submitted":
      return 3;
    default:
      return -1;
  }
}

export function FinancingStep({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  if (!deal.lender) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Financing</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit a financing application and track its status.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No financing yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Finalize a proposal to begin the financing process.
          </p>
          <button
            type="button"
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            <Send className="h-4 w-4" />
            Submit Application
          </button>
        </div>
      </div>
    );
  }

  const currentFinStep = getFinancingStep(deal.stage);
  const hasStips = deal.stage === "financing_approved";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Financing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Application status and stipulation tracking.
        </p>
      </div>

      {/* Lender Card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
          {deal.lender[0]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{deal.lender}</p>
          <p className="text-sm text-muted-foreground">{deal.lenderProduct}</p>
        </div>
        {deal.monthlyPayment && (
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">
              ${deal.monthlyPayment}/mo
            </p>
            <p className="text-xs text-muted-foreground">Monthly payment</p>
          </div>
        )}
      </div>

      {/* Status Tracker */}
      <div className="rounded-xl border border-border p-5">
        <h4 className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Application Status
        </h4>
        <div className="flex items-start gap-1">
          {financingSteps.map((step, idx) => {
            const isDone = idx <= currentFinStep;
            const isCurrent = idx === currentFinStep + 1;
            return (
              <div
                key={step}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex items-center w-full">
                  {idx > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        idx <= currentFinStep ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isDone
                        ? "border-success bg-success"
                        : isCurrent
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted",
                    )}
                  >
                    {isDone ? (
                      <Check
                        className="h-4 w-4 text-success-foreground"
                        strokeWidth={3}
                      />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                  {idx < financingSteps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        idx < currentFinStep ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium text-center",
                    isDone
                      ? "text-success"
                      : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground/50",
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stips Section */}
      {hasStips && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-semibold text-foreground">
              Stipulations Pending
            </h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "Utility Bill (Most Recent)", uploaded: false },
              { label: "Photo ID", uploaded: true },
              { label: "Proof of Homeownership", uploaded: false },
            ].map((stip) => (
              <div
                key={stip.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5"
              >
                {stip.uploaded ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
                    <Check
                      className="h-3 w-3 text-success-foreground"
                      strokeWidth={3}
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border">
                    <Upload className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    stip.uploaded
                      ? "text-muted-foreground line-through"
                      : "text-foreground font-medium",
                  )}
                >
                  {stip.label}
                </span>
                {!stip.uploaded && (
                  <button
                    type="button"
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Upload
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
