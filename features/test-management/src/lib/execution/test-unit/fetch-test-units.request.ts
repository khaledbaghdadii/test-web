export interface FetchTestUnitsRequest {
  projectId: string;
  contextId?: string;
  subContextId?: string;
  scenarioDefinitionId?: string;
  scenarioExecutionIds?: string[];
}
