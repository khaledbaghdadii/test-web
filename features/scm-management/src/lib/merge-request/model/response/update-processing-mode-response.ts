import { MergeRequestApiResponse } from "./merge-request-api-response";

export interface UpdateProcessingModeResponse {
  succeededMergeRequests: MergeRequestApiResponse[];
  failedMergeRequests: MergeRequestApiResponse[];
}
