import { getCurrentUser } from "@/lib/actions/auth";
import { getDashboardStats } from "@/lib/actions/dashboard";
import {
  getTodaysAppointments,
  getAppointmentOutcomesStats,
} from "@/lib/actions/appointments";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [
    statsAllResult,
    statsCloserResult,
    appointmentsResult,
    outcomesResult,
  ] = await Promise.all([
    getDashboardStats(),
    user?.userId
      ? getDashboardStats({ closerId: user.userId })
      : Promise.resolve({ data: null, error: null }),
    getTodaysAppointments(),
    getAppointmentOutcomesStats(7),
  ]);
  const statsAll = statsAllResult.data ?? null;
  const statsCloser = statsCloserResult.data ?? null;
  const todaysAppointments = appointmentsResult.data ?? [];
  const appointmentOutcomes = outcomesResult.data ?? null;

  return (
    <DashboardClient
      statsAll={statsAll}
      statsCloser={statsCloser}
      todaysAppointments={todaysAppointments}
      appointmentOutcomes={appointmentOutcomes}
    />
  );
}
