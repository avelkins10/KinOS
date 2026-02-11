"use client"

import { DEALS, STAGE_LABELS, type DealStage } from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

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
]

const barColors = [
  "hsl(262, 52%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(173, 58%, 39%)",
  "hsl(35, 95%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 52%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(152, 60%, 42%)",
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; count: number; value: number } }> }) {
  if (!active || !payload?.[0]) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-card-foreground">{data.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.count} deals {"·"} ${(data.value / 1000).toFixed(0)}k
      </p>
    </div>
  )
}

export function PipelineChart() {
  const data = stageOrder.map((stage) => {
    const deals = DEALS.filter((d) => d.stage === stage)
    return {
      name: STAGE_LABELS[stage].replace("Appointment ", "Appt "),
      shortName: STAGE_LABELS[stage].split(" ").map(w => w[0]).join(""),
      count: deals.length,
      value: deals.reduce((sum, d) => sum + d.dealValue, 0),
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Pipeline Overview</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{DEALS.length} total deals</span>
          <span>{"·"}</span>
          <span>${(DEALS.reduce((s, d) => s + d.dealValue, 0) / 1000).toFixed(0)}k value</span>
        </div>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(210, 16%, 95%, 0.5)" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((_, idx) => (
                <Cell key={`cell-${stageOrder[idx]}`} fill={barColors[idx]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
