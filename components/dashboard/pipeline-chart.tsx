"use client";

import { STAGE_ORDER, STAGE_LABELS } from "@/lib/constants/pipeline";
import type { DealStage } from "@/lib/constants/pipeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface PipelineStageDatum {
  stage: string;
  count: number;
  totalValue: number;
}

const barColors = [
  "hsl(262, 52%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(173, 58%, 39%)",
  "hsl(35, 95%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(173, 58%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(152, 60%, 42%)",
  "hsl(152, 60%, 42%)",
  "hsl(199, 89%, 48%)",
  "hsl(173, 58%, 39%)",
  "hsl(173, 58%, 39%)",
  "hsl(152, 60%, 42%)",
  "hsl(152, 60%, 42%)",
  "hsl(152, 60%, 42%)",
  "hsl(0, 84%, 60%)",
  "hsl(215, 14%, 60%)",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; count: number; value: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-card-foreground">{data.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.count} deals · ${(data.value / 1000).toFixed(0)}k
      </p>
    </div>
  );
}

interface PipelineChartProps {
  pipelineByStage: PipelineStageDatum[];
  totalDeals: number;
  totalValue: number;
}

export function PipelineChart({
  pipelineByStage,
  totalDeals,
  totalValue,
}: PipelineChartProps) {
  const byStage = new Map(
    pipelineByStage.map((p) => [
      p.stage,
      { count: p.count, totalValue: p.totalValue },
    ]),
  );
  const data = STAGE_ORDER.map((stage: DealStage) => {
    const row = byStage.get(stage) ?? { count: 0, totalValue: 0 };
    const label = STAGE_LABELS[stage];
    return {
      stage,
      name: label.replace("Appointment ", "Appt "),
      shortName: label
        .split(" ")
        .map((w) => w[0])
        .join(""),
      count: row.count,
      value: row.totalValue,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">
          Pipeline Overview
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{totalDeals} total deals</span>
          <span>·</span>
          <span>${(totalValue / 1000).toFixed(0)}k value</span>
        </div>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 10, fill: "hsl(215, 14%, 46%)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(215, 14%, 46%)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(210, 16%, 95%, 0.5)" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${data[idx].stage}`}
                  fill={barColors[idx % barColors.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
