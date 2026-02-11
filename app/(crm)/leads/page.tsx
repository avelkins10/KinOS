"use client"

import { useState } from "react"
import { DEALS, STAGE_LABELS, STAGE_COLORS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Search, Filter, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react"

const earlyStages = ["new_lead", "appointment_set", "appointment_completed"] as const

export default function LeadsPage() {
  const [search, setSearch] = useState("")
  const leads = DEALS.filter(
    (d) => earlyStages.includes(d.stage as (typeof earlyStages)[number])
  ).filter(
    (d) =>
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} active leads in early pipeline stages.
          </p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/deals/${lead.id}`}
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-foreground">{lead.customerName}</h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{lead.address}, {lead.city}, {lead.state}</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STAGE_COLORS[lead.stage])}>
                {STAGE_LABELS[lead.stage]}
              </span>
              <span className="text-xs text-muted-foreground">{lead.daysInPipeline}d ago</span>
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
              <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </a>
              <div className="h-3 w-px bg-border" />
              <span className="text-xs text-muted-foreground">
                Setter: {lead.setter.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
