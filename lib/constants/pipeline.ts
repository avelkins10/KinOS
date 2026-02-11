// lib/constants/pipeline.ts
// Pipeline stage definitions — matches blueprint §9 exactly
// 19 stages: 17 forward + cancelled + lost

export type DealStage =
  | "new_lead"
  | "appointment_set"
  | "appointment_sat"
  | "design_requested"
  | "design_complete"
  | "proposal_sent"
  | "proposal_accepted"
  | "financing_applied"
  | "financing_approved"
  | "stips_pending"
  | "stips_cleared"
  | "contract_sent"
  | "contract_signed"
  | "submission_ready"
  | "submitted"
  | "intake_approved"
  | "intake_rejected"
  | "cancelled"
  | "lost";

// Display labels
export const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "New Lead",
  appointment_set: "Appointment Set",
  appointment_sat: "Appointment Sat",
  design_requested: "Design Requested",
  design_complete: "Design Complete",
  proposal_sent: "Proposal Sent",
  proposal_accepted: "Proposal Accepted",
  financing_applied: "Financing Applied",
  financing_approved: "Financing Approved",
  stips_pending: "Stips Pending",
  stips_cleared: "Stips Cleared",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  submission_ready: "Submission Ready",
  submitted: "Submitted",
  intake_approved: "Approved",
  intake_rejected: "Rejected",
  cancelled: "Cancelled",
  lost: "Lost",
};

// Stage colors for badges and Kanban columns
export const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: "bg-slate-100 text-slate-700 border-slate-300",
  appointment_set: "bg-blue-100 text-blue-700 border-blue-300",
  appointment_sat: "bg-blue-200 text-blue-800 border-blue-400",
  design_requested: "bg-purple-100 text-purple-700 border-purple-300",
  design_complete: "bg-purple-200 text-purple-800 border-purple-400",
  proposal_sent: "bg-indigo-100 text-indigo-700 border-indigo-300",
  proposal_accepted: "bg-indigo-200 text-indigo-800 border-indigo-400",
  financing_applied: "bg-amber-100 text-amber-700 border-amber-300",
  financing_approved: "bg-amber-200 text-amber-800 border-amber-400",
  stips_pending: "bg-orange-100 text-orange-700 border-orange-300",
  stips_cleared: "bg-orange-200 text-orange-800 border-orange-400",
  contract_sent: "bg-cyan-100 text-cyan-700 border-cyan-300",
  contract_signed: "bg-cyan-200 text-cyan-800 border-cyan-400",
  submission_ready: "bg-teal-100 text-teal-700 border-teal-300",
  submitted: "bg-emerald-100 text-emerald-700 border-emerald-300",
  intake_approved: "bg-green-200 text-green-800 border-green-400",
  intake_rejected: "bg-red-100 text-red-700 border-red-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
  lost: "bg-red-50 text-red-600 border-red-200",
};

// Dot colors for Kanban column indicators (single bg class per stage)
export const STAGE_DOT_COLORS: Record<DealStage, string> = {
  new_lead: "bg-slate-400",
  appointment_set: "bg-blue-500",
  appointment_sat: "bg-blue-600",
  design_requested: "bg-purple-500",
  design_complete: "bg-purple-600",
  proposal_sent: "bg-indigo-500",
  proposal_accepted: "bg-indigo-600",
  financing_applied: "bg-amber-500",
  financing_approved: "bg-amber-600",
  stips_pending: "bg-orange-500",
  stips_cleared: "bg-orange-600",
  contract_sent: "bg-cyan-500",
  contract_signed: "bg-cyan-600",
  submission_ready: "bg-teal-500",
  submitted: "bg-emerald-500",
  intake_approved: "bg-green-600",
  intake_rejected: "bg-red-500",
  cancelled: "bg-gray-400",
  lost: "bg-red-400",
};

// Ordered stages for pipeline display (excludes terminal states)
export const STAGE_ORDER: DealStage[] = [
  "new_lead",
  "appointment_set",
  "appointment_sat",
  "design_requested",
  "design_complete",
  "proposal_sent",
  "proposal_accepted",
  "financing_applied",
  "financing_approved",
  "stips_pending",
  "stips_cleared",
  "contract_sent",
  "contract_signed",
  "submission_ready",
  "submitted",
  "intake_approved",
  "intake_rejected",
];

// All stages including terminal
export const ALL_STAGES: DealStage[] = [...STAGE_ORDER, "cancelled", "lost"];

// Stage categories for filtering and grouping
export const STAGE_CATEGORIES: Record<string, DealStage[]> = {
  Lead: ["new_lead", "appointment_set", "appointment_sat"],
  Design: ["design_requested", "design_complete"],
  Proposal: ["proposal_sent", "proposal_accepted"],
  Financing: [
    "financing_applied",
    "financing_approved",
    "stips_pending",
    "stips_cleared",
  ],
  Contract: ["contract_sent", "contract_signed"],
  Submission: [
    "submission_ready",
    "submitted",
    "intake_approved",
    "intake_rejected",
  ],
  Closed: ["cancelled", "lost"],
};

// Reverse lookup: stage → category
export const STAGE_TO_CATEGORY: Record<DealStage, string> = Object.entries(
  STAGE_CATEGORIES,
).reduce(
  (acc, [category, stages]) => {
    stages.forEach((stage) => {
      acc[stage] = category;
    });
    return acc;
  },
  {} as Record<DealStage, string>,
);

// Active pipeline stages (not terminal)
export const ACTIVE_STAGES: DealStage[] = STAGE_ORDER.filter(
  (s) => s !== "intake_approved" && s !== "intake_rejected",
);

// Terminal stages
export const TERMINAL_STAGES: DealStage[] = [
  "intake_approved",
  "cancelled",
  "lost",
];

// Stages that show in Kanban view (active pipeline only)
export const KANBAN_STAGES: DealStage[] = ACTIVE_STAGES;

// Stage index for ordering
export const STAGE_INDEX: Record<DealStage, number> = ALL_STAGES.reduce(
  (acc, stage, idx) => {
    acc[stage] = idx;
    return acc;
  },
  {} as Record<DealStage, number>,
);
