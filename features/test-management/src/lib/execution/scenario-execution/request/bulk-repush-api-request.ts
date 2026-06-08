export interface BulkRepushApiRequest {
  factoryProductId: string;
  commitId?: string;
  testScenarioExecutions: string[];
}
