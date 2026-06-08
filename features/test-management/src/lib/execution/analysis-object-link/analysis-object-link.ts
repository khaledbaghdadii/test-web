export interface AnalysisObjectLink {
  projectId: string;
  scenarioExecutionId: string;
  testCaseExecutionId?: string;
  analysisObjectId: string;
  analysisObjectType: string;
}
export interface TestUnitAnalysisObjectLink {
  projectId: string;
  scenarioExecutionId: string;
  testCaseExecution?: {
    id: string;
    externalId?: string;
  };
  analysisObject: {
    id: string;
    type: string;
    title: string;
    readableId?: string;
    externalLink?: string;
  };
  testUnitId: string;
}

export interface AnalysisObjectLinkedScenarioExecution {
  scenarioExecutionId: string;
  testCaseExecutionId?: string;
  contextId: string;
  projectId: string;
  scenarioDefinitionId: string;
}

export interface TestCaseExecutionAnalysisObjectLinkModel {
  testCaseExecutionId?: string;
  analysisObjectId: string;
  analysisObjectType: string;
}

export interface UpdateAnalysisObjectLinkRequest {
  linksToAdd: TestCaseExecutionAnalysisObjectLinkModel[];
  linksToRemove: TestCaseExecutionAnalysisObjectLinkModel[];
}
export interface CreateAnalysisObjectLinkRequest {
  projectId: string;
  scenarioExecutionId: string;
  link: TestCaseExecutionAnalysisObjectLinkModel;
}
export interface UnlinkAnalysisObjectRequest {
  projectId: string;
  scenarioExecutionId: string;
  link: TestCaseExecutionAnalysisObjectLinkModel;
}
