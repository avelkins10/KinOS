"use client";

// TODO: Replace mock data with real Supabase query
import { FINANCING_ALERTS } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const urgencyConfig = {
  high: {
    icon: AlertTriangle,
    color: "text-destructive bg-destructive/10 border-destructive/20",
  },
  medium: {
    icon: Clock,
    color: "text-warning bg-warning/10 border-warning/20",
  },
  low: {
    icon: CheckCircle,
    color: "text-success bg-success/10 border-success/20",
  },
};

export function FinancingAlerts() {
  const highCount = FINANCING_ALERTS.filter((a) => a.urgency === "high").length;
  return (
    <div className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="section-title">Financing Alerts</h3>
        {highCount > 0 && (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
            style={{
              backgroundColor: "rgba(239,68,68,0.12)",
              color: "#ef4444",
            }}
          >
            {highCount}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {FINANCING_ALERTS.map((alert) => {
          const config = urgencyConfig[alert.urgency];
          const Icon = config.icon;
          return (
            <a
              key={alert.id}
              href={`/deals/${alert.dealId}`}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:shadow-sm",
                config.color,
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {alert.customerName}
                </p>
                <p className="mt-0.5 text-xs opacity-70">
                  {alert.lender} {"·"} {alert.status}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium opacity-60">
                {alert.detail}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
