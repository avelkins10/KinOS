import type { FinancingStatus } from "@/lib/types/financing";

/** Adapter interface for lender integrations.
 *  Future lender APIs (GoodLeap, Mosaic, etc.) implement this interface.
 *  ManualLenderAdapter is the default — writes only to our DB, no external calls. */
export interface LenderAdapter {
  submitApplication(params: {
    dealId: string;
    lenderId: string;
    lenderProductId?: string | null;
    loanAmount: number;
    proposalId: string;
  }): Promise<{ externalApplicationId?: string; error?: string }>;

  updateStatus(params: {
    applicationId: string;
    newStatus: FinancingStatus;
    notes?: string;
  }): Promise<{ error?: string }>;
}

/** Default adapter — no external API calls, all state managed in our DB */
export class ManualLenderAdapter implements LenderAdapter {
  async submitApplication(): Promise<{
    externalApplicationId?: string;
    error?: string;
  }> {
    // No external API — application created directly in our DB
    return {};
  }

  async updateStatus(): Promise<{ error?: string }> {
    // No external API — status updated directly in our DB
    return {};
  }
}
