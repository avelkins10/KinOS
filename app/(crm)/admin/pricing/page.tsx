"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react"

interface AdderItem {
  id: string
  name: string
  category: string
  pricePerWatt: number
  flatFee: number
  active: boolean
}

const ADDERS: AdderItem[] = [
  { id: "a1", name: "Critter Guard", category: "Protection", pricePerWatt: 0, flatFee: 350, active: true },
  { id: "a2", name: "Ground Mount", category: "Mounting", pricePerWatt: 0.35, flatFee: 0, active: true },
  { id: "a3", name: "Battery (Tesla Powerwall)", category: "Storage", pricePerWatt: 0, flatFee: 12500, active: true },
  { id: "a4", name: "Battery (Enphase IQ5P)", category: "Storage", pricePerWatt: 0, flatFee: 8900, active: true },
  { id: "a5", name: "MPU (Main Panel Upgrade)", category: "Electrical", pricePerWatt: 0, flatFee: 2800, active: true },
  { id: "a6", name: "Sub Panel", category: "Electrical", pricePerWatt: 0, flatFee: 1500, active: true },
  { id: "a7", name: "Tile Roof Surcharge", category: "Roofing", pricePerWatt: 0.15, flatFee: 0, active: true },
  { id: "a8", name: "Flat Roof Tilt Rack", category: "Mounting", pricePerWatt: 0.25, flatFee: 0, active: true },
  { id: "a9", name: "EV Charger Install", category: "EV", pricePerWatt: 0, flatFee: 1800, active: false },
  { id: "a10", name: "Tree Trimming", category: "Site Work", pricePerWatt: 0, flatFee: 500, active: true },
]

export default function AdminPricingPage() {
  const categories = [...new Set(ADDERS.map((a) => a.category))]
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all" ? ADDERS : ADDERS.filter((a) => a.category === filter)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pricing & Adders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure add-on products and pricing adjustments.</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Adder
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-all",
            filter === "all" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-all",
              filter === cat ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adder</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">$/Watt</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flat Fee</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((adder) => (
              <tr key={adder.id} className={cn("transition-colors hover:bg-muted/30", !adder.active && "opacity-50")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{adder.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground">{adder.category}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-mono font-medium text-foreground">
                    {adder.pricePerWatt > 0 ? `$${adder.pricePerWatt.toFixed(2)}` : "--"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-mono font-medium text-foreground">
                    {adder.flatFee > 0 ? `$${adder.flatFee.toLocaleString()}` : "--"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                    adder.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {adder.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${adder.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${adder.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
