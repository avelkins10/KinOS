"use client"

import { useState } from "react"
import { Handshake, Target, DollarSign, TrendingUp, Users, Building2 } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { PipelineSummary } from "@/components/dashboard/pipeline-summary"
import { AppointmentsList } from "@/components/dashboard/appointments-list"
import { FinancingAlerts } from "@/components/dashboard/financing-alerts"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { RepLeaderboard } from "@/components/dashboard/leaderboard"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { cn } from "@/lib/utils"

type View = "closer" | "manager"

export default function DashboardPage() {
  const [view, setView] = useState<View>("closer")

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {view === "closer" ? "Good morning, Austin" : "Office Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "closer"
              ? "Here's what's happening with your deals today."
              : "All offices performance and pipeline status."}
          </p>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setView("closer")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              view === "closer"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="h-3.5 w-3.5" />
            My Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView("manager")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              view === "manager"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Manager View
          </button>
        </div>
      </div>

      {view === "closer" ? (
        <>
          {/* Stats Row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Deals This Month"
              value="8"
              change={14}
              changeLabel="vs last month"
              icon={<Handshake className="h-5 w-5" />}
            />
            <StatCard
              label="Close Rate"
              value="42%"
              change={3}
              changeLabel="vs last month"
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Deal Size"
              value="$35.9k"
              change={-2}
              changeLabel="vs last month"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label="Monthly Revenue"
              value="$287.4k"
              change={18}
              changeLabel="vs last month"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <AppointmentsList />
              <PipelineSummary closerId="r1" />
            </div>
            <div className="space-y-6">
              <FinancingAlerts />
              <ActivityFeed limit={5} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Manager Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Active Deals"
              value="15"
              change={8}
              changeLabel="vs last month"
              icon={<Handshake className="h-5 w-5" />}
            />
            <StatCard
              label="Office Close Rate"
              value="41%"
              change={5}
              changeLabel="vs last month"
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Total Pipeline Value"
              value="$527.5k"
              change={22}
              changeLabel="vs last month"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label="Active Reps"
              value="4"
              change={0}
              changeLabel="no change"
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          {/* Manager Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PipelineChart />
              <RepLeaderboard />
            </div>
            <div className="space-y-6">
              <PipelineSummary />
              <ActivityFeed limit={8} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
