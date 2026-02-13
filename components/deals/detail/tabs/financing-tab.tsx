"use client";

import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail, FinancingAppWithJoins } from "@/lib/actions/deals";
import {
  FINANCING_STEPS,
  getFinancingProgressIndex,
  FINANCING_STATUS_LABELS,
  FINANCING_STATUS_COLORS,
} from "@/lib/constants/financing";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Check, Clock } from "lucide-react";

export function FinancingTab({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  const isLoading = !dealDetail;
  const apps = dealDetail?.financingApplications ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No financing applications
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Submit a financing application from the Financing step to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {apps.length} application{apps.length !== 1 ? "s" : ""}
      </p>
      {apps.map((app) => (
        <ApplicationSummaryCard key={app.id} app={app} />
      ))}
    </div>
  );
}

function ApplicationSummaryCard({ app }: { app: FinancingAppWithJoins }) {
  const lenderName = app.lender?.name ?? "Unknown Lender";
  const productName = app.lender_product?.name ?? null;
  const status = app.status;
  const progressIdx = getFinancingProgressIndex(status);
  const isTerminal = ["denied", "cancelled", "expired"].includes(status);

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
          {lenderName[0]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{lenderName}</p>
          {productName && (
            <p className="text-sm text-muted-foreground">{productName}</p>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            FINANCING_STATUS_COLORS[status] ?? FINANCING_STATUS_COLORS.draft,
          )}
        >
          {FINANCING_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {/* Key details */}
      <div className="grid gap-3 sm:grid-cols-3">
        {app.loan_amount != null && (
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Loan Amount
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              ${Number(app.loan_amount).toLocaleString()}
            </p>
          </div>
        )}
        {app.submitted_at && (
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Submitted
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {new Date(app.submitted_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}
        {app.decision_at && (
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Decision
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {new Date(app.decision_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Approved details */}
      {(status === "approved" || status === "conditionally_approved") &&
        (app.approved_amount ||
          app.approved_rate ||
          app.approved_term_months) && (
          <div className="grid gap-2 sm:grid-cols-3">
            {app.approved_amount != null && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-2">
                <p className="text-[10px] font-semibold uppercase text-success/70">
                  Approved Amount
                </p>
                <p className="text-sm font-bold text-success">
                  ${Number(app.approved_amount).toLocaleString()}
                </p>
              </div>
            )}
            {app.approved_rate != null && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-2">
                <p className="text-[10px] font-semibold uppercase text-success/70">
                  Rate
                </p>
                <p className="text-sm font-bold text-success">
                  {Number(app.approved_rate)}%
                </p>
              </div>
            )}
            {app.approved_term_months != null && (
              <div className="rounded-lg border border-success/20 bg-success/5 p-2">
                <p className="text-[10px] font-semibold uppercase text-success/70">
                  Term
                </p>
                <p className="text-sm font-bold text-success">
                  {app.approved_term_months} months
                </p>
              </div>
            )}
          </div>
        )}

      {/* Denial reason */}
      {status === "denied" && app.denial_reason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs font-semibold text-destructive">
            Denial Reason
          </p>
          <p className="mt-1 text-sm text-destructive/80">
            {app.denial_reason}
          </p>
        </div>
      )}

      {/* Conditions */}
      {status === "conditionally_approved" && app.conditions && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
          <p className="text-xs font-semibold text-warning">Conditions</p>
          <p className="mt-1 text-sm text-warning/80">{app.conditions}</p>
        </div>
      )}

      {/* Status Tracker (non-interactive) */}
      {!isTerminal && (
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-1">
            {FINANCING_STEPS.map((step, idx) => {
              const isDone = idx <= progressIdx;
              const isCurrent = idx === progressIdx + 1;
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
                          idx <= progressIdx ? "bg-success" : "bg-border",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        isDone
                          ? "border-success bg-success"
                          : isCurrent
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted",
                      )}
                    >
                      {isDone ? (
                        <Check
                          className="h-3.5 w-3.5 text-success-foreground"
                          strokeWidth={3}
                        />
                      ) : isCurrent ? (
                        <Clock className="h-3.5 w-3.5 text-primary" />
                      ) : null}
                    </div>
                    {idx < FINANCING_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          idx < progressIdx ? "bg-success" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium text-center truncate w-full px-0.5",
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
      )}
    </div>
  );
}
