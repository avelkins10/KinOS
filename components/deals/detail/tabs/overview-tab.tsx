"use client"

import type { Deal } from "@/lib/mock-data"
import { RECENT_ACTIVITY } from "@/lib/mock-data"
import { Phone, Mail, MapPin, Building2, Zap, Sun, Cpu as CpuIcon } from "lucide-react"

export function OverviewTab({ deal }: { deal: Deal }) {
  const dealActivity = RECENT_ACTIVITY.filter((a) => a.dealId === deal.id).slice(0, 4)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Contact Info */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Contact Information
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">{deal.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{deal.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium text-foreground">{deal.address}, {deal.city}, {deal.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utility Account</p>
              <p className="text-sm font-medium text-foreground">{deal.utilityAccount || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Details */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System Details
        </h4>
        {deal.systemSize ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">System Size</p>
                <p className="text-sm font-medium text-foreground">{deal.systemSize} kW</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Panels</p>
                <p className="text-sm font-medium text-foreground">{deal.panelCount} x {deal.panelBrand}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CpuIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inverter</p>
                <p className="text-sm font-medium text-foreground">{deal.inverterBrand}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted/50 p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">Annual Production</p>
                <p className="text-sm font-bold text-foreground">{deal.annualProduction ? `${(deal.annualProduction / 1000).toFixed(1)} MWh` : "--"}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">Offset</p>
                <p className="text-sm font-bold text-foreground">{deal.offset ? `${deal.offset}%` : "--"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No design yet</p>
            <p className="mt-1 text-xs text-muted-foreground">System details will appear after design</p>
            <button type="button" className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Create Aurora Project
            </button>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="rounded-lg border border-border p-4 lg:col-span-2">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing Summary
        </h4>
        {deal.dealValue > 0 ? (
          <div className="space-y-1.5">
            {[
              { label: "Base System", value: deal.dealValue * 0.97, perWatt: deal.systemSize ? (deal.dealValue * 0.97) / (deal.systemSize * 1000) : 0 },
              { label: "Equipment Adders", value: 0, perWatt: 0 },
              { label: "Adders", value: deal.dealValue * 0.03, perWatt: deal.systemSize ? (deal.dealValue * 0.03) / (deal.systemSize * 1000) : 0 },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-border/50" : ""}`}>
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-4">
                  {row.perWatt > 0 && (
                    <span className="text-xs text-muted-foreground/60">${row.perWatt.toFixed(2)}/W</span>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    ${row.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t-2 border-border py-3">
              <span className="text-sm font-bold text-foreground">Net Cost</span>
              <span className="text-lg font-bold text-foreground">
                ${deal.dealValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {deal.monthlyPayment && (
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
                <span className="text-sm font-medium text-primary">Monthly Payment</span>
                <span className="text-xl font-bold text-primary">${deal.monthlyPayment.toFixed(2)}/mo</span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Pricing will be calculated after design and proposal
          </p>
        )}
      </div>

      {/* Activity Feed */}
      {dealActivity.length > 0 && (
        <div className="rounded-lg border border-border p-4 lg:col-span-2">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h4>
          <div className="space-y-2">
            {dealActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/30 transition-colors">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.user} {"·"} {item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
