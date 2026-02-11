"use client"

import Link from "next/link"
import { FINANCING_ALERTS } from "@/lib/mock-data"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const urgencyConfig = {
  high: { icon: AlertTriangle, color: "text-destructive bg-destructive/10 border-destructive/20", dot: "bg-destructive" },
  medium: { icon: Clock, color: "text-warning bg-warning/10 border-warning/20", dot: "bg-warning" },
  low: { icon: CheckCircle, color: "text-success bg-success/10 border-success/20", dot: "bg-success" },
}

export function FinancingAlerts() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Financing Alerts</h3>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">
          {FINANCING_ALERTS.filter((a) => a.urgency === "high").length}
        </span>
      </div>
      <div className="space-y-2">
        {FINANCING_ALERTS.map((alert) => {
          const config = urgencyConfig[alert.urgency]
          const Icon = config.icon
          return (
            <Link
              key={alert.id}
              href={`/deals/${alert.dealId}`}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 transition-all duration-150 hover:shadow-sm",
                config.color
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{alert.customerName}</p>
                <p className="mt-0.5 text-xs opacity-70">
                  {alert.lender} {"·"} {alert.status}
                </p>
              </div>
              <span className="shrink-0 text-xs opacity-60">{alert.detail}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
