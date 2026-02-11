import React from "react";
import Link from "next/link";
import { getDeal } from "@/lib/actions/deals";
import { DealDetailClient } from "@/components/deals/detail/deal-detail-client";
import { ArrowLeft } from "lucide-react";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: dealRow, error } = await getDeal(id);

  if (error || !dealRow) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Deal not found
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The deal you are looking for does not exist or you don&apos;t have
            access.
          </p>
          <Link
            href="/deals"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DealDetailClient
      dealId={id}
      initialDealRaw={dealRow as import("@/lib/actions/deals").DealDetail}
    />
  );
}
