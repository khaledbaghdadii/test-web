export interface UpdateAssigneeRequest {
  assignee: string | null;
  scenarioDefinitionId: string;
  contextId: string;
  subContextId?: string;
  projectId: string;
}
