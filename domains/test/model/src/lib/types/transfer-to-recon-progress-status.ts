export enum TransferToReconProgressStatus {
  IN_PROGRESS = "IN_PROGRESS",
  PASSED = "PASSED",
  FAILED = "FAILED",
}

export const TransferToReconProgressStatusDisplayValue: Record<
  TransferToReconProgressStatus,
  string
> = {
  [TransferToReconProgressStatus.IN_PROGRESS]: "In Progress",
  [TransferToReconProgressStatus.PASSED]: "Passed",
  [TransferToReconProgressStatus.FAILED]: "Failed",
};
