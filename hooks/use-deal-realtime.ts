"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DealWithRelations } from "@/lib/actions/deals";

export function useDealRealtime(
  dealId: string | null,
  initialDeal: DealWithRelations | null,
) {
  const [deal, setDeal] = useState<DealWithRelations | null>(initialDeal);
  const supabase = createClient();

  useEffect(() => {
    if (!dealId) {
      setDeal(null);
      return;
    }
    setDeal(initialDeal);

    const channel = supabase
      .channel(`deal-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        (payload) => {
          if (payload.new)
            setDeal((prev) =>
              prev
                ? { ...prev, ...(payload.new as Record<string, unknown>) }
                : (payload.new as DealWithRelations),
            );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, initialDeal?.id]);

  return deal;
}
