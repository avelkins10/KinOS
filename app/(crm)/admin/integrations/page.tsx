"use client"

import { cn } from "@/lib/utils"
import {
  Plug,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  status: "connected" | "disconnected" | "error"
  lastSync?: string
  icon: string
}

const INTEGRATIONS: Integration[] = [
  { id: "i1", name: "Aurora Solar", description: "Design automation and proposal generation", category: "Design", status: "connected", lastSync: "2 min ago", icon: "A" },
  { id: "i2", name: "GoodLeap API", description: "Financing application submission and status tracking", category: "Financing", status: "connected", lastSync: "5 min ago", icon: "G" },
  { id: "i3", name: "LightReach API", description: "PPA pricing and contract generation", category: "Financing", status: "connected", lastSync: "12 min ago", icon: "L" },
  { id: "i4", name: "Mosaic API", description: "Loan application and approval tracking", category: "Financing", status: "connected", lastSync: "8 min ago", icon: "M" },
  { id: "i5", name: "DocuSign", description: "Electronic document signing and tracking", category: "Documents", status: "connected", lastSync: "1 hour ago", icon: "D" },
  { id: "i6", name: "Google Calendar", description: "Appointment scheduling and sync", category: "Calendar", status: "connected", lastSync: "Real-time", icon: "G" },
  { id: "i7", name: "Zapier", description: "Workflow automation and third-party connections", category: "Automation", status: "error", lastSync: "Failed 2 hours ago", icon: "Z" },
  { id: "i8", name: "Slack", description: "Team notifications and deal alerts", category: "Communication", status: "disconnected", icon: "S" },
  { id: "i9", name: "QuickBooks", description: "Accounting and commission tracking", category: "Finance", status: "disconnected", icon: "Q" },
  { id: "i10", name: "Salesforce", description: "Legacy CRM data sync (optional)", category: "CRM", status: "disconnected", icon: "S" },
]

const statusConfig = {
  connected: {
    label: "Connected",
    icon: CheckCircle2,
    classes: "text-success bg-success/10",
  },
  disconnected: {
    label: "Not Connected",
    icon: XCircle,
    classes: "text-muted-foreground bg-muted",
  },
  error: {
    label: "Error",
    icon: AlertTriangle,
    classes: "text-warning bg-warning/10",
  },
}

export default function AdminIntegrationsPage() {
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]
  const connectedCount = INTEGRATIONS.filter(
    (i) => i.status === "connected"
  ).length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {connectedCount} of {INTEGRATIONS.length} integrations connected.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Sync All
        </button>
      </div>

      {/* Integrations by Category */}
      {categories.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category)
        return (
          <div key={category} className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => {
                const config = statusConfig[integration.status]
                const StatusIcon = config.icon
                return (
                  <div
                    key={integration.id}
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {integration.name}
                          </h3>
                          <span
                            className={cn(
                              "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              config.classes
                            )}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {config.label}
                          </span>
                        </div>
                      </div>
                      {integration.status === "connected" && (
                        <button
                          type="button"
                          className="rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-foreground"
                          aria-label={`Settings for ${integration.name}`}
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                      {integration.description}
                    </p>

                    {integration.lastSync && (
                      <p className="mt-3 text-[10px] text-muted-foreground/60">
                        Last sync: {integration.lastSync}
                      </p>
                    )}

                    {integration.status === "disconnected" && (
                      <button
                        type="button"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        <Plug className="h-3 w-3" />
                        Connect
                      </button>
                    )}

                    {integration.status === "error" && (
                      <button
                        type="button"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-warning/15 px-3 py-2 text-xs font-semibold text-warning transition-colors hover:bg-warning/25"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry Connection
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
