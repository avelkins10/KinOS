"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { mapDealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { useDealRealtime } from "@/hooks/use-deal-realtime";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/constants/pipeline";
import { DealWorkflowLayout } from "./deal-workflow-layout";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

interface DealDetailClientProps {
  dealId: string;
  initialDealRaw: DealDetail;
}

export function DealDetailClient({
  dealId,
  initialDealRaw,
}: DealDetailClientProps) {
  const router = useRouter();
  const liveDealRaw = useDealRealtime(dealId, initialDealRaw);
  const deal = mapDealForUI(liveDealRaw ?? initialDealRaw);
  /** Refresh server data after Aurora actions; Realtime may not fire for supabaseAdmin writes. */
  const onDealUpdated = () => router.refresh();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/deals"
              className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              aria-label="Back to deals"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <nav
              className="flex items-center gap-1 text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link
                href="/deals"
                className="transition-colors hover:text-foreground"
              >
                Deals
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-foreground">
                {deal.customerName}
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                STAGE_COLORS[deal.stage],
              )}
            >
              {STAGE_LABELS[deal.stage]}
            </span>
            <button
              type="button"
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {deal.customerName}
            </h1>
            <div className="mt-0.5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {deal.address}, {deal.city}, {deal.state}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {deal.phone || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {deal.email || "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deal.closer?.name ?? "—"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {deal.createdAt
                ? new Date(deal.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {deal.daysInPipeline}d
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DealWorkflowLayout
          deal={deal}
          dealDetail={initialDealRaw}
          onDealUpdated={onDealUpdated}
        />
      </div>
    </div>
  );
}
