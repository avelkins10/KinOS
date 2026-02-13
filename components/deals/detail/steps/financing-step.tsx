"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail, FinancingAppWithJoins } from "@/lib/actions/deals";
import {
  createFinancingApplication,
  updateFinancingStatus,
} from "@/lib/actions/financing";
import type {
  FinancingStatus,
  UpdateFinancingStatusInput,
} from "@/lib/types/financing";
import {
  FINANCING_STEPS,
  getFinancingProgressIndex,
  FINANCING_STATUS_LABELS,
  FINANCING_STATUS_COLORS,
  TERMINAL_FINANCING_STATUSES,
  getNextFinancingStatuses,
} from "@/lib/constants/financing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Check,
  Clock,
  Send,
  Plus,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

export function FinancingStep({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  const isLoading = !dealDetail;
  const apps = dealDetail?.financingApplications ?? [];
  const proposals = dealDetail?.proposals ?? [];
  const finalizedProposal = proposals.find((p) => p.status === "finalized");
  const hasApps = apps.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Financing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit financing applications and track approval status.
        </p>
      </div>

      {!finalizedProposal && !hasApps && <EmptyState />}
      {finalizedProposal && !hasApps && (
        <SubmitApplicationForm
          dealId={deal.id}
          proposal={finalizedProposal}
        />
      )}
      {hasApps && (
        <ApplicationsView
          dealId={deal.id}
          apps={apps}
          finalizedProposal={finalizedProposal}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <CreditCard className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Finalize a proposal first
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        A finalized proposal is required before submitting a financing
        application.
      </p>
    </div>
  );
}

function SubmitApplicationForm({
  dealId,
  proposal,
}: {
  dealId: string;
  proposal: DealDetail["proposals"][number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loanAmount =
    proposal.gross_cost != null ? Number(proposal.gross_cost) : 0;
  const lenderId = proposal.lender_id;
  const lenderProductId = proposal.lender_product_id;

  const handleSubmit = () => {
    if (!lenderId) {
      setError("No lender selected on the finalized proposal.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createFinancingApplication(dealId, {
        proposalId: proposal.id,
        lenderId,
        lenderProductId: lenderProductId ?? null,
        loanAmount,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-border p-6 space-y-5">
      <h4 className="text-sm font-semibold text-foreground">
        Submit Financing Application
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Proposal
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {proposal.name ?? "Finalized Proposal"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Loan Amount
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            ${loanAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !lenderId}
        aria-label="Submit financing application"
        aria-busy={isPending}
        className="w-full gap-2"
      >
        {isPending ? (
          <Clock className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending ? "Submitting..." : "Submit Application"}
      </Button>
    </div>
  );
}

function ApplicationsView({
  dealId,
  apps,
  finalizedProposal,
}: {
  dealId: string;
  apps: FinancingAppWithJoins[];
  finalizedProposal?: DealDetail["proposals"][number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeApps = apps.filter(
    (a) => !TERMINAL_FINANCING_STATUSES.includes(a.status as FinancingStatus),
  );
  const terminalApps = apps.filter((a) =>
    TERMINAL_FINANCING_STATUSES.includes(a.status as FinancingStatus),
  );

  const handleNewApplication = () => {
    if (!finalizedProposal) {
      setSubmitError("No finalized proposal available.");
      return;
    }
    if (!finalizedProposal.lender_id) {
      setSubmitError("No lender on finalized proposal.");
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result = await createFinancingApplication(dealId, {
        proposalId: finalizedProposal.id,
        lenderId: finalizedProposal.lender_id!,
        lenderProductId: finalizedProposal.lender_product_id ?? null,
        loanAmount:
          finalizedProposal.gross_cost != null
            ? Number(finalizedProposal.gross_cost)
            : 0,
      });
      if (result.error) {
        setSubmitError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {activeApps.map((app) => (
        <ApplicationCard key={app.id} app={app} dealId={dealId} />
      ))}

      {terminalApps.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Previous Applications
          </p>
          {terminalApps.map((app) => (
            <ApplicationCard key={app.id} app={app} dealId={dealId} compact />
          ))}
        </div>
      )}

      {submitError && (
        <div
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      {finalizedProposal && (
        <Button
          type="button"
          variant="outline"
          onClick={handleNewApplication}
          disabled={isPending}
          aria-label="Create new financing application"
          aria-busy={isPending}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Creating..." : "New Application"}
        </Button>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  dealId,
  compact,
}: {
  app: FinancingAppWithJoins;
  dealId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const statusSelectRef = useRef<HTMLSelectElement>(null);

  const status = app.status as FinancingStatus;
  const allowedNext = getNextFinancingStatuses(status);
  const [newStatus, setNewStatus] = useState<FinancingStatus>(
    allowedNext[0] ?? status,
  );
  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvedRate, setApprovedRate] = useState("");
  const [approvedTerm, setApprovedTerm] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);

  const lenderName = app.lender?.name ?? "Unknown Lender";
  const productName = app.lender_product?.name ?? null;
  const progressIdx = getFinancingProgressIndex(status);
  const isTerminal = TERMINAL_FINANCING_STATUSES.includes(status);

  // Focus the status select when the update form opens
  useEffect(() => {
    if (showStatusUpdate && statusSelectRef.current) {
      statusSelectRef.current.focus();
    }
  }, [showStatusUpdate]);

  // Reset newStatus when allowed transitions change
  useEffect(() => {
    if (allowedNext.length > 0 && !allowedNext.includes(newStatus)) {
      setNewStatus(allowedNext[0]);
    }
  }, [allowedNext, newStatus]);

  const handleStatusUpdate = () => {
    if (!allowedNext.includes(newStatus)) return;
    setUpdateError(null);

    const input: UpdateFinancingStatusInput = {
      status: newStatus,
      notes: notes.trim() || undefined,
    };

    if (newStatus === "approved" || newStatus === "conditionally_approved") {
      if (approvedAmount) input.approvedAmount = parseFloat(approvedAmount);
      if (approvedRate) input.approvedRate = parseFloat(approvedRate);
      if (approvedTerm) input.approvedTermMonths = parseInt(approvedTerm, 10);
    }
    if (newStatus === "conditionally_approved" && notes.trim()) {
      input.conditions = notes.trim();
    }
    if (newStatus === "denied" && denialReason.trim()) {
      input.denialReason = denialReason.trim();
    }

    startTransition(async () => {
      const result = await updateFinancingStatus(app.id, input);
      if (result.error) {
        setUpdateError(result.error);
      } else {
        setShowStatusUpdate(false);
        setNotes("");
        setApprovedAmount("");
        setApprovedRate("");
        setApprovedTerm("");
        setDenialReason("");
        router.refresh();
      }
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-bold">
          {lenderName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {lenderName}
          </p>
          {productName && (
            <p className="text-xs text-muted-foreground truncate">
              {productName}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            FINANCING_STATUS_COLORS[status] ?? FINANCING_STATUS_COLORS.draft,
          )}
        >
          {FINANCING_STATUS_LABELS[status] ?? status}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
          {lenderName[0]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">{lenderName}</p>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </div>
        <div className="text-right">
          {app.loan_amount != null && (
            <>
              <p className="text-xl font-bold text-foreground">
                ${Number(app.loan_amount).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Loan amount</p>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            FINANCING_STATUS_COLORS[status] ?? FINANCING_STATUS_COLORS.draft,
          )}
        >
          {FINANCING_STATUS_LABELS[status] ?? status}
        </span>
        {app.submitted_at && (
          <span className="text-xs text-muted-foreground">
            Submitted{" "}
            {new Date(app.submitted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {app.decision_at && (
          <span className="text-xs text-muted-foreground">
            · Decision{" "}
            {new Date(app.decision_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
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

      {/* Status Tracker */}
      {!isTerminal && <StatusTracker progressIdx={progressIdx} />}

      {/* Status Update Controls */}
      {!isTerminal && allowedNext.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
            aria-expanded={showStatusUpdate}
            aria-controls={`status-form-${app.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showStatusUpdate && "rotate-180",
              )}
            />
            Update Status
          </button>

          {showStatusUpdate && (
            <div
              id={`status-form-${app.id}`}
              className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-4"
            >
              <div>
                <Label htmlFor={`status-select-${app.id}`}>New Status</Label>
                <select
                  ref={statusSelectRef}
                  id={`status-select-${app.id}`}
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as FinancingStatus)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {allowedNext.map((s) => (
                    <option key={s} value={s}>
                      {FINANCING_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional fields for approved */}
              {(newStatus === "approved" ||
                newStatus === "conditionally_approved") && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor={`approved-amount-${app.id}`}>
                      Approved Amount
                    </Label>
                    <input
                      id={`approved-amount-${app.id}`}
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="$"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`approved-rate-${app.id}`}>Rate (%)</Label>
                    <input
                      id={`approved-rate-${app.id}`}
                      type="number"
                      step="0.01"
                      value={approvedRate}
                      onChange={(e) => setApprovedRate(e.target.value)}
                      placeholder="%"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`approved-term-${app.id}`}>
                      Term (months)
                    </Label>
                    <input
                      id={`approved-term-${app.id}`}
                      type="number"
                      value={approvedTerm}
                      onChange={(e) => setApprovedTerm(e.target.value)}
                      placeholder="months"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Denial reason */}
              {newStatus === "denied" && (
                <div>
                  <Label htmlFor={`denial-reason-${app.id}`}>
                    Denial Reason
                  </Label>
                  <input
                    id={`denial-reason-${app.id}`}
                    type="text"
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                    placeholder="Reason for denial"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <Label htmlFor={`notes-${app.id}`}>Notes (optional)</Label>
                <textarea
                  id={`notes-${app.id}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>

              {updateError && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {updateError}
                </div>
              )}

              <Button
                type="button"
                onClick={handleStatusUpdate}
                disabled={isPending || allowedNext.length === 0}
                aria-busy={isPending}
                className="w-full"
              >
                {isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusTracker({ progressIdx }: { progressIdx: number }) {
  return (
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
  );
}
