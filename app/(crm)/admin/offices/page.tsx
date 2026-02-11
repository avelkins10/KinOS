"use client"

import { OFFICES, REPS, DEALS } from "@/lib/mock-data"
import { MapPin, Users, Handshake, DollarSign, Plus } from "lucide-react"

export default function AdminOfficesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Offices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage office locations and team assignments.</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Office
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OFFICES.map((office) => {
          const reps = REPS.filter((r) => r.office === office)
          const officeDeals = DEALS.filter((d) => reps.some((r) => r.id === d.closer.id))
          const totalRevenue = officeDeals.reduce((sum, d) => sum + d.dealValue, 0)

          return (
            <div key={office} className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{office}</h3>
                  <p className="text-xs text-muted-foreground">{reps.length} team members</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Reps</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{reps.length}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Handshake className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Deals</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{officeDeals.length}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Value</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {totalRevenue > 0 ? `$${(totalRevenue / 1000).toFixed(0)}k` : "$0"}
                  </p>
                </div>
              </div>

              {/* Rep list */}
              <div className="mt-4 flex flex-wrap gap-2">
                {reps.map((rep) => (
                  <div key={rep.id} className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                      {rep.avatar}
                    </div>
                    <span className="text-xs font-medium text-foreground">{rep.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
