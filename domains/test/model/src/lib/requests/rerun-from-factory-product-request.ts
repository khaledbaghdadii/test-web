export interface RerunFromFactoryProductRequest {
  factoryProductId: string;
  commitId?: string;
  executionGroupId?: string;
  stopServices?: boolean;
}
