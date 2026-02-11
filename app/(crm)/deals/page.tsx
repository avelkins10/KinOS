import { Suspense } from "react";
import { getDealsByStage, getOffices, getClosers } from "@/lib/actions/deals";
import { mapDealsForUI } from "@/lib/deals-mappers";
import { DealsPageClient } from "@/components/deals/deals-page-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DealsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const officeId =
    typeof params?.office === "string" ? params.office : undefined;
  const closerId =
    typeof params?.closer === "string" ? params.closer : undefined;
  const dateFrom =
    typeof params?.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params?.dateTo === "string" ? params.dateTo : undefined;
  const stagesParam = params?.stages;
  const stages =
    typeof stagesParam === "string"
      ? (stagesParam
          .split(",")
          .filter(Boolean) as import("@/lib/constants/pipeline").DealStage[])
      : undefined;
  const search = typeof params?.search === "string" ? params.search : undefined;

  const [dealsResult, officesResult, closersResult] = await Promise.all([
    getDealsByStage({
      officeId,
      closerId,
      dateRange:
        dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
      search,
      stages,
    }),
    getOffices(),
    getClosers(officeId),
  ]);

  const officeOptions = officesResult.data ?? [];
  const closerOptions = closersResult.data ?? [];
  const dealsData = dealsResult.data;
  const rawDeals = dealsData ? Object.values(dealsData.byStage).flat() : [];
  const initialDeals = rawDeals.length ? mapDealsForUI(rawDeals) : [];

  return (
    <Suspense fallback={<DealsLoadingSkeleton />}>
      <DealsPageClient
        initialDeals={initialDeals}
        initialDealsRaw={rawDeals}
        officeId={officeId}
        closerId={closerId}
        stages={stages}
        officeOptions={officeOptions}
        closerOptions={closerOptions}
      />
    </Suspense>
  );
}

function DealsLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[400px] w-[280px] shrink-0 animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
