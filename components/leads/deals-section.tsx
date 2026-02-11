"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DealRow {
  id: string;
  deal_number: string | null;
  stage: string | null;
  gross_price: number | null;
  created_at: string | null;
}

interface DealsSectionProps {
  contactId: string;
  deals: DealRow[];
}

export function DealsSection({ contactId, deals }: DealsSectionProps) {
  const router = useRouter();
  const list = (deals ?? []).sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime(),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Deals</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => router.push(`/deals?new=1&contactId=${contactId}`)}
        >
          <Plus className="h-3.5 w-3.5" />
          New deal
        </Button>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((d) => (
              <li
                key={d.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
                onClick={() => router.push(`/deals/${d.id}`)}
              >
                <span className="font-medium">
                  {d.deal_number ?? d.id.slice(0, 8)}
                </span>
                <span className="text-muted-foreground">
                  {d.stage ?? "—"}
                  {d.gross_price != null
                    ? ` · $${(d.gross_price / 1000).toFixed(0)}k`
                    : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.created_at
                    ? new Date(d.created_at).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
