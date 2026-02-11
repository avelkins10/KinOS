"use client";

import Link from "next/link";
import { Clock, MapPin, Video, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

interface AppointmentsListProps {
  appointments: AppointmentWithRelations[];
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  if (appointments.length === 0) {
    return (
      <div className="card-premium p-6">
        <h3 className="section-title mb-4">Today&apos;s Appointments</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-card-foreground">
            No appointments today
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your schedule is clear
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...appointments].sort(
    (a, b) =>
      new Date(a.scheduled_start).getTime() -
      new Date(b.scheduled_start).getTime(),
  );

  return (
    <div className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="section-title">Today&apos;s Appointments</h3>
        <span
          className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold"
          style={{ backgroundColor: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}
        >
          {appointments.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {sorted.map((apt) => {
          const contactName = apt.contact
            ? `${apt.contact.first_name ?? ""} ${apt.contact.last_name ?? ""}`.trim() ||
              "—"
            : "—";
          const time = apt.scheduled_start
            ? new Date(apt.scheduled_start).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })
            : "—";
          const type =
            (apt.appointment_type ?? "in_home") === "virtual"
              ? "virtual"
              : "in-home";
          const setterName = apt.setter
            ? `${apt.setter.first_name} ${apt.setter.last_name}`
            : "—";
          const dealId = apt.deal?.id;
          return (
            <Link
              key={apt.id}
              href={dealId ? `/deals/${dealId}` : "/calendar"}
              className="group flex items-center gap-4 rounded-xl border border-transparent p-3.5 transition-all duration-200 hover:border-border hover:bg-muted/40"
            >
              <div
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(14,165,233,0.08)",
                  color: "#0ea5e9",
                }}
              >
                <span className="text-sm font-bold leading-none">
                  {time.split(" ")[0]}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase leading-none opacity-70">
                  {time.includes("PM") ? "PM" : "AM"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {contactName}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{apt.location ?? "—"}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    type === "virtual"
                      ? "bg-chart-4/10 text-chart-4"
                      : "bg-chart-2/10 text-chart-2",
                  )}
                >
                  {type === "virtual" ? (
                    <Video className="h-2.5 w-2.5" />
                  ) : (
                    <Home className="h-2.5 w-2.5" />
                  )}
                  {type === "virtual" ? "Virtual" : "In-Home"}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Set by {setterName}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
