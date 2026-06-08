export interface FetchTestUnitsRequest {
  readonly projectId: string;
  readonly contextId?: string;
  readonly subContextId?: string;
  readonly scenarioDefinitionId?: string;
  readonly scenarioExecutionIds?: string[];
}
