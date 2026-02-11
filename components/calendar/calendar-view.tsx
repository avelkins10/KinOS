"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { AppointmentListView } from "./appointment-list";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { CalendarFilters } from "./calendar-filters";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

type ViewMode = "day" | "week" | "month" | "list";

interface CalendarViewProps {
  appointments: AppointmentWithRelations[];
  filterOptions: {
    closers: { id: string; name: string }[];
    offices: { id: string; name: string }[];
  };
}

export function CalendarView({
  appointments,
  filterOptions,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as ViewMode) ?? "day";
  const dateParam =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const currentDate = new Date(dateParam + "T12:00:00");
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  const setView = useCallback(
    (v: ViewMode) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("view", v);
      router.push(`/calendar?${next.toString()}`);
    },
    [router, searchParams],
  );

  const setDate = useCallback(
    (date: Date) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("date", date.toISOString().slice(0, 10));
      router.push(`/calendar?${next.toString()}`);
    },
    [router, searchParams],
  );

  const handleAppointmentClick = useCallback((a: AppointmentWithRelations) => {
    setSelectedAppointment(a);
    setModalOpen(true);
  }, []);

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
        <CalendarFilters
          closers={filterOptions.closers}
          offices={filterOptions.offices}
        />
      </div>

      {view === "day" && (
        <DayView
          appointments={appointments}
          date={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {view === "week" && (
        <WeekView
          appointments={appointments}
          weekStart={weekStart}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {view === "month" && (
        <MonthView
          appointments={appointments}
          month={monthStart}
          onDayClick={setDate}
        />
      )}
      {view === "list" && (
        <AppointmentListView
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
          page={listPage}
          onPageChange={setListPage}
        />
      )}

      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
