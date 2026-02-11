// Stage transition validation — allowed next stages per current stage

import type { DealStage } from "@/lib/constants/pipeline";

/** Allowed next stages from each current stage (no skipping; cancelled/on_hold from any active) */
export const ALLOWED_TRANSITIONS: Record<DealStage, DealStage[]> = {
  new_lead: ["appointment_set", "cancelled", "on_hold"],
  appointment_set: ["appointment_completed", "cancelled", "on_hold"],
  appointment_completed: ["design_requested", "cancelled", "on_hold"],
  design_requested: [
    "design_in_progress",
    "design_complete",
    "cancelled",
    "on_hold",
  ],
  design_in_progress: ["design_complete", "cancelled", "on_hold"],
  design_complete: ["proposal", "cancelled", "on_hold"],
  proposal: ["financing", "cancelled", "on_hold"],
  financing: ["contracting", "cancelled", "on_hold"],
  contracting: ["pre_intake", "cancelled", "on_hold"],
  pre_intake: ["install_scheduled", "cancelled", "on_hold"],
  install_scheduled: ["install_in_progress", "cancelled", "on_hold"],
  install_in_progress: ["install_complete", "cancelled", "on_hold"],
  install_complete: ["inspection", "cancelled", "on_hold"],
  inspection: ["pto", "cancelled", "on_hold"],
  pto: [],
  cancelled: [],
  on_hold: [
    "new_lead",
    "appointment_set",
    "design_requested",
    "proposal",
    "financing",
    "contracting",
    "pre_intake",
  ],
};

export function isValidTransition(from: DealStage, to: DealStage): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed != null && allowed.includes(to);
}

export function getNextAllowedStages(current: DealStage): DealStage[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}
