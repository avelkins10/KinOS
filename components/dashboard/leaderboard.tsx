"use client"

import { REPS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function RepLeaderboard() {
  const closers = REPS
    .filter((r) => r.role === "closer")
    .sort((a, b) => b.revenue - a.revenue)

  const medals = ["text-accent", "text-muted-foreground", "text-accent/60"]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">Rep Leaderboard</h3>
        <span className="text-xs text-muted-foreground">This month</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rep</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deals</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Close Rate</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Days</th>
            </tr>
          </thead>
          <tbody>
            {closers.map((rep, idx) => (
              <tr
                key={rep.id}
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      idx < 3 ? medals[idx] : "text-muted-foreground"
                    )}
                  >
                    #{idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                      idx === 0
                        ? "bg-accent/15 text-accent"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {rep.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{rep.name}</p>
                      <p className="text-[11px] text-muted-foreground">{rep.office}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-card-foreground">
                  {rep.dealsThisMonth}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-card-foreground">
                  ${(rep.revenue / 1000).toFixed(1)}k
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "text-sm font-medium",
                    rep.closeRate >= 45 ? "text-success" : rep.closeRate >= 35 ? "text-card-foreground" : "text-warning"
                  )}>
                    {rep.closeRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                  {rep.avgDaysToClose}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
