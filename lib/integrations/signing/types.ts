// lib/integrations/signing/types.ts
// Adapter interface for document signing providers (PandaDoc, SignNow, manual)

export type EnvelopeStatus =
  | "created"
  | "sent"
  | "viewed"
  | "partially_signed"
  | "signed"
  | "declined"
  | "voided";

export interface Recipient {
  name: string;
  email: string;
  role: "signer" | "cc";
  order?: number;
}

export interface SigningProvider {
  name: string;

  createEnvelope(params: {
    templateId: string;
    recipients: Recipient[];
    mergeFields: Record<string, string>;
    dealId: string;
  }): Promise<{ providerEnvelopeId?: string; error?: string }>;

  getEnvelopeStatus(envelopeId: string): Promise<{
    status: EnvelopeStatus;
    error?: string;
  }>;

  getSigningUrl(
    envelopeId: string,
    recipientEmail: string,
  ): Promise<{
    url?: string;
    error?: string;
  }>;

  handleWebhook(payload: unknown): Promise<{
    envelopeId: string;
    status: EnvelopeStatus;
    signedAt?: string;
  }>;

  getSignedDocument(envelopeId: string): Promise<{
    url?: string;
    buffer?: Buffer;
    error?: string;
  }>;
}
