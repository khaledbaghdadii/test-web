export interface BulkRepushRequest {
  factoryProductId: string;
  commitId?: string;
  scenariosToBeRepushed: string[];
}
