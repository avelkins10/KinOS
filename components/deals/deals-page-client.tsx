"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KanbanView } from "@/components/deals/kanban-view";
import { ListView } from "@/components/deals/list-view";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Filter, X } from "lucide-react";
import type { DealForUI } from "@/lib/deals-mappers";
import { mapDealsForUI } from "@/lib/deals-mappers";
import type { DealWithRelations } from "@/lib/actions/deals";
import { useDealsRealtime } from "@/hooks/use-deals-realtime";
// TODO: Replace mock data with real Supabase query
import { LENDERS, SOURCES } from "@/lib/mock-data";
import { DealSearch } from "./deal-search";
import { CreateDealDialog } from "./create-deal-dialog";

type ViewMode = "kanban" | "list";

interface DealsPageClientProps {
  initialDeals: DealForUI[];
  initialDealsRaw: DealWithRelations[];
  officeId?: string;
  closerId?: string;
  stages?: import("@/lib/constants/pipeline").DealStage[];
  officeOptions: { id: string; name: string }[];
  closerOptions: { id: string; name: string }[];
}

export function DealsPageClient({
  initialDeals,
  initialDealsRaw,
  officeId,
  closerId,
  stages,
  officeOptions,
  closerOptions,
}: DealsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("kanban");
  const [showFilters, setShowFilters] = useState(false);

  const liveRawDeals = useDealsRealtime(initialDealsRaw, {
    officeId,
    closerId,
    stages,
  });
  const dealsForUI = useMemo(() => mapDealsForUI(liveRawDeals), [liveRawDeals]);

  const filterOffice = searchParams.get("office") ?? "";
  const filterCloser = searchParams.get("closer") ?? "";
  const filterLender = searchParams.get("lender") ?? "";
  const filterSource = searchParams.get("source") ?? "";

  const filteredDeals = useMemo(() => {
    let result = dealsForUI;
    if (filterCloser)
      result = result.filter((d) => d.closer?.id === filterCloser);
    if (filterLender) result = result.filter((d) => d.lender === filterLender);
    if (filterSource) result = result.filter((d) => d.source === filterSource);
    return result;
  }, [dealsForUI, filterCloser, filterLender, filterSource]);

  const activeFilters = [
    filterOffice,
    filterCloser,
    filterLender,
    filterSource,
  ].filter(Boolean).length;

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/deals?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/deals");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-header text-foreground">Deal Pipeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredDeals.length} deals · $
              {(
                filteredDeals.reduce((s, d) => s + d.dealValue, 0) / 1000
              ).toFixed(0)}
              k total value
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DealSearch />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                showFilters || activeFilters > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {activeFilters > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </button>
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                  view === "kanban"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                  view === "list"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <CreateDealDialog
              defaultOfficeId={undefined}
              defaultCloserId={undefined}
            />
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 animate-slide-in">
            <select
              value={filterOffice}
              onChange={(e) => applyFilters({ office: e.target.value })}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Offices</option>
              {officeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <select
              value={filterCloser}
              onChange={(e) => applyFilters({ closer: e.target.value })}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Closers</option>
              {closerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterLender}
              onChange={(e) => applyFilters({ lender: e.target.value })}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Lenders</option>
              {LENDERS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filterSource}
              onChange={(e) => applyFilters({ source: e.target.value })}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-6">
        {filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              No deals match your filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : view === "kanban" ? (
          <KanbanView deals={filteredDeals} />
        ) : (
          <ListView deals={filteredDeals} />
        )}
      </div>
    </div>
  );
}
