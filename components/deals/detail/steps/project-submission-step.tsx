"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { transitionDealStage } from "@/lib/actions/deals";
import { submitDeal, getSubmissionHistory } from "@/lib/actions/submission";
import { cn } from "@/lib/utils";
import {
  Check,
  Rocket,
  Zap,
  CreditCard,
  FileText,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Clock,
  RotateCcw,
} from "lucide-react";

interface ReviewItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  ok: boolean;
}

function getReviewItems(
  deal: DealForUI,
  dealDetail?: DealDetail | null,
): ReviewItem[] {
  const hasDesign = !!deal.systemSize;
  const hasLender = !!deal.lender || (dealDetail?.financingApplications?.length ?? 0) > 0;

  const financingApp = dealDetail?.financingApplications?.[0];
  const financingLabel = financingApp?.lender?.name
    ? `${financingApp.lender.name} - ${financingApp.lender_product?.name ?? ""}`
    : deal.lender
      ? `${deal.lender} - ${deal.lenderProduct ?? ""}`
      : "Not submitted";

  const envelopes = dealDetail?.documentEnvelopes ?? [];
  const signedCount = envelopes.filter((e) => e.status === "signed").length;
  const contractsOk =
    envelopes.length > 0 && envelopes.every((e) => e.status === "signed");

  const gatesComplete = [
    "submission_ready",
    "submitted",
    "intake_approved",
    "intake_rejected",
  ].includes(deal.stage);

  return [
    {
      label: "System Design",
      value: hasDesign
        ? `${deal.systemSize} kW, ${deal.panelCount ?? 0} panels, ${deal.inverterBrand ?? "N/A"}`
        : "Not complete",
      icon: Zap,
      ok: hasDesign,
    },
    {
      label: "Proposal",
      value:
        deal.dealValue > 0
          ? `$${deal.dealValue.toLocaleString()} net`
          : "Not created",
      icon: FileText,
      ok: deal.dealValue > 0,
    },
    {
      label: "Financing",
      value: financingLabel,
      icon: CreditCard,
      ok: hasLender,
    },
    {
      label: "Contracts",
      value:
        envelopes.length > 0
          ? `${signedCount}/${envelopes.length} signed`
          : "No contracts",
      icon: FileText,
      ok: contractsOk,
    },
    {
      label: "Pre-Intake Gates",
      value: gatesComplete ? "All gates passed" : "Incomplete",
      icon: ClipboardCheck,
      ok: gatesComplete,
    },
  ];
}

// ── Submitted State ──────────────────────────────────────────────

function SubmittedView({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  const [history, setHistory] = useState<
    Array<{
      id: string;
      submissionAttempt: number;
      createdAt: string;
      createdBy: string | null;
    }>
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getSubmissionHistory(deal.id).then(({ data }) => setHistory(data));
  }, [deal.id]);

  const latestAttempt = history[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">
          Project Submission
        </h3>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h3 className="text-xl font-bold text-foreground">
          Successfully Submitted
        </h3>
        {latestAttempt && (
          <p className="mt-2 text-sm text-muted-foreground">
            Attempt #{latestAttempt.submissionAttempt}
            {" · "}
            {new Date(latestAttempt.createdAt).toLocaleString()}
          </p>
        )}
        <div className="mt-4 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success">
          All gates passed. Deal successfully submitted.
        </div>
      </div>

      {/* Submission History */}
      {history.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} submission history (
            {history.length} attempts)
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2"
                >
                  <span className="text-sm font-medium">
                    Attempt #{h.submissionAttempt}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rejected State ───────────────────────────────────────────────

function RejectedView({
  deal,
  dealDetail,
  onDealUpdated,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
  onDealUpdated?: () => void;
}) {
  const router = useRouter();
  const [resubmitting, setResubmitting] = useState(false);

  const rejectionReasons = (
    (deal as unknown as { rejection_reasons?: unknown }).rejection_reasons ??
    (dealDetail as unknown as { rejection_reasons?: unknown })
      ?.rejection_reasons ??
    []
  ) as Array<{ code: string; field?: string; note?: string }>;

  const handleResubmit = async () => {
    setResubmitting(true);
    // Transition intake_rejected → submission_ready
    const { error } = await transitionDealStage(deal.id, "submission_ready");
    if (!error) {
      onDealUpdated?.();
      router.refresh();
    }
    setResubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">
          Project Submission
        </h3>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h4 className="font-bold text-destructive">Submission Rejected</h4>
            <p className="text-sm text-muted-foreground">
              {rejectionReasons.length} issue(s) to resolve before resubmission.
            </p>
          </div>
        </div>

        {rejectionReasons.length > 0 && (
          <div className="space-y-2">
            {rejectionReasons.map((reason, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-background p-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-bold text-destructive">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {reason.code}
                  </p>
                  {reason.field && (
                    <p className="text-xs text-muted-foreground">
                      Field: {reason.field}
                    </p>
                  )}
                  {reason.note && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reason.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={resubmitting}
            onClick={handleResubmit}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {resubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Fix & Resubmit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function ProjectSubmissionStep({
  deal,
  dealDetail,
  onDealUpdated,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
  onDealUpdated?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Already submitted
  if (["submitted", "intake_approved"].includes(deal.stage)) {
    return <SubmittedView deal={deal} dealDetail={dealDetail} />;
  }

  // Rejected
  if (deal.stage === "intake_rejected") {
    return (
      <RejectedView
        deal={deal}
        dealDetail={dealDetail}
        onDealUpdated={onDealUpdated}
      />
    );
  }

  const items = getReviewItems(deal, dealDetail);
  const allOk = items.every((i) => i.ok);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await submitDeal(deal.id);
    if (error) {
      setSubmitError(error);
    } else {
      onDealUpdated?.();
      router.refresh();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">
          Project Submission
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review everything before submitting.
        </p>
      </div>

      {/* Review Summary */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4",
                item.ok
                  ? "border-success/20 bg-success/5"
                  : "border-destructive/20 bg-destructive/5",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  item.ok ? "bg-success/15" : "bg-destructive/15",
                )}
              >
                {item.ok ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Icon className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.value}
                </p>
              </div>
              {item.ok ? (
                <span className="text-xs font-bold text-success">Ready</span>
              ) : (
                <span className="text-xs font-bold text-destructive">
                  Required
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Deal Value Summary */}
      {deal.dealValue > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Deal Value
            </span>
            <span className="text-2xl font-bold text-foreground">
              ${deal.dealValue.toLocaleString()}
            </span>
          </div>
          {deal.monthlyPayment && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Monthly Payment
              </span>
              <span className="text-lg font-semibold text-primary">
                ${deal.monthlyPayment}/mo
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {submitError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          disabled={!allOk || submitting}
          onClick={handleSubmit}
          className={cn(
            "flex items-center gap-3 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all",
            allOk && !submitting
              ? "bg-success text-success-foreground hover:bg-success/90 hover:shadow-xl hover:shadow-success/20 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          {submitting ? "Submitting..." : "Submit Deal"}
        </button>
      </div>
      {!allOk && (
        <p className="text-center text-xs text-muted-foreground">
          Complete all required items above to enable submission.
        </p>
      )}
    </div>
  );
}
