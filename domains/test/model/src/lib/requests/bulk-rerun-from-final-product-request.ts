export interface BulkRerunFromFinalProductRequest {
  finalProductId: string;
  rtpCommitId: string;
  scenariosToBeRepushed: string[];
}
