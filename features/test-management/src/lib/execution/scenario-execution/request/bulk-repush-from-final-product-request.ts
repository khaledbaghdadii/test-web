export interface BulkRepushFromFinalProductRequest {
  finalProductId: string;
  rtpCommitId: string;
  scenariosToBeRepushed: string[];
}
