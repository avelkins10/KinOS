"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { mapDealsForUI } from "@/lib/deals-mappers";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealWithRelations } from "@/lib/actions/deals";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export function DealSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DealForUI[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/deals/search?q=${encodeURIComponent(q.trim())}`,
      );
      const data = (await res.json()) as
        | DealWithRelations[]
        | { error: string };
      setLoading(false);
      if (!res.ok || Array.isArray(data) === false) {
        setResults([]);
        return;
      }
      setResults(mapDealsForUI(data as DealWithRelations[]));
    } catch {
      setLoading(false);
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      router.push(`/deals/${results[selectedIndex].id}`);
      setOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search deals..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-9 w-[220px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          aria-label="Search deals"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground/40">
          ⌘K
        </kbd>
      </div>
      {open && (query.trim() || results.length > 0) && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-[320px] rounded-lg border border-border bg-card shadow-lg"
          role="listbox"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {query.trim() ? "No results" : "Type to search"}
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto py-1">
              {results.map((deal, i) => (
                <li key={deal.id}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/deals/${deal.id}`);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors",
                      i === selectedIndex
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/60",
                    )}
                    role="option"
                    aria-selected={i === selectedIndex}
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {deal.customerName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {deal.dealNumber} · {deal.address}, {deal.city}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
