export interface BulkRepushApiResponse {
  successfulRepushes: RepushedScenarioApiResponse[];
  failedRepushes: string[];
}

export interface RepushedScenarioApiResponse {
  originalScenarioExecutionId: string;
  repushedScenarioExecutionId: string;
}
