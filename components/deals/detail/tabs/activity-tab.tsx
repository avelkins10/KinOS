"use client";

import { useState } from "react";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { RECENT_ACTIVITY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  MessageSquare,
  FileText,
  FileCheck,
  Landmark,
  Cpu,
  Send,
} from "lucide-react";

const typeIcons = {
  stage_change: ArrowRightLeft,
  note: MessageSquare,
  document: FileText,
  proposal: FileCheck,
  financing: Landmark,
  system: Cpu,
};

const typeColors = {
  stage_change: "text-primary bg-primary/10",
  note: "text-accent bg-accent/10",
  document: "text-chart-4 bg-chart-4/10",
  proposal: "text-chart-2 bg-chart-2/10",
  financing: "text-warning bg-warning/10",
  system: "text-muted-foreground bg-muted",
};

export function ActivityTab({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
}) {
  const [note, setNote] = useState("");
  const hasRealData =
    (dealDetail?.stageHistory?.length ?? 0) > 0 ||
    (dealDetail?.notes?.length ?? 0) > 0;
  const stageItems =
    (dealDetail?.stageHistory ?? []).map((h) => ({
      id: h.id,
      type: "stage_change" as const,
      description: `Stage: ${h.to_stage}`,
      detail: h.from_stage ? `From ${h.from_stage}` : undefined,
      timestamp: h.created_at
        ? new Date(h.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "",
      user: "System",
    })) ?? [];
  const noteItems =
    (dealDetail?.notes ?? []).map((n) => ({
      id: n.id,
      type: "note" as const,
      description: n.content.slice(0, 80) + (n.content.length > 80 ? "…" : ""),
      detail: undefined,
      timestamp: n.created_at
        ? new Date(n.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "",
      user: "User",
    })) ?? [];
  const realItems = [...stageItems, ...noteItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const mockItems = RECENT_ACTIVITY.filter((a) => a.dealId === deal.id);
  const allItems = hasRealData
    ? realItems
    : mockItems.length < 3
      ? [
          ...mockItems,
          ...RECENT_ACTIVITY.filter((a) => a.dealId !== deal.id).slice(0, 5),
        ]
      : mockItems;

  return (
    <div>
      {/* Add Note */}
      <div className="mb-6 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          AE
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <button
            type="button"
            disabled={!note.trim()}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              note.trim()
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground/30",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {allItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No activity yet. Stage changes and notes will appear here.
          </div>
        ) : (
          allItems.map((item) => {
            const Icon = typeIcons[item.type];
            const color = typeColors[item.type];
            return (
              <div
                key={item.id}
                className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-1 flex-1 w-px bg-border group-last:hidden" />
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground">
                        {item.description}
                      </p>
                      {item.detail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    {item.user}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
