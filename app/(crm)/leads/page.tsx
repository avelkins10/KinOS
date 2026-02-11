"use client"

import { useState } from "react"
import { DEALS, STAGE_LABELS, STAGE_COLORS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Search, Phone, MapPin, ArrowUpRight, List, LayoutGrid } from "lucide-react"

const earlyStages = ["new_lead", "appointment_set", "appointment_completed"] as const
type ViewMode = "list" | "grid"

export default function LeadsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState<ViewMode>("list")
  const leads = DEALS.filter(
    (d) => earlyStages.includes(d.stage as (typeof earlyStages)[number])
  ).filter(
    (d) =>
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-header text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} active leads in early pipeline stages.
          </p>
        </div>
        <div
          className="flex items-center rounded-xl p-1"
          style={{
            backgroundColor: "hsl(216 18% 94%)",
            border: "1px solid hsl(216 16% 90%)",
          }}
        >
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              view === "list"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              view === "grid"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {view === "list" ? (
        <div className="card-premium overflow-hidden">
          <table className="table-premium">
            <thead>
              <tr>
                <th className="px-4">Name</th>
                <th className="px-4">Location</th>
                <th className="px-4">Stage</th>
                <th className="px-4">Phone</th>
                <th className="px-4">Setter</th>
                <th className="px-4">Age</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <a href={`/deals/${lead.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                      {lead.customerName}
                    </a>
                  </td>
                  <td className="text-muted-foreground">
                    {lead.city}, {lead.state}
                  </td>
                  <td>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold", STAGE_COLORS[lead.stage])}>
                      {STAGE_LABELS[lead.stage]}
                    </span>
                  </td>
                  <td className="text-muted-foreground font-mono text-xs">{lead.phone}</td>
                  <td className="text-muted-foreground">{lead.setter.name}</td>
                  <td className="text-muted-foreground font-medium">{lead.daysInPipeline}d</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">No leads found.</div>
          )}
        </div>
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <a
              key={lead.id}
              href={`/deals/${lead.id}`}
              className="card-premium group p-5"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-foreground">{lead.customerName}</h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{lead.address}, {lead.city}, {lead.state}</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold", STAGE_COLORS[lead.stage])}>
                  {STAGE_LABELS[lead.stage]}
                </span>
                <span className="text-xs text-muted-foreground">{lead.daysInPipeline}d ago</span>
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
                <div className="h-3 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  Setter: {lead.setter.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
