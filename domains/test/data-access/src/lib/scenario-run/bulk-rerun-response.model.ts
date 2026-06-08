export interface BulkRerunResponse {
  successfulRepushes: Array<{
    originalScenarioExecutionId: string;
    repushedScenarioExecutionId: string;
  }>;
  failedRepushes: string[];
}
