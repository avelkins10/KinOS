"use client"

import Link from "next/link"
import { TODAYS_APPOINTMENTS } from "@/lib/mock-data"
import { Clock, MapPin, Video, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppointmentsList() {
  const appointments = TODAYS_APPOINTMENTS

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          {"Today's Appointments"}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-card-foreground">No appointments today</p>
          <p className="mt-1 text-xs text-muted-foreground">Your schedule is clear</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">
          {"Today's Appointments"}
        </h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {appointments.length}
        </span>
      </div>
      <div className="space-y-2">
        {appointments.map((apt) => (
          <Link
            key={apt.id}
            href={`/deals/${apt.dealId}`}
            className="group flex items-center gap-4 rounded-lg border border-transparent p-3 transition-all duration-150 hover:border-border hover:bg-muted/50 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-sm font-bold leading-none">
                {apt.time.split(":")[0]}
              </span>
              <span className="mt-0.5 text-[10px] font-medium uppercase leading-none">
                {apt.time.includes("PM") ? "PM" : "AM"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-card-foreground">
                {apt.customerName}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{apt.address}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                apt.type === "virtual" ? "bg-chart-4/10 text-chart-4" : "bg-chart-2/10 text-chart-2"
              )}>
                {apt.type === "virtual" ? <Video className="h-2.5 w-2.5" /> : <Home className="h-2.5 w-2.5" />}
                {apt.type === "virtual" ? "Virtual" : "In-Home"}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Set by {apt.setter}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
