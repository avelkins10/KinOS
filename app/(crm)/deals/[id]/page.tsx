"use client"

import React from "react"

import { use } from "react"
import Link from "next/link"
import { DEALS, STAGE_LABELS, STAGE_COLORS } from "@/lib/mock-data"
import { WorkflowStepper } from "@/components/deals/detail/workflow-stepper"
import { DealTabs } from "@/components/deals/detail/deal-tabs"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const deal = DEALS.find((d) => d.id === id)

  if (!deal) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Deal not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The deal you are looking for does not exist.
          </p>
          <Link
            href="/deals"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/deals"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Back to deals"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {deal.customerName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {deal.address}, {deal.city}, {deal.state}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                STAGE_COLORS[deal.stage]
              )}
            >
              {STAGE_LABELS[deal.stage]}
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
        {/* Left: Info Header + Tabs */}
        <div className="min-w-0 space-y-6">
          {/* Quick Info Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={deal.phone}
              href={`tel:${deal.phone}`}
            />
            <InfoCard
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={deal.email}
              href={`mailto:${deal.email}`}
            />
            <InfoCard
              icon={<User className="h-4 w-4" />}
              label="Closer"
              value={deal.closer.name}
            />
            <InfoCard
              icon={<Calendar className="h-4 w-4" />}
              label="Created"
              value={new Date(deal.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              detail={
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {deal.daysInPipeline}d in pipeline
                </span>
              }
            />
          </div>

          {/* Tabbed Content */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <DealTabs deal={deal} />
          </div>
        </div>

        {/* Right: Workflow Stepper */}
        <div className="space-y-4">
          <WorkflowStepper stage={deal.stage} />

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <QuickAction label="Create Proposal" shortcut="P" />
              <QuickAction label="Submit Financing" shortcut="F" />
              <QuickAction label="Generate Contract" shortcut="C" />
              <QuickAction label="Open in Aurora" shortcut="A" external />
              <QuickAction label="Advance Stage" shortcut="S" primary />
            </div>
          </div>

          {/* Deal Value */}
          {deal.dealValue > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deal Value
              </h3>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                ${deal.dealValue.toLocaleString()}
              </p>
              {deal.monthlyPayment && (
                <p className="mt-1 text-sm text-muted-foreground">
                  ${deal.monthlyPayment}/mo &middot; {deal.lenderProduct}
                </p>
              )}
              {deal.lender && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-xs font-medium text-foreground">
                    {deal.lender}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  href,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  detail?: React.ReactNode
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
          {value}
        </p>
        {detail}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }
  return content
}

function QuickAction({
  label,
  shortcut,
  primary,
  external,
}: {
  label: string
  shortcut: string
  primary?: boolean
  external?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        primary
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "border border-border bg-transparent text-foreground hover:bg-muted/50"
      )}
    >
      <span className="flex items-center gap-2">
        {label}
        {external && <ExternalLink className="h-3 w-3 opacity-50" />}
      </span>
      <kbd
        className={cn(
          "rounded border px-1.5 py-0.5 font-mono text-[10px]",
          primary
            ? "border-primary-foreground/20 text-primary-foreground/60"
            : "border-border text-muted-foreground"
        )}
      >
        {shortcut}
      </kbd>
    </button>
  )
}
