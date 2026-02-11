"use client"

import { useState, useMemo } from "react"
import { DEALS, OFFICES, LENDERS, SOURCES, REPS, STAGE_LABELS, type DealStage } from "@/lib/mock-data"
import { KanbanView } from "@/components/deals/kanban-view"
import { ListView } from "@/components/deals/list-view"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  X,
} from "lucide-react"

type ViewMode = "kanban" | "list"

export default function DealsPage() {
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterOffice, setFilterOffice] = useState("")
  const [filterCloser, setFilterCloser] = useState("")
  const [filterLender, setFilterLender] = useState("")
  const [filterSource, setFilterSource] = useState("")

  const filteredDeals = useMemo(() => {
    let result = DEALS
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.customerName.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q)
      )
    }
    if (filterOffice) result = result.filter((d) => d.closer.office === filterOffice)
    if (filterCloser) result = result.filter((d) => d.closer.id === filterCloser)
    if (filterLender) result = result.filter((d) => d.lender === filterLender)
    if (filterSource) result = result.filter((d) => d.source === filterSource)
    return result
  }, [search, filterOffice, filterCloser, filterLender, filterSource])

  const activeFilters = [filterOffice, filterCloser, filterLender, filterSource].filter(Boolean).length

  const clearFilters = () => {
    setFilterOffice("")
    setFilterCloser("")
    setFilterLender("")
    setFilterSource("")
  }

  const closers = REPS.filter((r) => r.role === "closer")

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-header text-foreground">Deal Pipeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredDeals.length} deals {"·"} $
              {(filteredDeals.reduce((s, d) => s + d.dealValue, 0) / 1000).toFixed(0)}k
              total value
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-[220px] rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground/40">
                {"⌘K"}
              </kbd>
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                showFilters || activeFilters > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
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

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                  view === "kanban"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* New Deal */}
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
              style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3), 0 1px 2px rgba(14,165,233,0.2)" }}
            >
              <Plus className="h-4 w-4" />
              New Deal
            </button>
          </div>
        </div>

        {/* Filters Row */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 animate-slide-in">
            <select
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Offices</option>
              {OFFICES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select
              value={filterCloser}
              onChange={(e) => setFilterCloser(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Closers</option>
              {closers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterLender}
              onChange={(e) => setFilterLender(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Lenders</option>
              {LENDERS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === "kanban" ? (
          <KanbanView deals={filteredDeals} />
        ) : (
          <ListView deals={filteredDeals} />
        )}
      </div>
    </div>
  )
}
