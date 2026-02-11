import React from "react"
import { DEALS, STAGE_LABELS, STAGE_COLORS } from "@/lib/mock-data"
import { DealWorkflowLayout } from "@/components/deals/detail/deal-workflow-layout"
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
  ChevronRight,
} from "lucide-react"

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = DEALS.find((d) => d.id === id)

  if (!deal) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Deal not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The deal you are looking for does not exist.
          </p>
          <a
            href="/deals"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/deals"
              className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              aria-label="Back to deals"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <a href="/deals" className="hover:text-foreground transition-colors">Deals</a>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-foreground">{deal.customerName}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                STAGE_COLORS[deal.stage]
              )}
            >
              {STAGE_LABELS[deal.stage]}
            </span>
            <button
              type="button"
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Info Bar */}
      <div className="shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">{deal.customerName}</h1>
            <div className="mt-0.5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {deal.address}, {deal.city}, {deal.state}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {deal.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {deal.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deal.closer.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(deal.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {deal.daysInPipeline}d
            </span>
          </div>
        </div>
      </div>

      {/* Workflow Layout: sidebar stepper + main content */}
      <div className="flex-1 min-h-0">
        <DealWorkflowLayout deal={deal} />
      </div>
    </div>
  )
}
