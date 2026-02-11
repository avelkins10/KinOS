"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineFiltersProps {
  officeOptions: { id: string; name: string }[];
  closerOptions: { id: string; name: string }[];
  lenderOptions: string[];
  sourceOptions: string[];
  stageOptions: { value: string; label: string }[];
  show: boolean;
  onClose?: () => void;
}

export function PipelineFilters({
  officeOptions,
  closerOptions,
  lenderOptions,
  sourceOptions,
  stageOptions,
  show,
  onClose,
}: PipelineFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const office = searchParams.get("office") ?? "";
  const closer = searchParams.get("closer") ?? "";
  const lender = searchParams.get("lender") ?? "";
  const source = searchParams.get("source") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const stages = searchParams.get("stages")?.split(",").filter(Boolean) ?? [];

  const activeCount = [
    office,
    closer,
    lender,
    source,
    dateFrom,
    dateTo,
    stages.length,
  ].filter((v) => (Array.isArray(v) ? v.length > 0 : !!v)).length;

  const apply = (updates: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
        else params.delete(key);
      } else if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/deals?${params.toString()}`);
  };

  const clear = () => {
    router.push("/deals");
    onClose?.();
  };

  if (!show) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 animate-slide-in">
      <select
        value={office}
        onChange={(e) => apply({ office: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Office"
      >
        <option value="">All Offices</option>
        {officeOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <select
        value={closer}
        onChange={(e) => apply({ closer: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Closer"
      >
        <option value="">All Closers</option>
        {closerOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={lender}
        onChange={(e) => apply({ lender: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Lender"
      >
        <option value="">All Lenders</option>
        {lenderOptions.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <select
        value={source}
        onChange={(e) => apply({ source: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Source"
      >
        <option value="">All Sources</option>
        {sourceOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => apply({ dateFrom: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Date from"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => apply({ dateTo: e.target.value })}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        aria-label="Date to"
      />
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clear}
          className={cn(
            "flex items-center gap-1 text-xs font-medium text-destructive",
            "hover:text-destructive/80 transition-colors",
          )}
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
