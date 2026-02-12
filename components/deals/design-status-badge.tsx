"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DesignStatus } from "@/lib/deals-mappers";
import { Clock, Zap, Check, X, Loader2, FileQuestion } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  not_started: {
    label: "Not Started",
    icon: Clock,
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  consumption_entered: {
    label: "Consumption Entered",
    icon: Zap,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  project_created: {
    label: "Project Created",
    icon: Zap,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  design_requested: {
    label: "Design Requested",
    icon: Loader2,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  design_in_progress: {
    label: "In Progress",
    icon: Loader2,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  design_completed: {
    label: "Design Complete",
    icon: Check,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  design_rejected: {
    label: "Design Rejected",
    icon: X,
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  design_accepted: {
    label: "Design Accepted",
    icon: Check,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

export interface DesignStatusBadgeProps {
  status: DesignStatus | string | null | undefined;
  tooltip?: string;
  className?: string;
}

export function DesignStatusBadge({
  status,
  tooltip,
  className,
}: DesignStatusBadgeProps) {
  const key = (status ?? "not_started") as string;
  const config = STATUS_CONFIG[key] ?? {
    label: key.replace(/_/g, " ") || "Unknown",
    icon: FileQuestion,
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  };
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex min-h-[28px] min-w-[44px] items-center gap-1.5 px-2.5 py-1",
        config.className,
        className,
      )}
    >
      {(key === "design_requested" || key === "design_in_progress") && (
        <Icon className="h-3 w-3 animate-spin" aria-hidden />
      )}
      {key !== "design_requested" && key !== "design_in_progress" && (
        <Icon className="h-3 w-3" aria-hidden />
      )}
      <span>{config.label}</span>
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
