"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DealFilters } from "@/lib/actions/deals";
import type { DealWithRelations } from "@/lib/actions/deals";

function rowMatchesFilters(
  row: Record<string, unknown>,
  filters: DealFilters,
): boolean {
  if (filters.officeId && row.office_id !== filters.officeId) return false;
  if (filters.closerId && row.closer_id !== filters.closerId) return false;
  if (
    filters.stages?.length &&
    typeof row.stage === "string" &&
    !filters.stages.includes(row.stage)
  )
    return false;
  return true;
}

export function useDealsRealtime(
  initialDeals: DealWithRelations[],
  filters: DealFilters = {},
) {
  const [deals, setDeals] = useState<DealWithRelations[]>(initialDeals);
  const supabase = createClient();

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    const channel = supabase
      .channel("deals-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals",
          filter: "deleted_at=is.null",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const row = payload.new as Record<string, unknown>;
            if (!rowMatchesFilters(row, filters)) return;
            setDeals((prev) => [payload.new as DealWithRelations, ...prev]);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const row = payload.new as Record<string, unknown>;
            setDeals((prev) => {
              const inList = prev.some((d) => d.id === row.id);
              const matches = rowMatchesFilters(row, filters);
              if (inList && !matches)
                return prev.filter((d) => d.id !== row.id);
              if (inList && matches)
                return prev.map((d) =>
                  d.id === row.id ? (payload.new as DealWithRelations) : d,
                );
              if (!inList && matches)
                return [payload.new as DealWithRelations, ...prev];
              return prev;
            });
          } else if (payload.eventType === "DELETE" && payload.old) {
            setDeals((prev) =>
              prev.filter((d) => d.id !== (payload.old as { id: string }).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.officeId, filters.closerId, filters.stages?.join(",")]);

  return deals;
}
