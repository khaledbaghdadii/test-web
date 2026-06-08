export interface FetchTestCaseExecutionsRequest {
  projectId: string;
  params: FetchTestCaseExecutionsQueryParams;
}

export interface FetchTestCaseExecutionsQueryParams {
  scenarioExecutionId?: string;
  testExecutionId?: string;
  testCaseExecutionIds?: string[];
}
