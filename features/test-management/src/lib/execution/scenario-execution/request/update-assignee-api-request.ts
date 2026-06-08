export interface UpdateAssigneeApiRequest {
  assignee: string | null;
  contextId: string;
  scenarioDefinitionId: string;
  subContextId?: string;
}
