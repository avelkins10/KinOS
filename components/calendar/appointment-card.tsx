"use client";

import { Clock, MapPin, User, Video, Home, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-primary/40 bg-primary/5",
  confirmed: "border-primary/40 bg-primary/10",
  completed: "border-emerald-300 bg-emerald-50",
  no_show: "border-red-300 bg-red-50",
  cancelled: "border-slate-300 bg-slate-100 text-muted-foreground",
  rescheduled: "border-amber-300 bg-amber-50",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  in_home: <Home className="h-3.5 w-3.5" />,
  virtual: <Video className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
};

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onClick?: () => void;
  compact?: boolean;
}

export function AppointmentCard({
  appointment,
  onClick,
  compact = false,
}: AppointmentCardProps) {
  const contactName = appointment.contact
    ? `${appointment.contact.first_name ?? ""} ${appointment.contact.last_name ?? ""}`.trim() ||
      "—"
    : "—";
  const time = appointment.scheduled_start
    ? new Date(appointment.scheduled_start).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
  const statusColor =
    STATUS_COLORS[appointment.status] ?? "border-border bg-card";
  const typeIcon = TYPE_ICONS[appointment.appointment_type ?? "in_home"] ?? (
    <Home className="h-3.5 w-3.5" />
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-lg border p-2 text-left text-xs transition-colors hover:shadow-sm",
          statusColor,
        )}
      >
        <div className="font-semibold text-foreground">{time}</div>
        <div className="truncate text-muted-foreground">{contactName}</div>
        {appointment.location && (
          <div className="mt-0.5 flex items-center gap-1 truncate text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{appointment.location}</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:shadow-md",
        statusColor,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Clock className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground">{time}</span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              appointment.appointment_type === "virtual"
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {typeIcon}
            {(appointment.appointment_type ?? "in_home").replace("_", "-")}
          </span>
        </div>
        <p className="mt-1 font-medium text-foreground">{contactName}</p>
        {appointment.location && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{appointment.location}</span>
          </div>
        )}
        {appointment.setter && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            Set by {appointment.setter.first_name}{" "}
            {appointment.setter.last_name}
          </div>
        )}
      </div>
    </button>
  );
}
