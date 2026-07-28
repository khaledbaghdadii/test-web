/**
 * Minimal commit description returned by the batch commits-info endpoint, used
 * to label commit-based dropdown options with their commit message.
 */
export interface CommitInfo {
  readonly id: string;
  readonly displayId: string;
  readonly message: string;
}
