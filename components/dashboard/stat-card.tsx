"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  accent?: "primary" | "success" | "warning" | "accent"
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  accent = "primary",
}: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const isNeutral = !change || change === 0

  const accentMap = {
    primary: {
      gradient: "linear-gradient(90deg, #0ea5e9, #06b6d4)",
      iconBg: "rgba(14,165,233,0.08)",
      iconColor: "#0ea5e9",
    },
    success: {
      gradient: "linear-gradient(90deg, #22c55e, #10b981)",
      iconBg: "rgba(34,197,94,0.08)",
      iconColor: "#22c55e",
    },
    warning: {
      gradient: "linear-gradient(90deg, #f59e0b, #f97316)",
      iconBg: "rgba(245,158,11,0.08)",
      iconColor: "#f59e0b",
    },
    accent: {
      gradient: "linear-gradient(90deg, #f59e0b, #ef4444)",
      iconBg: "rgba(245,158,11,0.08)",
      iconColor: "#f59e0b",
    },
  }

  const a = accentMap[accent]

  return (
    <div className="card-premium-accent group relative p-5">
      {/* Override the accent line color */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: a.gradient }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="stat-value">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              {isNeutral && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span
                className={cn(
                  "text-xs font-semibold",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  isNeutral && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: a.iconBg, color: a.iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
