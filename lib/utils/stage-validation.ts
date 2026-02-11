// lib/utils/stage-validation.ts
// Stage transition rules — matches blueprint §9.1 exactly

import { DealStage } from '@/lib/constants/pipeline';

// Allowed transitions from each stage
// Blueprint §9.1: Deal Lifecycle State Machine
export const ALLOWED_TRANSITIONS: Record<DealStage, DealStage[]> = {
  new_lead: ['appointment_set', 'cancelled', 'lost'],
  appointment_set: ['appointment_sat', 'cancelled', 'lost'],
  appointment_sat: ['design_requested', 'cancelled', 'lost'],
  design_requested: ['design_complete', 'cancelled', 'lost'],
  design_complete: ['proposal_sent', 'design_requested', 'cancelled', 'lost'],
  proposal_sent: ['proposal_accepted', 'design_requested', 'cancelled', 'lost'],
  proposal_accepted: ['financing_applied', 'cancelled', 'lost'],
  financing_applied: ['financing_approved', 'stips_pending', 'cancelled', 'lost'],
  financing_approved: ['stips_pending', 'contract_sent', 'cancelled', 'lost'],
  stips_pending: ['stips_cleared', 'cancelled', 'lost'],
  stips_cleared: ['contract_sent', 'cancelled', 'lost'],
  contract_sent: ['contract_signed', 'cancelled', 'lost'],
  contract_signed: ['submission_ready', 'cancelled'],
  submission_ready: ['submitted', 'cancelled'],
  submitted: ['intake_approved', 'intake_rejected'],
  intake_rejected: ['submission_ready', 'cancelled'],
  intake_approved: [], // Terminal — deal lives in Quickbase now
  cancelled: [],       // Terminal (admin can reopen via direct DB if needed)
  lost: ['appointment_set'], // Can revive lost deals
};

/**
 * Check if a stage transition is valid
 */
export function isValidTransition(
  fromStage: DealStage,
  toStage: DealStage
): boolean {
  const allowed = ALLOWED_TRANSITIONS[fromStage];
  if (!allowed) return false;
  return allowed.includes(toStage);
}

/**
 * Get list of stages a deal can transition to from its current stage
 */
export function getNextAllowedStages(currentStage: DealStage): DealStage[] {
  return ALLOWED_TRANSITIONS[currentStage] || [];
}

/**
 * Check if a stage is terminal (no forward transitions)
 */
export function isTerminalStage(stage: DealStage): boolean {
  const allowed = ALLOWED_TRANSITIONS[stage];
  return !allowed || allowed.length === 0;
}

/**
 * Check if a deal can be cancelled from its current stage
 */
export function canCancel(stage: DealStage): boolean {
  return ALLOWED_TRANSITIONS[stage]?.includes('cancelled') ?? false;
}

/**
 * Check if a deal can be marked as lost from its current stage
 */
export function canMarkLost(stage: DealStage): boolean {
  return ALLOWED_TRANSITIONS[stage]?.includes('lost') ?? false;
}

/**
 * Get the next "forward" stage (excludes cancelled/lost)
 * Useful for the primary CTA button on deal detail
 */
export function getNextForwardStage(currentStage: DealStage): DealStage | null {
  const allowed = ALLOWED_TRANSITIONS[currentStage];
  if (!allowed || allowed.length === 0) return null;
  const forward = allowed.filter((s) => s !== 'cancelled' && s !== 'lost');
  return forward.length > 0 ? forward[0] : null;
}

/**
 * Validate a stage transition and return an error message if invalid
 */
export function validateTransition(
  fromStage: DealStage,
  toStage: DealStage
): { valid: boolean; error?: string } {
  if (fromStage === toStage) {
    return { valid: false, error: 'Deal is already in this stage' };
  }

  if (isTerminalStage(fromStage) && fromStage !== 'lost') {
    return { valid: false, error: `Cannot transition from ${fromStage} — it is a terminal stage` };
  }

  if (!isValidTransition(fromStage, toStage)) {
    const allowed = getNextAllowedStages(fromStage);
    return {
      valid: false,
      error: `Cannot transition from ${fromStage} to ${toStage}. Allowed: ${allowed.join(', ') || 'none'}`,
    };
  }

  return { valid: true };
}
