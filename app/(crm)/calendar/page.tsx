import { Suspense } from "react";
import {
  getAppointments,
  getCalendarFilterOptions,
} from "@/lib/actions/appointments";
import { CalendarView } from "@/components/calendar/calendar-view";

interface PageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    closerId?: string;
    officeId?: string;
    status?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view ?? "day";
  const dateParam = params.date ?? new Date().toISOString().slice(0, 10);
  const date = new Date(dateParam + "T12:00:00");
  let start: Date;
  let end: Date;
  if (view === "week") {
    start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (view === "month") {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    start = new Date(date);
    start.setHours(0, 0, 0, 0);
    end = new Date(date);
    end.setHours(23, 59, 59, 999);
  }

  const [appointmentsResult, filterResult] = await Promise.all([
    getAppointments({
      dateRange: { start, end },
      closerId: params.closerId ?? undefined,
      officeId: params.officeId ?? undefined,
      status: params.status?.split(",").filter(Boolean),
    }),
    getCalendarFilterOptions(),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const filterOptions = filterResult.data ?? { closers: [], offices: [] };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s appointments and upcoming schedule.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading calendar…</div>
        }
      >
        <CalendarView
          appointments={appointments}
          filterOptions={filterOptions}
        />
      </Suspense>
    </div>
  );
}
