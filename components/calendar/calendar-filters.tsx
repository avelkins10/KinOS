"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

interface CalendarFiltersProps {
  closers: { id: string; name: string }[];
  offices: { id: string; name: string }[];
}

export function CalendarFilters({ closers, offices }: CalendarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") ?? "day";
  const closerId = searchParams.get("closerId") ?? "";
  const officeId = searchParams.get("officeId") ?? "";
  const statuses = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/calendar?${next.toString()}`);
    },
    [router, searchParams],
  );

  const toggleStatus = useCallback(
    (status: string) => {
      const next = new Set(statuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next.size > 0) nextParams.set("status", [...next].join(","));
      else nextParams.delete("status");
      router.push(`/calendar?${nextParams.toString()}`);
    },
    [router, searchParams, statuses],
  );

  const clearFilters = useCallback(() => {
    router.push("/calendar");
  }, [router]);

  const goToToday = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("date", new Date().toISOString().slice(0, 10));
    router.push(`/calendar?${next.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2">
        <Label
          htmlFor="closer-filter"
          className="text-xs text-muted-foreground"
        >
          Closer
        </Label>
        <Select
          value={closerId || "all"}
          onValueChange={(v) => setParam("closerId", v === "all" ? null : v)}
        >
          <SelectTrigger id="closer-filter" className="w-[160px]">
            <SelectValue placeholder="All closers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All closers</SelectItem>
            {closers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label
          htmlFor="office-filter"
          className="text-xs text-muted-foreground"
        >
          Office
        </Label>
        <Select
          value={officeId || "all"}
          onValueChange={(v) => setParam("officeId", v === "all" ? null : v)}
        >
          <SelectTrigger id="office-filter" className="w-[160px]">
            <SelectValue placeholder="All offices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All offices</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.slice(0, 4).map((s) => (
            <label
              key={s.value}
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <Checkbox
                checked={statuses.includes(s.value)}
                onCheckedChange={() => toggleStatus(s.value)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={goToToday}>
        Today
      </Button>
      <Button variant="ghost" size="sm" onClick={clearFilters}>
        Clear filters
      </Button>
    </div>
  );
}
