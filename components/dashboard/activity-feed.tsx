"use client";

import { RECENT_ACTIVITY, type ActivityItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  MessageSquare,
  FileText,
  FileCheck,
  FilePlus,
  FileCheck2,
  FileX,
  Landmark,
  Cpu,
} from "lucide-react";

const typeConfig: Record<
  ActivityItem["type"],
  { icon: typeof ArrowRightLeft; color: string }
> = {
  stage_change: { icon: ArrowRightLeft, color: "text-primary bg-primary/10" },
  note: { icon: MessageSquare, color: "text-accent bg-accent/10" },
  document: { icon: FileText, color: "text-chart-4 bg-chart-4/10" },
  proposal_sent: { icon: FileCheck, color: "text-chart-2 bg-chart-2/10" },
  proposal_created: {
    icon: FilePlus,
    color: "text-emerald-600 bg-emerald-600/10",
  },
  proposal_finalized: {
    icon: FileCheck2,
    color: "text-blue-600 bg-blue-600/10",
  },
  proposal_unfinalized: {
    icon: FileX,
    color: "text-yellow-600 bg-yellow-600/10",
  },
  financing_applied: { icon: Landmark, color: "text-warning bg-warning/10" },
  system: { icon: Cpu, color: "text-muted-foreground bg-muted" },
};

const defaultConfig = {
  icon: FileText,
  color: "text-muted-foreground bg-muted",
};

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const items = RECENT_ACTIVITY.slice(0, limit);

  return (
    <div className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="section-title">Recent Activity</h3>
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all
        </button>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const config =
            typeConfig[item.type as ActivityItem["type"]] ?? defaultConfig;
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/30"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  config.color,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-card-foreground">
                  {item.description}
                </p>
                {item.detail && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground/60">
                    {item.user}
                  </span>
                  <span className="text-[11px] text-muted-foreground/30">
                    {"·"}
                  </span>
                  <span className="text-[11px] text-muted-foreground/50">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
