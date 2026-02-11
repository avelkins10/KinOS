"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AppointmentCard } from "./appointment-card";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

interface WeekViewProps {
  appointments: AppointmentWithRelations[];
  weekStart: Date;
  onAppointmentClick: (a: AppointmentWithRelations) => void;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export function WeekView({
  appointments,
  weekStart,
  onAppointmentClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    return DAYS.map((d) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      return date;
    });
  }, [weekStart]);

  const dayStart = useMemo(() => {
    const d = new Date(weekStart);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [weekStart]);
  const dayEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map: Record<string, AppointmentWithRelations[]> = {};
    weekDays.forEach((date) => {
      const key = date.toISOString().slice(0, 10);
      map[key] = [];
    });
    appointments.forEach((a) => {
      const start = new Date(a.scheduled_start).getTime();
      if (start >= dayStart && start <= dayEnd) {
        const key = new Date(a.scheduled_start).toISOString().slice(0, 10);
        if (map[key]) map[key].push(a);
      }
    });
    weekDays.forEach((date) => {
      const key = date.toISOString().slice(0, 10);
      (map[key] ?? []).sort(
        (x, y) =>
          new Date(x.scheduled_start).getTime() -
          new Date(y.scheduled_start).getTime(),
      );
    });
    return map;
  }, [appointments, weekDays, dayStart, dayEnd]);

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-7 gap-2 rounded-xl border border-border bg-card p-2">
      {weekDays.map((date) => {
        const key = date.toISOString().slice(0, 10);
        const dayAppointments = byDay[key] ?? [];
        const isToday = key === todayKey;
        return (
          <div
            key={key}
            className={cn(
              "flex min-h-[200px] flex-col rounded-lg border p-2",
              isToday ? "border-primary bg-primary/5" : "border-border/50",
            )}
          >
            <div className="mb-2 text-center text-xs font-semibold text-muted-foreground">
              {date.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="text-center text-lg font-bold text-foreground">
              {date.getDate()}
            </div>
            <div className="mt-2 space-y-1 overflow-y-auto">
              {dayAppointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  compact
                  onClick={() => onAppointmentClick(a)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
