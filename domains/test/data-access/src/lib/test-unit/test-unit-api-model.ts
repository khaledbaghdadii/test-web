export interface TestUnitApiModel {
  readonly id: string;
  readonly headScenarioExecutionId: string;
  readonly scenarioExecutions: TestUnitScenarioExecutionApiModel[];
  readonly repushable: boolean;
  readonly scenarioDefinitionId: string;
  readonly scenarioDefinitionName: string;
  readonly contextId: string;
  readonly subContextId?: string;
  readonly assignee: string;
  readonly branch: string;
  readonly executionGroupId?: string;
  readonly disableKeepExecution: boolean;
  readonly validationScopeEnabled: boolean;
  readonly incidentEnabled: boolean;
}

export interface TestUnitScenarioExecutionApiModel {
  readonly scenarioExecutionId: string;
  readonly analysisObjects: ScenarioExecutionAnalysisObjectsApiModel;
  readonly analysisStatus: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly commitId: string;
  readonly mxVersion: string;
  readonly mxBuildId: string;
  readonly factoryProductId: string;
  readonly keptExecution: boolean;
  readonly environment: ScenarioExecutionEnvironmentApiModel;
  readonly cleaningStatus: string;
  readonly failed: boolean;
  readonly finished: boolean;
}

export interface ScenarioExecutionAnalysisObjectsApiModel {
  readonly binaryImpacts: string[];
  readonly binaryRegressions: string[];
  readonly configurationImpacts: string[];
  readonly configurationRegressions: string[];
  readonly failureReasons: string[];
  readonly incidents: string[];
}

export interface ScenarioExecutionEnvironmentApiModel {
  readonly environmentId: string;
  readonly status: string;
}
