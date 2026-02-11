"use client";

import { DEALS, STAGE_LABELS, type DealStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const stageOrder: DealStage[] = [
  "new_lead",
  "design_requested",
  "design_complete",
  "proposal",
  "financing",
  "contracting",
  "pre_intake",
  "submitted",
  "intake_approved",
];

const stageColors: Record<DealStage, string> = {
  new_lead: "bg-chart-4",
  design_requested: "bg-primary",
  design_complete: "bg-chart-2",
  proposal: "bg-chart-1",
  financing: "bg-warning",
  contracting: "bg-chart-2",
  pre_intake: "bg-accent",
  submitted: "bg-success",
  intake_approved: "bg-success",
};

export function PipelineSummary({ closerId }: { closerId?: string }) {
  const deals = closerId
    ? DEALS.filter((d) => d.closer.id === closerId)
    : DEALS;

  const stageCounts = stageOrder.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: deals.filter((d) => d.stage === stage).length,
    value: deals
      .filter((d) => d.stage === stage)
      .reduce((sum, d) => sum + d.dealValue, 0),
  }));

  const totalDeals = deals.length;
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="section-title">Pipeline Summary</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {totalDeals} active
        </span>
      </div>
      <div className="space-y-3">
        {stageCounts.map(({ stage, label, count, value }) => (
          <div key={stage} className="group flex items-center gap-3">
            <div className="w-[110px] shrink-0 truncate text-xs font-medium text-muted-foreground">
              {label}
            </div>
            <div className="relative flex-1">
              <div className="h-7 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className={cn(
                    "flex h-full items-center rounded-lg transition-all duration-700 ease-out",
                    stageColors[stage],
                  )}
                  style={{
                    width: `${Math.max((count / maxCount) * 100, count > 0 ? 10 : 0)}%`,
                    opacity: 0.85,
                  }}
                >
                  {count > 0 && (
                    <span className="px-2.5 text-[11px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-16 shrink-0 text-right text-xs font-semibold text-muted-foreground">
              {value > 0 ? `$${(value / 1000).toFixed(0)}k` : "--"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
