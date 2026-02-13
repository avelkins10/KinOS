import type { FinancingStatus } from "@/lib/types/financing";

/** Visual progress steps for the financing tracker */
export const FINANCING_STEPS = [
  "Applied",
  "Approved",
  "Stips Cleared",
  "Funded",
] as const;

/** Map financing application status to progress step index (-1 = not started) */
export function getFinancingProgressIndex(status: string): number {
  switch (status) {
    case "submitted":
    case "pending":
      return 0;
    case "approved":
    case "conditionally_approved":
      return 1;
    case "stips_pending":
      return 1;
    case "stips_cleared":
      return 2;
    case "funded":
      return 3;
    default:
      return -1;
  }
}

export const FINANCING_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  conditionally_approved: "Conditionally Approved",
  stips_pending: "Stips Pending",
  stips_cleared: "Stips Cleared",
  denied: "Denied",
  expired: "Expired",
  cancelled: "Cancelled",
  funded: "Funded",
};

export const FINANCING_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  pending: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success",
  conditionally_approved: "bg-success/10 text-success",
  stips_pending: "bg-warning/10 text-warning",
  stips_cleared: "bg-success/10 text-success",
  denied: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  funded: "bg-success/10 text-success",
};

/** Terminal statuses that cannot transition further */
export const TERMINAL_FINANCING_STATUSES: FinancingStatus[] = [
  "denied",
  "expired",
  "cancelled",
  "funded",
];

/** Valid financing status transitions */
export const VALID_FINANCING_TRANSITIONS: Record<
  FinancingStatus,
  FinancingStatus[]
> = {
  draft: ["submitted", "cancelled"],
  submitted: [
    "pending",
    "approved",
    "conditionally_approved",
    "denied",
    "cancelled",
  ],
  pending: [
    "approved",
    "conditionally_approved",
    "denied",
    "expired",
    "cancelled",
  ],
  approved: ["stips_pending", "stips_cleared", "funded", "cancelled"],
  conditionally_approved: [
    "approved",
    "stips_pending",
    "denied",
    "cancelled",
  ],
  stips_pending: ["stips_cleared", "denied", "cancelled"],
  stips_cleared: ["funded", "cancelled"],
  denied: [],
  expired: [],
  cancelled: [],
  funded: [],
};

/** Check if a financing status transition is valid */
export function isValidFinancingTransition(
  from: FinancingStatus,
  to: FinancingStatus,
): boolean {
  const allowed = VALID_FINANCING_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/** Get allowed next statuses from a given status */
export function getNextFinancingStatuses(
  current: FinancingStatus,
): FinancingStatus[] {
  return VALID_FINANCING_TRANSITIONS[current] ?? [];
}
