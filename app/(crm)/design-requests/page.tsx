"use client"

import { DEALS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { PenTool, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react"

interface DesignRequest {
  id: string
  dealId: string
  customer: string
  address: string
  status: "pending" | "in_progress" | "completed" | "revision"
  requestedAt: string
  assignedTo: string
  systemSize: number | null
  notes: string
}

const DESIGN_REQUESTS: DesignRequest[] = [
  { id: "dr1", dealId: "d1", customer: "Robert Martinez", address: "4521 E Cactus Rd, Phoenix, AZ", status: "in_progress", requestedAt: "Feb 7, 2026", assignedTo: "Design Team", systemSize: 10.66, notes: "Standard roof, no obstructions" },
  { id: "dr2", dealId: "d8", customer: "Karen & Bill Foster", address: "7714 S Dixie Hwy, West Palm Beach, FL", status: "completed", requestedAt: "Feb 3, 2026", assignedTo: "Design Team", systemSize: 15.8, notes: "Tile roof, need tilt racks on flat section" },
  { id: "dr3", dealId: "d12", customer: "Elizabeth Taylor", address: "3320 N Central Ave, Phoenix, AZ", status: "in_progress", requestedAt: "Feb 5, 2026", assignedTo: "Design Team", systemSize: 11.2, notes: "Two-story, panels on south-facing only" },
  { id: "dr4", dealId: "d9", customer: "Michael Scott", address: "12450 W Indian School Rd, Avondale, AZ", status: "pending", requestedAt: "Feb 9, 2026", assignedTo: "Unassigned", systemSize: null, notes: "Waiting on site survey photos" },
]

const statusConfig = {
  pending: { label: "Pending", icon: Clock, classes: "bg-warning/15 text-warning border-warning/25" },
  in_progress: { label: "In Progress", icon: PenTool, classes: "bg-primary/15 text-primary border-primary/25" },
  completed: { label: "Completed", icon: CheckCircle2, classes: "bg-success/15 text-success border-success/25" },
  revision: { label: "Revision Needed", icon: AlertCircle, classes: "bg-destructive/15 text-destructive border-destructive/25" },
}

export default function DesignRequestsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Design Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track Aurora design requests and their status.
        </p>
      </div>

      {/* Status summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {(["pending", "in_progress", "completed", "revision"] as const).map((status) => {
          const config = statusConfig[status]
          const Icon = config.icon
          const count = DESIGN_REQUESTS.filter((r) => r.status === status).length
          return (
            <div key={status} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.classes.split(" ").slice(0, 2).join(" "))}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {DESIGN_REQUESTS.map((request) => {
          const config = statusConfig[request.status]
          const Icon = config.icon
          return (
            <a
              key={request.id}
              href={`/deals/${request.dealId}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", config.classes.split(" ").slice(0, 2).join(" "))}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{request.customer}</h3>
                    <p className="text-xs text-muted-foreground">{request.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.classes)}>
                      {config.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Requested: {request.requestedAt}</span>
                  <span>Assigned: {request.assignedTo}</span>
                  {request.systemSize && <span>{request.systemSize} kW</span>}
                </div>
                {request.notes && (
                  <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">{request.notes}</p>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
