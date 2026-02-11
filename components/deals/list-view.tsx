"use client";

import { useState } from "react";
import Link from "next/link";
import type { DealForUI } from "@/lib/deals-mappers";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/constants/pipeline";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Zap } from "lucide-react";

type SortField =
  | "customerName"
  | "stage"
  | "systemSize"
  | "dealValue"
  | "createdAt"
  | "daysInPipeline";
type SortDir = "asc" | "desc";

export function ListView({ deals }: { deals: DealForUI[] }) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((d) => d.id)));
    }
  };

  const sorted = [...deals].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "customerName":
        return a.customerName.localeCompare(b.customerName) * dir;
      case "stage":
        return a.stage.localeCompare(b.stage) * dir;
      case "systemSize":
        return ((a.systemSize ?? 0) - (b.systemSize ?? 0)) * dir;
      case "dealValue":
        return (a.dealValue - b.dealValue) * dir;
      case "createdAt":
        return (
          (new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()) *
          dir
        );
      case "daysInPipeline":
        return (a.daysInPipeline - b.daysInPipeline) * dir;
      default:
        return 0;
    }
  });

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown
        className={cn(
          "h-3 w-3",
          sortField === field ? "text-primary" : "text-muted-foreground/30",
        )}
      />
    </button>
  );

  return (
    <div className="card-premium overflow-hidden">
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 border-b border-border px-4 py-2.5"
          style={{ backgroundColor: "rgba(14,165,233,0.04)" }}
        >
          <span className="text-xs font-semibold text-primary">
            {selected.size} selected
          </span>
          <button
            type="button"
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            style={{ backgroundColor: "rgba(14,165,233,0.08)" }}
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="table-premium">
          <thead>
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === sorted.length && sorted.length > 0}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
              </th>
              <th className="px-4">
                <SortHeader field="customerName">Customer</SortHeader>
              </th>
              <th className="px-4">Address</th>
              <th className="px-4">
                <SortHeader field="stage">Stage</SortHeader>
              </th>
              <th className="px-4">Closer</th>
              <th className="px-4 text-right">
                <SortHeader field="systemSize">System</SortHeader>
              </th>
              <th className="px-4">Lender</th>
              <th className="px-4 text-right">
                <SortHeader field="dealValue">Value</SortHeader>
              </th>
              <th className="px-4 text-right">
                <SortHeader field="daysInPipeline">Age</SortHeader>
              </th>
              <th className="px-4">Progress</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((deal) => (
              <tr
                key={deal.id}
                className={cn(
                  "border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30",
                  selected.has(deal.id) && "bg-primary/5",
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(deal.id)}
                    onChange={() => toggleSelect(deal.id)}
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-sm font-semibold text-card-foreground hover:text-primary transition-colors"
                  >
                    {deal.customerName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                    {deal.address}, {deal.city}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      STAGE_COLORS[deal.stage],
                    )}
                  >
                    {STAGE_LABELS[deal.stage]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                      {deal.closer?.avatar ?? "?"}
                    </div>
                    <span className="text-sm text-card-foreground">
                      {deal.closer?.name ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {deal.systemSize ? (
                    <span className="flex items-center justify-end gap-1 text-sm text-card-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      {deal.systemSize} kW
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/40">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {deal.lender ?? (
                    <span className="text-muted-foreground/40">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-card-foreground">
                  {deal.dealValue > 0
                    ? `$${(deal.dealValue / 1000).toFixed(1)}k`
                    : "--"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      deal.daysInPipeline > 45
                        ? "text-destructive"
                        : deal.daysInPipeline > 30
                          ? "text-warning"
                          : "text-muted-foreground",
                    )}
                  >
                    {deal.daysInPipeline}d
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{
                        width: `${Math.min((deal.daysInPipeline / 60) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
