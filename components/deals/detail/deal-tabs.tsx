"use client"

import { useState } from "react"
import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { OverviewTab } from "./tabs/overview-tab"
import { ProposalsTab } from "./tabs/proposals-tab"
import { FinancingTab } from "./tabs/financing-tab"
import { DocumentsTab } from "./tabs/documents-tab"
import { SubmissionTab } from "./tabs/submission-tab"
import { ActivityTab } from "./tabs/activity-tab"
import { FilesTab } from "./tabs/files-tab"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "design", label: "Design" },
  { id: "proposals", label: "Proposals" },
  { id: "financing", label: "Financing" },
  { id: "documents", label: "Documents" },
  { id: "submission", label: "Submission" },
  { id: "activity", label: "Activity" },
  { id: "files", label: "Files" },
] as const

type TabId = (typeof tabs)[number]["id"]

export function DealTabs({ deal }: { deal: Deal }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  return (
    <div>
      {/* Tab Bar */}
      <div className="relative border-b border-border">
        <div className="flex gap-1 overflow-x-auto px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5 animate-slide-in" key={activeTab}>
        {activeTab === "overview" && <OverviewTab deal={deal} />}
        {activeTab === "design" && <DesignTabPlaceholder deal={deal} />}
        {activeTab === "proposals" && <ProposalsTab deal={deal} />}
        {activeTab === "financing" && <FinancingTab deal={deal} />}
        {activeTab === "documents" && <DocumentsTab deal={deal} />}
        {activeTab === "submission" && <SubmissionTab deal={deal} />}
        {activeTab === "activity" && <ActivityTab deal={deal} />}
        {activeTab === "files" && <FilesTab deal={deal} />}
      </div>
    </div>
  )
}

function DesignTabPlaceholder({ deal }: { deal: Deal }) {
  if (!deal.systemSize) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">No design yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an Aurora project to start the design process.
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Create Aurora Project
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Size</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{deal.systemSize} kW</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Panel Count</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{deal.panelCount ?? "--"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annual Production</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{deal.annualProduction ? `${(deal.annualProduction / 1000).toFixed(1)} MWh` : "--"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offset</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{deal.offset ? `${deal.offset}%` : "--"}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Equipment</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Panels</p>
            <p className="text-sm font-medium text-foreground">{deal.panelBrand ?? "--"}</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Inverter</p>
            <p className="text-sm font-medium text-foreground">{deal.inverterBrand ?? "--"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
