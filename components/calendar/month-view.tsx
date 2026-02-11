"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

interface MonthViewProps {
  appointments: AppointmentWithRelations[];
  month: Date;
  onDayClick: (date: Date) => void;
}

export function MonthView({ appointments, month, onDayClick }: MonthViewProps) {
  const { weeks, countByDay } = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstDow = start.getDay();
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    const padStart = firstDow;
    const total = padStart + daysInMonth;
    const rows = Math.ceil(total / 7);
    const weeks: (Date | null)[][] = [];
    let day = 1;
    const countByDay: Record<string, number> = {};
    for (let r = 0; r < rows; r++) {
      const row: (Date | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (i < padStart || day > daysInMonth) {
          row.push(null);
        } else {
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          row.push(date);
          const key = date.toISOString().slice(0, 10);
          countByDay[key] = appointments.filter((a) => {
            const d = new Date(a.scheduled_start).toISOString().slice(0, 10);
            return d === key;
          }).length;
          day++;
        }
      }
      weeks.push(row);
    }
    return { weeks, countByDay };
  }, [month, appointments]);

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-2 space-y-1">
        {weeks.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1">
            {row.map((date, ci) => {
              if (!date) {
                return <div key={ci} className="aspect-square rounded-lg" />;
              }
              const key = date.toISOString().slice(0, 10);
              const count = countByDay[key] ?? 0;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onDayClick(date)}
                  className={cn(
                    "aspect-square rounded-lg border p-1 text-sm transition-colors hover:bg-muted/50",
                    isToday
                      ? "border-primary bg-primary/10 font-bold"
                      : "border-border/50",
                  )}
                >
                  {date.getDate()}
                  {count > 0 && (
                    <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
