// lib/integrations/signing/manual-provider.ts
// Manual signing provider — no external API calls.
// All state managed in our DB. Same pattern as ManualLenderAdapter.

import type { SigningProvider, EnvelopeStatus } from "./types";

export class ManualSigningProvider implements SigningProvider {
  name = "manual";

  async createEnvelope(): Promise<{
    providerEnvelopeId?: string;
    error?: string;
  }> {
    // No-op: envelope created directly in our DB
    return {};
  }

  async getEnvelopeStatus(): Promise<{
    status: EnvelopeStatus;
    error?: string;
  }> {
    // No-op: status read from our DB
    return { status: "created" };
  }

  async getSigningUrl(): Promise<{ url?: string; error?: string }> {
    // Manual tracking — no signing URL
    return { error: "Manual signing does not support signing URLs" };
  }

  async handleWebhook(): Promise<{
    envelopeId: string;
    status: EnvelopeStatus;
    signedAt?: string;
  }> {
    // Manual tracking — no webhooks
    return { envelopeId: "", status: "created" };
  }

  async getSignedDocument(): Promise<{
    url?: string;
    buffer?: Buffer;
    error?: string;
  }> {
    // Manual tracking — no document download
    return { error: "Manual signing does not support document download" };
  }
}
