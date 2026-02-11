"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Plus,
} from "lucide-react"

interface Gate {
  id: string
  name: string
  description: string
  stage: string
  enabled: boolean
  rules: string[]
  blocksCount: number
}

const GATES: Gate[] = [
  {
    id: "g1",
    name: "Utility Bill Required",
    description: "Customer must upload a utility bill before proceeding past Design.",
    stage: "Design In Progress",
    enabled: true,
    rules: ["Document type 'Utility Bill' exists", "Document is not expired"],
    blocksCount: 2,
  },
  {
    id: "g2",
    name: "Credit Check Passed",
    description: "Customer must pass minimum credit score before financing application.",
    stage: "Financing Applied",
    enabled: true,
    rules: ["Credit score >= 650", "No active bankruptcies"],
    blocksCount: 0,
  },
  {
    id: "g3",
    name: "Site Survey Completed",
    description: "Site survey photos and roof assessment must be completed.",
    stage: "Appointment Completed",
    enabled: true,
    rules: ["Site photos uploaded (min 4)", "Roof condition assessed", "Electrical panel documented"],
    blocksCount: 1,
  },
  {
    id: "g4",
    name: "Manager Approval",
    description: "Deals over $50k require manager sign-off before contract generation.",
    stage: "Contract Signed",
    enabled: true,
    rules: ["Deal value > $50,000 requires approval", "Manager has reviewed deal details"],
    blocksCount: 0,
  },
  {
    id: "g5",
    name: "HOA Approval",
    description: "If property has HOA, approval letter must be uploaded.",
    stage: "Design In Progress",
    enabled: false,
    rules: ["HOA flag set on property", "HOA approval document uploaded"],
    blocksCount: 0,
  },
  {
    id: "g6",
    name: "Permit Package Complete",
    description: "All permit documents must be generated before submission.",
    stage: "Submitted",
    enabled: true,
    rules: ["Engineering stamp present", "Site plan generated", "Single-line diagram included"],
    blocksCount: 3,
  },
]

export default function AdminGatesPage() {
  const [gates, setGates] = useState(GATES)

  const toggleGate = (id: string) => {
    setGates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quality control checkpoints that block deals from advancing until
            requirements are met.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Gate
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {gates.filter((g) => g.enabled).length}
              </p>
              <p className="text-xs text-muted-foreground">Active Gates</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {gates.reduce((acc, g) => acc + g.blocksCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Currently Blocked
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {gates.reduce((acc, g) => acc + g.rules.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Rules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gate List */}
      <div className="space-y-3">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className={cn(
              "rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm",
              !gate.enabled && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {gate.name}
                  </h3>
                  {gate.blocksCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning border border-warning/25">
                      <AlertTriangle className="h-3 w-3" />
                      {gate.blocksCount} blocked
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gate.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                    Stage: {gate.stage}
                  </span>
                </div>

                {/* Rules */}
                <div className="mt-3 space-y-1.5">
                  {gate.rules.map((rule) => (
                    <div
                      key={rule}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleGate(gate.id)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`${gate.enabled ? "Disable" : "Enable"} ${gate.name}`}
              >
                {gate.enabled ? (
                  <ToggleRight className="h-8 w-8 text-primary" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
