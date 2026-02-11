"use client"

import React from "react"

import type { Deal } from "@/lib/mock-data"
import { Zap, Building2, DollarSign, BarChart3 } from "lucide-react"

function DataField({
  label,
  value,
  icon: Icon,
  unit,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  unit?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

export function ConsumptionStep({ deal }: { deal: Deal }) {
  const hasData = !!deal.utilityAccount
  const mockBill = 245
  const mockKwh = deal.annualProduction ? Math.round(deal.annualProduction * 0.95) : 14400

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Consumption</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the customer{"'"}s monthly electric bill, annual kWh usage, and utility company.
        </p>
      </div>

      {/* Utility Info */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Utility Information
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <DataField
            icon={Building2}
            label="Utility Company"
            value={deal.utilityAccount ? deal.utilityAccount.split("-")[0] : "Not set"}
          />
          <DataField
            icon={BarChart3}
            label="Utility Account"
            value={deal.utilityAccount || "Not set"}
          />
        </div>
      </div>

      {/* Consumption Data */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Usage Data
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <DataField icon={DollarSign} label="Monthly Bill" value={hasData ? `$${mockBill}` : "--"} unit="/mo" />
          <DataField icon={Zap} label="Annual kWh" value={hasData ? mockKwh.toLocaleString() : "--"} unit="kWh" />
          <DataField icon={BarChart3} label="Avg Monthly kWh" value={hasData ? Math.round(mockKwh / 12).toLocaleString() : "--"} unit="kWh" />
        </div>
      </div>

      {/* Usage Breakdown - mock table */}
      {hasData && (
        <div className="rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Usage Breakdown
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>kWh</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, idx) => {
                  const seasonal = [0.7, 0.7, 0.85, 0.95, 1.2, 1.4, 1.5, 1.5, 1.3, 1.0, 0.8, 0.7]
                  const kwh = Math.round((mockKwh / 12) * seasonal[idx])
                  const cost = Math.round(kwh * 0.15)
                  return (
                    <tr key={month}>
                      <td className="text-sm font-medium text-foreground">{month} 2025</td>
                      <td className="text-sm text-foreground">{kwh.toLocaleString()}</td>
                      <td className="text-sm text-foreground">${cost}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
        >
          Save Consumption Data
        </button>
      </div>
    </div>
  )
}
