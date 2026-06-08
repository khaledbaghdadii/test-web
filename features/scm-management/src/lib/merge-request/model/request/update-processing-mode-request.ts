import { MergeRequestProcessingMode } from "../merge-request";

export interface MergeRequestProcessingModeItem {
  mergeRequestId: string;
  processingMode: MergeRequestProcessingMode;
}

export interface UpdateProcessingModeRequest {
  processingModeUpdates: MergeRequestProcessingModeItem[];
}
