export interface BulkRerunRequest {
  factoryProductId: string;
  commitId?: string;
  scenariosToBeRepushed: string[];
}
