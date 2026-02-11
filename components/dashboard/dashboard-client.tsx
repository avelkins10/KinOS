"use client";

import { useState } from "react";
import {
  Handshake,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineSummary } from "@/components/dashboard/pipeline-summary";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { FinancingAlerts } from "@/components/dashboard/financing-alerts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RepLeaderboard } from "@/components/dashboard/leaderboard";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/actions/dashboard";

type View = "closer" | "manager";

interface DashboardClientProps {
  statsAll: DashboardStats | null;
  statsCloser: DashboardStats | null;
}

export function DashboardClient({
  statsAll,
  statsCloser,
}: DashboardClientProps) {
  const [view, setView] = useState<View>("closer");

  const pipelineAll = statsAll?.pipelineByStage ?? [];
  const pipelineCloser = statsCloser?.pipelineByStage ?? pipelineAll;
  const totalDealsAll = pipelineAll.reduce((s, p) => s + p.count, 0) ?? 0;
  const totalValueAll = pipelineAll.reduce((s, p) => s + p.totalValue, 0) ?? 0;
  const totalDealsCloser = pipelineCloser.reduce((s, p) => s + p.count, 0) ?? 0;

  return (
    <div className="animate-fade-in p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-header text-foreground">
            {view === "closer" ? "Good morning, Austin" : "Office Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "closer"
              ? "Here's what's happening with your deals today."
              : "All offices performance and pipeline status."}
          </p>
        </div>
        <div
          className="flex items-center rounded-xl p-1"
          style={{
            backgroundColor: "hsl(216 18% 94%)",
            border: "1px solid hsl(216 16% 90%)",
          }}
        >
          <button
            type="button"
            onClick={() => setView("closer")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              view === "closer"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Target className="h-3.5 w-3.5" />
            My Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView("manager")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              view === "manager"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Manager View
          </button>
        </div>
      </div>

      {view === "closer" ? (
        <>
          <div className="stagger-children mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Deals This Month"
              value={String(statsCloser?.dealsThisMonth ?? 0)}
              change={14}
              changeLabel="vs last month"
              icon={<Handshake className="h-5 w-5" />}
              accent="primary"
            />
            <StatCard
              label="Close Rate"
              value={`${statsCloser?.closeRate ?? 0}%`}
              change={3}
              changeLabel="vs last month"
              icon={<Target className="h-5 w-5" />}
              accent="success"
            />
            <StatCard
              label="Avg Deal Size"
              value={`$${((statsCloser?.avgDealSize ?? 0) / 1000).toFixed(1)}k`}
              change={-2}
              changeLabel="vs last month"
              icon={<DollarSign className="h-5 w-5" />}
              accent="warning"
            />
            <StatCard
              label="Monthly Revenue"
              value={`$${((statsCloser?.monthlyRevenue ?? 0) / 1000).toFixed(0)}k`}
              change={18}
              changeLabel="vs last month"
              icon={<TrendingUp className="h-5 w-5" />}
              accent="accent"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <AppointmentsList />
              <PipelineSummary
                pipelineByStage={pipelineCloser}
                totalDeals={totalDealsCloser}
              />
            </div>
            <div className="space-y-6">
              <FinancingAlerts />
              <ActivityFeed limit={5} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stagger-children mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Active Deals"
              value={String(totalDealsAll)}
              change={8}
              changeLabel="vs last month"
              icon={<Handshake className="h-5 w-5" />}
              accent="primary"
            />
            <StatCard
              label="Office Close Rate"
              value={`${statsAll?.closeRate ?? 0}%`}
              change={5}
              changeLabel="vs last month"
              icon={<Target className="h-5 w-5" />}
              accent="success"
            />
            <StatCard
              label="Total Pipeline Value"
              value={`$${(totalValueAll / 1000).toFixed(0)}k`}
              change={22}
              changeLabel="vs last month"
              icon={<DollarSign className="h-5 w-5" />}
              accent="warning"
            />
            <StatCard
              label="Active Reps"
              value="4"
              change={0}
              changeLabel="no change"
              icon={<Users className="h-5 w-5" />}
              accent="accent"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PipelineChart
                pipelineByStage={pipelineAll}
                totalDeals={totalDealsAll}
                totalValue={totalValueAll}
              />
              <RepLeaderboard />
            </div>
            <div className="space-y-6">
              <PipelineSummary
                pipelineByStage={pipelineAll}
                totalDeals={totalDealsAll}
              />
              <ActivityFeed limit={8} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
