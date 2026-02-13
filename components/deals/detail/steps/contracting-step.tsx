"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { STAGE_INDEX } from "@/lib/constants/pipeline";
import { cn } from "@/lib/utils";
import {
  FileText,
  Send,
  Check,
  ChevronDown,
  Loader2,
  PartyPopper,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type DocumentEnvelopeRow =
  Database["public"]["Tables"]["document_envelopes"]["Row"];

type EnvelopeUIStatus = "created" | "sent" | "viewed" | "signed";

const statusConfig: Record<
  EnvelopeUIStatus,
  { dot: string; label: string; textClass: string }
> = {
  created: {
    dot: "bg-muted-foreground/30",
    label: "Created",
    textClass: "text-muted-foreground",
  },
  sent: { dot: "bg-primary", label: "Sent", textClass: "text-primary" },
  viewed: { dot: "bg-warning", label: "Viewed", textClass: "text-warning" },
  signed: { dot: "bg-success", label: "Signed", textClass: "text-success" },
};

const STATUS_OPTIONS: EnvelopeUIStatus[] = ["created", "sent", "viewed", "signed"];

function mapStatus(dbStatus: string): EnvelopeUIStatus {
  if (dbStatus === "signed") return "signed";
  if (dbStatus === "viewed") return "viewed";
  if (dbStatus === "sent" || dbStatus === "partially_signed") return "sent";
  return "created";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContractingStep({
  deal,
  dealDetail,
  onDealUpdated,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
  onDealUpdated?: () => void;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const stageIdx = STAGE_INDEX[deal.stage] ?? 0;
  const stipsCleared = STAGE_INDEX["stips_cleared"];
  const isPreContract = stageIdx < stipsCleared;

  const envelopes: DocumentEnvelopeRow[] =
    dealDetail?.documentEnvelopes?.filter((d) => d.id && !d.deleted_at) ?? [];

  const signedCount = envelopes.filter((d) => d.status === "signed").length;
  const allSigned = envelopes.length > 0 && signedCount === envelopes.length;

  const handleSendPacket = useCallback(async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_packet" }),
      });
      if (res.ok) {
        onDealUpdated?.();
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }, [deal.id, onDealUpdated, router]);

  const handleStatusUpdate = useCallback(
    async (envelopeId: string, newStatus: string) => {
      setUpdatingId(envelopeId);
      try {
        const res = await fetch(`/api/deals/${deal.id}/documents`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envelopeId, status: newStatus }),
        });
        if (res.ok) {
          onDealUpdated?.();
          router.refresh();
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [deal.id, onDealUpdated, router],
  );

  // Empty state: before financing cleared
  if (isPreContract && envelopes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Contracting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and send contracts for signature.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No contracts yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Complete financing approval before generating contracts.
          </p>
        </div>
      </div>
    );
  }

  // Ready state: can send but no envelopes yet
  if (envelopes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Contracting</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Financing cleared. Ready to send contracts.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendPacket}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? "Sending..." : "Send Contract Packet"}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Ready to send
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Click &quot;Send Contract Packet&quot; to create and send all
            required documents for this deal.
          </p>
        </div>
      </div>
    );
  }

  // All signed celebration
  if (allSigned) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Contracting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All documents signed.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-success/30 bg-success/5 py-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
            <PartyPopper className="h-7 w-7 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-success">
            All contracts signed!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {envelopes.length} of {envelopes.length} documents completed.
          </p>
        </div>

        {/* Document list */}
        <div className="space-y-2">
          {envelopes.map((env) => (
            <EnvelopeRow
              key={env.id}
              envelope={env}
              customerName={deal.customerName}
              updatingId={updatingId}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      </div>
    );
  }

  // Active state: documents in flight
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Contracting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {signedCount} of {envelopes.length} documents signed.
          </p>
        </div>
        {!allSigned && envelopes.every((e) => e.status !== "created") && (
          <button
            type="button"
            onClick={handleSendPacket}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? "Sending..." : "Send More"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allSigned ? "bg-success" : "bg-primary",
            )}
            style={{
              width: `${(signedCount / envelopes.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {Math.round((signedCount / envelopes.length) * 100)}%
        </span>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {envelopes.map((env) => (
          <EnvelopeRow
            key={env.id}
            envelope={env}
            customerName={deal.customerName}
            updatingId={updatingId}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function EnvelopeRow({
  envelope,
  customerName,
  updatingId,
  onStatusUpdate,
}: {
  envelope: DocumentEnvelopeRow;
  customerName: string;
  updatingId: string | null;
  onStatusUpdate: (envelopeId: string, newStatus: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const uiStatus = mapStatus(envelope.status);
  const cfg = statusConfig[uiStatus];
  const isUpdating = updatingId === envelope.id;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          uiStatus === "signed" ? "bg-success/10" : "bg-muted",
        )}
      >
        {uiStatus === "signed" ? (
          <Check className="h-5 w-5 text-success" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{envelope.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          To: {customerName}
          {envelope.sent_at && ` · Sent ${formatDate(envelope.sent_at)}`}
          {envelope.signed_at && ` · Signed ${formatDate(envelope.signed_at)}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
          <span className={cn("text-xs font-semibold", cfg.textClass)}>
            {cfg.label}
          </span>
        </div>
        {/* Status update dropdown */}
        {uiStatus !== "signed" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isUpdating}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  Update
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-32 rounded-lg border border-border bg-popover py-1 shadow-lg">
                  {STATUS_OPTIONS.filter(
                    (s) =>
                      STATUS_OPTIONS.indexOf(s) >
                      STATUS_OPTIONS.indexOf(uiStatus),
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onStatusUpdate(envelope.id, s);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          statusConfig[s].dot,
                        )}
                      />
                      Mark as {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
