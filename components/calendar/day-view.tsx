"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AppointmentCard } from "./appointment-card";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
interface DayViewProps {
  appointments: AppointmentWithRelations[];
  date: Date;
  onAppointmentClick: (a: AppointmentWithRelations) => void;
}

export function DayView({
  appointments,
  date,
  onAppointmentClick,
}: DayViewProps) {
  const dayStart = useMemo(() => {
    const d = new Date(date);
    d.setHours(7, 0, 0, 0);
    return d.getTime();
  }, [date]);
  const dayEnd = useMemo(() => {
    const d = new Date(date);
    d.setHours(21, 0, 0, 0);
    return d.getTime();
  }, [date]);
  const now = Date.now();
  const isToday =
    date.getDate() === new Date().getDate() &&
    date.getMonth() === new Date().getMonth() &&
    date.getFullYear() === new Date().getFullYear();

  const blocks = useMemo(() => {
    return appointments
      .filter((a) => {
        const start = new Date(a.scheduled_start).getTime();
        return start >= dayStart && start < dayEnd;
      })
      .map((a) => {
        const start = new Date(a.scheduled_start).getTime();
        const end = a.scheduled_end
          ? new Date(a.scheduled_end).getTime()
          : start + 60 * 60 * 1000;
        const top = ((start - dayStart) / (dayEnd - dayStart)) * 100;
        const height = Math.max(4, ((end - start) / (dayEnd - dayStart)) * 100);
        return { appointment: a, top, height };
      });
  }, [appointments, dayStart, dayEnd]);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-0 rounded-xl border border-border bg-card">
      <div className="flex flex-col">
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex h-16 items-start justify-end pr-2 text-xs text-muted-foreground"
          >
            {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
          </div>
        ))}
      </div>
      <div className="relative min-h-[14*4rem]">
        {HOURS.map((h) => (
          <div key={h} className="h-16 border-t border-border/50" aria-hidden />
        ))}
        {isToday && (
          <div
            className="absolute left-0 right-0 z-10 h-0.5 bg-red-500"
            style={{
              top: `${((now - dayStart) / (dayEnd - dayStart)) * 100}%`,
            }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 px-1">
          {blocks.map(({ appointment, top, height }) => (
            <div
              key={appointment.id}
              className="absolute left-1 right-1 z-20"
              style={{ top: `${top}%`, height: `${height}%` }}
            >
              <AppointmentCard
                appointment={appointment}
                compact
                onClick={() => onAppointmentClick(appointment)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
