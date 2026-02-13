export interface SubmissionProvider {
  name: string;
  submit(
    payload: SubmissionPayload,
  ): Promise<{ externalId?: string; error?: string }>;
  getStatus(
    externalId: string,
  ): Promise<{ status: string; rejectionReasons?: string[] }>;
}

export interface SubmissionPayload {
  // Identifiers
  dealId: string;
  dealNumber: string;
  submissionAttempt: number;
  submittedAt: string;
  submittedBy: string;

  // Customer
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };

  // System
  system: {
    sizeKw: number;
    panelCount: number;
    panelModel: string;
    inverterModel: string;
    batteryModel?: string;
    batteryCount?: number;
    annualProductionKwh: number;
    offsetPercentage: number;
  };

  // Pricing
  pricing: {
    grossPrice: number;
    netPrice: number;
    grossPpw: number;
    monthlyPayment?: number;
    downPayment?: number;
    federalTaxCredit?: number;
    dealerFee?: number;
    adders: Array<{ name: string; amount: number }>;
  };

  // Financing
  financing: {
    lenderName: string;
    productName: string;
    termMonths: number;
    interestRate: number;
    approvalNumber?: string;
    approvalStatus: string;
  };

  // Contracts
  contracts: {
    allSigned: boolean;
    signedDate?: string;
    envelopes: Array<{ title: string; status: string; signedAt?: string }>;
  };

  // Reps
  closer: { name: string; email: string };
  setter?: { name: string; email: string };
  office: string;

  // Gate answers (question-type gates)
  gateAnswers: Record<string, string>;

  // Attachments
  attachmentUrls: Array<{ name: string; category: string; url: string }>;
}
