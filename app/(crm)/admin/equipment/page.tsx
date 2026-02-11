"use client"

import { cn } from "@/lib/utils"
import { Cpu, Sun, Zap, Battery, Plus, CheckCircle2, XCircle } from "lucide-react"

interface Equipment {
  id: string
  name: string
  type: "panel" | "inverter" | "battery" | "optimizer"
  manufacturer: string
  wattage: number | null
  active: boolean
  notes: string
}

const EQUIPMENT: Equipment[] = [
  { id: "e1", name: "REC Alpha Pure-R 430W", type: "panel", manufacturer: "REC", wattage: 430, active: true, notes: "Preferred panel, best warranty" },
  { id: "e2", name: "Qcells Q.PEAK DUO BLK ML-G11+ 420W", type: "panel", manufacturer: "Qcells", wattage: 420, active: true, notes: "Budget option, good availability" },
  { id: "e3", name: "Silfab SIL-410-BG 410W", type: "panel", manufacturer: "Silfab", wattage: 410, active: true, notes: "US manufactured" },
  { id: "e4", name: "Enphase IQ8M Microinverter", type: "inverter", manufacturer: "Enphase", wattage: 330, active: true, notes: "Default for < 12kW systems" },
  { id: "e5", name: "Enphase IQ8A Microinverter", type: "inverter", manufacturer: "Enphase", wattage: 366, active: true, notes: "For larger panels / high production" },
  { id: "e6", name: "SolarEdge SE7600H-US", type: "inverter", manufacturer: "SolarEdge", wattage: 7600, active: true, notes: "String inverter option" },
  { id: "e7", name: "Tesla Powerwall 3", type: "battery", manufacturer: "Tesla", wattage: 13500, active: true, notes: "13.5 kWh usable" },
  { id: "e8", name: "Enphase IQ Battery 5P", type: "battery", manufacturer: "Enphase", wattage: 5000, active: true, notes: "5 kWh, stackable" },
  { id: "e9", name: "SolarEdge P505 Optimizer", type: "optimizer", manufacturer: "SolarEdge", wattage: 505, active: false, notes: "Only for SolarEdge systems" },
]

const typeConfig = {
  panel: { icon: Sun, label: "Panel", color: "text-chart-1 bg-chart-1/10" },
  inverter: { icon: Zap, label: "Inverter", color: "text-primary bg-primary/10" },
  battery: { icon: Battery, label: "Battery", color: "text-success bg-success/10" },
  optimizer: { icon: Cpu, label: "Optimizer", color: "text-chart-4 bg-chart-4/10" },
}

export default function AdminEquipmentPage() {
  const types = ["panel", "inverter", "battery", "optimizer"] as const

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage panels, inverters, batteries, and other equipment.</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Equipment
        </button>
      </div>

      {types.map((type) => {
        const config = typeConfig[type]
        const items = EQUIPMENT.filter((e) => e.type === type)
        const Icon = config.icon

        return (
          <div key={type} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", config.color.split(" ")[0])} />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {config.label}s ({items.length})
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
                    !item.active && "opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.manufacturer}</p>
                      </div>
                    </div>
                    {item.active ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    {item.wattage && (
                      <div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="text-sm font-semibold font-mono text-foreground">
                          {item.wattage >= 1000 ? `${(item.wattage / 1000).toFixed(1)} kW` : `${item.wattage}W`}
                        </p>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-xs text-foreground leading-relaxed">{item.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
