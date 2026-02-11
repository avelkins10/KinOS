"use client"

import { TODAYS_APPOINTMENTS } from "@/lib/mock-data"
import { CalendarDays, Clock, MapPin, Video, Home, User } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const CURRENT_DAY = 1 // Tuesday (index)

export default function CalendarPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Today's appointments and upcoming schedule."}
        </p>
      </div>

      {/* Mini Week View */}
      <div className="mb-6 flex items-center gap-2">
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "flex flex-1 flex-col items-center rounded-xl border p-3 transition-all",
              idx === CURRENT_DAY
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</span>
            <span className={cn(
              "mt-1 text-lg font-bold",
              idx === CURRENT_DAY ? "text-primary" : "text-foreground"
            )}>
              {8 + idx}
            </span>
            {idx === CURRENT_DAY && (
              <div className="mt-1 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <div className="h-1 w-1 rounded-full bg-primary" />
                <div className="h-1 w-1 rounded-full bg-primary" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {"Today's Appointments"} ({TODAYS_APPOINTMENTS.length})
        </h2>
      </div>

      <div className="space-y-3">
        {TODAYS_APPOINTMENTS.map((apt) => (
          <a
            key={apt.id}
            href={`/deals/${apt.dealId}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
          >
            {/* Time */}
            <div className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-primary/10 p-3">
              <Clock className="h-4 w-4 text-primary mb-1" />
              <span className="text-sm font-bold text-primary">{apt.time}</span>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-foreground">{apt.customerName}</h3>
                <span className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                  apt.type === "in-home"
                    ? "border-success/25 bg-success/10 text-success"
                    : "border-primary/25 bg-primary/10 text-primary"
                )}>
                  {apt.type === "in-home" ? <Home className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                  {apt.type === "in-home" ? "In-Home" : "Virtual"}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {apt.address}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Set by {apt.setter}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Empty State for rest of day */}
      <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-border py-10">
        <div className="text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No more appointments today
          </p>
        </div>
      </div>
    </div>
  )
}
