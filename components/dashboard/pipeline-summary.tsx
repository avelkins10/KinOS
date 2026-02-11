"use client";

import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/lib/constants/pipeline";
import type { DealStage } from "@/lib/constants/pipeline";
import { cn } from "@/lib/utils";

export interface PipelineStageDatum {
  stage: string;
  count: number;
  totalValue: number;
}

interface PipelineSummaryProps {
  pipelineByStage: PipelineStageDatum[];
  totalDeals?: number;
}

export function PipelineSummary({
  pipelineByStage,
  totalDeals: totalDealsProp,
}: PipelineSummaryProps) {
  const byStage = new Map(
    pipelineByStage.map((p) => [
      p.stage,
      { count: p.count, totalValue: p.totalValue },
    ]),
  );
  const stageCounts = STAGE_ORDER.map((stage: DealStage) => {
    const row = byStage.get(stage) ?? { count: 0, totalValue: 0 };
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: row.count,
      value: row.totalValue,
    };
  });
  const totalDeals =
    totalDealsProp ?? stageCounts.reduce((s, r) => s + r.count, 0);
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
                    STAGE_COLORS[stage],
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
