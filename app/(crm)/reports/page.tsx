"use client";

import { DEALS, REPS } from "@/lib/mock-data";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { month: "Sep", deals: 18, revenue: 540000 },
  { month: "Oct", deals: 22, revenue: 682000 },
  { month: "Nov", deals: 19, revenue: 608000 },
  { month: "Dec", deals: 25, revenue: 798000 },
  { month: "Jan", deals: 28, revenue: 892000 },
  { month: "Feb", deals: 12, revenue: 384000 },
];

const stageDistribution = [
  {
    name: "New Lead",
    value: DEALS.filter((d) => d.stage === "new_lead").length,
    color: "hsl(var(--chart-4))",
  },
  {
    name: "Appt Set",
    value: DEALS.filter((d) => d.stage === "appointment_set").length,
    color: "hsl(var(--primary))",
  },
  {
    name: "Appt Done",
    value: DEALS.filter((d) => d.stage === "appointment_sat").length,
    color: "hsl(var(--chart-2))",
  },
  {
    name: "Design",
    value: DEALS.filter((d) =>
      ["design_requested", "design_complete"].includes(d.stage),
    ).length,
    color: "hsl(var(--accent))",
  },
  {
    name: "Proposal",
    value: DEALS.filter((d) => d.stage === "proposal_sent").length,
    color: "hsl(var(--chart-1))",
  },
  {
    name: "Financing",
    value: DEALS.filter((d) =>
      ["financing_applied", "financing_approved"].includes(d.stage),
    ).length,
    color: "hsl(var(--warning))",
  },
  {
    name: "Contract",
    value: DEALS.filter((d) => d.stage === "contract_signed").length,
    color: "hsl(var(--success))",
  },
  {
    name: "Submitted",
    value: DEALS.filter((d) => d.stage === "submitted").length,
    color: "hsl(var(--chart-2))",
  },
];

export default function ReportsPage() {
  const totalRevenue = DEALS.reduce((sum, d) => sum + d.dealValue, 0);
  const avgDealSize =
    totalRevenue / DEALS.filter((d) => d.dealValue > 0).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance metrics and pipeline analytics.
        </p>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {DEALS.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Deals</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${(totalRevenue / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-muted-foreground">Total Pipeline</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/15">
              <TrendingUp className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${(avgDealSize / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">Avg Deal Size</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/15">
              <Target className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {(
                  REPS.filter((r) => r.role === "closer").reduce(
                    (s, r) => s + r.closeRate,
                    0,
                  ) / REPS.filter((r) => r.role === "closer").length
                ).toFixed(0)}
                %
              </p>
              <p className="text-xs text-muted-foreground">Avg Close Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Monthly Deals Closed
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar
                  dataKey="deals"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Stage Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageDistribution.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stageDistribution
                    .filter((d) => d.value > 0)
                    .map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {stageDistribution
              .filter((d) => d.value > 0)
              .map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {entry.value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
