// ============================================
// KinOS Pipeline Stage Definitions (17 stages)
// ============================================

export type DealStage =
  | "new_lead"
  | "appointment_set"
  | "appointment_completed"
  | "design_requested"
  | "design_in_progress"
  | "design_complete"
  | "proposal"
  | "financing"
  | "contracting"
  | "pre_intake"
  | "install_scheduled"
  | "install_in_progress"
  | "install_complete"
  | "inspection"
  | "pto"
  | "cancelled"
  | "on_hold";

export const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "New Lead",
  appointment_set: "Appointment Set",
  appointment_completed: "Appointment Completed",
  design_requested: "Design Requested",
  design_in_progress: "Design In Progress",
  design_complete: "Design Complete",
  proposal: "Proposal",
  financing: "Financing",
  contracting: "Contracting",
  pre_intake: "Pre-Intake",
  install_scheduled: "Install Scheduled",
  install_in_progress: "Install In Progress",
  install_complete: "Install Complete",
  inspection: "Inspection",
  pto: "PTO",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

export const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  appointment_set: "bg-primary/15 text-primary border-primary/25",
  appointment_completed: "bg-primary/15 text-primary border-primary/25",
  design_requested: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  design_in_progress: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  design_complete: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  proposal: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  financing: "bg-warning/15 text-warning border-warning/25",
  contracting: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  pre_intake: "bg-accent/15 text-accent border-accent/25",
  install_scheduled: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  install_in_progress: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  install_complete: "bg-success/15 text-success border-success/25",
  inspection: "bg-success/15 text-success border-success/25",
  pto: "bg-success/15 text-success border-success/25",
  cancelled: "bg-destructive/15 text-destructive border-destructive/25",
  on_hold: "bg-muted text-muted-foreground border-border",
};

/** Kanban column order (active pipeline stages first, then inactive) */
export const STAGE_ORDER: DealStage[] = [
  "new_lead",
  "appointment_set",
  "appointment_completed",
  "design_requested",
  "design_in_progress",
  "design_complete",
  "proposal",
  "financing",
  "contracting",
  "pre_intake",
  "install_scheduled",
  "install_in_progress",
  "install_complete",
  "inspection",
  "pto",
  "cancelled",
  "on_hold",
];

export type StageCategory = "active" | "completed" | "inactive";

export const STAGE_CATEGORIES: Record<DealStage, StageCategory> = {
  new_lead: "active",
  appointment_set: "active",
  appointment_completed: "active",
  design_requested: "active",
  design_in_progress: "active",
  design_complete: "active",
  proposal: "active",
  financing: "active",
  contracting: "active",
  pre_intake: "active",
  install_scheduled: "active",
  install_in_progress: "active",
  install_complete: "active",
  inspection: "active",
  pto: "completed",
  cancelled: "inactive",
  on_hold: "inactive",
};

export {
  isValidTransition,
  getNextAllowedStages,
} from "@/lib/utils/stage-validation";
