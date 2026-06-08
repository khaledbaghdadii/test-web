import { TransferToReconProgressStatus } from "./transfer-to-recon-progress-status";

export interface ReconReportTransferProgress {
  reportPath: string;
  status: TransferToReconProgressStatus;
  triggerTime: Date;
  endTime?: Date;
  errorMessage?: string;
}
