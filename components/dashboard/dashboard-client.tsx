"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Handshake,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineSummary } from "@/components/dashboard/pipeline-summary";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { FinancingAlerts } from "@/components/dashboard/financing-alerts";
import { ContractAlerts } from "@/components/dashboard/contract-alerts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RepLeaderboard } from "@/components/dashboard/leaderboard";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { cn } from "@/lib/utils";
import type { DashboardStats, ContractAlert } from "@/lib/actions/dashboard";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

type View = "closer" | "manager";

interface DashboardClientProps {
  statsAll: DashboardStats | null;
  statsCloser: DashboardStats | null;
  todaysAppointments?: AppointmentWithRelations[];
  appointmentOutcomes?: {
    completed: number;
    no_show: number;
    rescheduled: number;
    cancelled: number;
  } | null;
  contractAlerts?: ContractAlert[];
}

export function DashboardClient({
  statsAll,
  statsCloser,
  todaysAppointments = [],
  appointmentOutcomes = null,
  contractAlerts = [],
}: DashboardClientProps) {
  const [view, setView] = useState<View>("closer");

  const pipelineAll = statsAll?.pipelineByStage ?? [];
  const pipelineCloser = statsCloser?.pipelineByStage ?? pipelineAll;
  const totalDealsAll = pipelineAll.reduce((s, p) => s + p.count, 0) ?? 0;
  const totalValueAll = pipelineAll.reduce((s, p) => s + p.totalValue, 0) ?? 0;
  const totalDealsCloser = pipelineCloser.reduce((s, p) => s + p.count, 0) ?? 0;

  const now = new Date();
  const sortedToday = [...todaysAppointments].sort(
    (a, b) =>
      new Date(a.scheduled_start).getTime() -
      new Date(b.scheduled_start).getTime(),
  );
  const nextAppointment =
    sortedToday.find((a) => new Date(a.scheduled_start) >= now) ??
    sortedToday[0];

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
              label="Today's Appointments"
              value={String(todaysAppointments.length)}
              change={0}
              changeLabel=""
              icon={<Target className="h-5 w-5" />}
              accent="accent"
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
              {nextAppointment && (
                <div className="card-premium flex items-center gap-4 rounded-xl border p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Next appointment
                    </p>
                    <p className="mt-0.5 font-semibold text-card-foreground">
                      {new Date(
                        nextAppointment.scheduled_start,
                      ).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      —{" "}
                      {nextAppointment.contact
                        ? `${nextAppointment.contact.first_name ?? ""} ${nextAppointment.contact.last_name ?? ""}`.trim() ||
                          "—"
                        : "—"}
                    </p>
                    {nextAppointment.location && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {nextAppointment.location}
                      </p>
                    )}
                  </div>
                  {nextAppointment.deal?.id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/deals/${nextAppointment.deal!.id}`}>
                        View deal
                      </Link>
                    </Button>
                  )}
                </div>
              )}
              <AppointmentsList appointments={todaysAppointments} />
              <PipelineSummary
                pipelineByStage={pipelineCloser}
                totalDeals={totalDealsCloser}
              />
            </div>
            <div className="space-y-6">
              <FinancingAlerts
                alerts={
                  view === "closer"
                    ? (statsCloser?.financingAlerts ??
                      statsAll?.financingAlerts)
                    : statsAll?.financingAlerts
                }
              />
              <ContractAlerts alerts={contractAlerts} />
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
              label="Today's Appointments"
              value={String(todaysAppointments.length)}
              change={0}
              changeLabel=""
              icon={<Target className="h-5 w-5" />}
              accent="accent"
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
              {appointmentOutcomes && (
                <div className="card-premium rounded-xl border p-4">
                  <h3 className="section-title mb-3">
                    Appointment outcomes (7 days)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                      <span className="font-semibold">
                        {appointmentOutcomes.completed}
                      </span>{" "}
                      completed
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 text-red-800">
                      <span className="font-semibold">
                        {appointmentOutcomes.no_show}
                      </span>{" "}
                      no-show
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                      <span className="font-semibold">
                        {appointmentOutcomes.rescheduled}
                      </span>{" "}
                      rescheduled
                    </div>
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <span className="font-semibold">
                        {appointmentOutcomes.cancelled}
                      </span>{" "}
                      cancelled
                    </div>
                  </div>
                </div>
              )}
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
