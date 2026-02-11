"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
}

export function StatCard({ label, value, change, changeLabel, icon }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const isNeutral = !change || change === 0

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              {isNeutral && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span
                className={cn(
                  "text-xs font-medium",
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </div>
      </div>
    </div>
  )
}
