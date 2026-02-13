import type { SubmissionProvider, SubmissionPayload } from "./types";

export class ManualSubmissionProvider implements SubmissionProvider {
  name = "manual";

  async submit(
    _payload: SubmissionPayload,
  ): Promise<{ externalId?: string; error?: string }> {
    // No-op: submission tracked in KinOS only.
    // Future: QuickbaseSubmissionProvider will push payload to QB here.
    return {};
  }

  async getStatus(
    _externalId: string,
  ): Promise<{ status: string; rejectionReasons?: string[] }> {
    // No-op: status managed manually in KinOS.
    // Future: QuickbaseSubmissionProvider will poll QB status here.
    return { status: "manual" };
  }
}

export const submissionProvider = new ManualSubmissionProvider();
