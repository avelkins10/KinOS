"use client";

import { AlertTriangle, CheckCircle, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/actions/dashboard";

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

export function FinancingAlerts({
  alerts = [],
}: {
  alerts?: DashboardStats["financingAlerts"];
}) {
  const highCount = alerts.filter((a) => a.urgency === "high").length;

  if (alerts.length === 0) {
    return (
      <div className="card-premium p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="section-title">Financing Alerts</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CreditCard className="mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No pending financing actions
          </p>
        </div>
      </div>
    );
  }

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
        {alerts.map((alert, idx) => {
          const urgency = alert.urgency as keyof typeof urgencyConfig;
          const config = urgencyConfig[urgency] ?? urgencyConfig.medium;
          const Icon = config.icon;
          return (
            <a
              key={`${alert.dealId}-${idx}`}
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
                  {alert.lender} {"·"}{" "}
                  {alert.status.replace(/_/g, " ")}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
