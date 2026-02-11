"use client"

import { TODAYS_APPOINTMENTS } from "@/lib/mock-data"
import { Clock, MapPin, Video, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppointmentsList() {
  const appointments = TODAYS_APPOINTMENTS

  if (appointments.length === 0) {
    return (
      <div className="card-premium p-6">
        <h3 className="section-title mb-4">
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
    <div className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="section-title">
          {"Today's Appointments"}
        </h3>
        <span
          className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold"
          style={{ backgroundColor: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}
        >
          {appointments.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {appointments.map((apt) => (
          <a
            key={apt.id}
            href={`/deals/${apt.dealId}`}
            className="group flex items-center gap-4 rounded-xl border border-transparent p-3.5 transition-all duration-200 hover:border-border hover:bg-muted/40"
          >
            <div
              className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(14,165,233,0.08)", color: "#0ea5e9" }}
            >
              <span className="text-sm font-bold leading-none">
                {apt.time.split(":")[0]}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase leading-none opacity-70">
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
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                apt.type === "virtual" ? "bg-chart-4/10 text-chart-4" : "bg-chart-2/10 text-chart-2"
              )}>
                {apt.type === "virtual" ? <Video className="h-2.5 w-2.5" /> : <Home className="h-2.5 w-2.5" />}
                {apt.type === "virtual" ? "Virtual" : "In-Home"}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Set by {apt.setter}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
