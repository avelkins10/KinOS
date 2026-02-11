import { getCurrentUser } from "@/lib/actions/auth";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [statsAllResult, statsCloserResult] = await Promise.all([
    getDashboardStats(),
    user?.userId
      ? getDashboardStats({ closerId: user.userId })
      : Promise.resolve({ data: null, error: null }),
  ]);
  const statsAll = statsAllResult.data ?? null;
  const statsCloser = statsCloserResult.data ?? null;

  return <DashboardClient statsAll={statsAll} statsCloser={statsCloser} />;
}
