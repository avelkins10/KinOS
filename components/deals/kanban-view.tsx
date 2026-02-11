"use client"

import { STAGE_LABELS, type Deal, type DealStage } from "@/lib/mock-data"
import { DealCard } from "./deal-card"
import { ScrollArea } from "@/components/ui/scroll-area"

const stageOrder: DealStage[] = [
  "new_lead",
  "appointment_set",
  "appointment_completed",
  "design_in_progress",
  "proposal_sent",
  "financing_applied",
  "financing_approved",
  "contract_signed",
  "submitted",
]

const stageDotColors: Record<DealStage, string> = {
  new_lead: "bg-chart-4",
  appointment_set: "bg-primary",
  appointment_completed: "bg-chart-2",
  design_in_progress: "bg-accent",
  proposal_sent: "bg-chart-1",
  financing_applied: "bg-warning",
  financing_approved: "bg-success",
  contract_signed: "bg-chart-2",
  submitted: "bg-success",
}

export function KanbanView({ deals }: { deals: Deal[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageOrder.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage)
        const totalValue = stageDeals.reduce((s, d) => s + d.dealValue, 0)

        return (
          <div
            key={stage}
            className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-muted/30"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <div className={`h-2 w-2 rounded-full ${stageDotColors[stage]}`} />
              <span className="text-xs font-semibold text-foreground">
                {STAGE_LABELS[stage]}
              </span>
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                {stageDeals.length}
              </span>
            </div>
            {/* Stage Value */}
            {totalValue > 0 && (
              <div className="border-b border-border/50 px-4 py-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  ${(totalValue / 1000).toFixed(0)}k total
                </span>
              </div>
            )}
            {/* Cards */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {stageDeals.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-muted-foreground/50">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
