import type { Database } from "@/lib/supabase/database.types";

type FinancingAppRow =
  Database["public"]["Tables"]["financing_applications"]["Row"];
type LenderRow = Database["public"]["Tables"]["lenders"]["Row"];
type LenderProductRow = Database["public"]["Tables"]["lender_products"]["Row"];

/** The 11 valid financing_applications.status values (CHECK constraint) */
export type FinancingStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "approved"
  | "conditionally_approved"
  | "stips_pending"
  | "stips_cleared"
  | "denied"
  | "expired"
  | "cancelled"
  | "funded";

/** Financing application with joined lender + product data */
export interface FinancingApplicationWithRelations extends FinancingAppRow {
  lender?: Pick<LenderRow, "id" | "name" | "slug" | "lender_type"> | null;
  lender_product?: Pick<LenderProductRow, "id" | "name" | "term_months" | "interest_rate"> | null;
}

export interface CreateFinancingInput {
  proposalId: string;
  lenderId: string;
  lenderProductId?: string | null;
  loanAmount: number;
}

export interface UpdateFinancingStatusInput {
  status: FinancingStatus;
  notes?: string;
  approvedAmount?: number | null;
  approvedRate?: number | null;
  approvedTermMonths?: number | null;
  denialReason?: string;
  conditions?: string;
}
