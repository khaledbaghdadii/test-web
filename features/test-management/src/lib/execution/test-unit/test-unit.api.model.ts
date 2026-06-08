import {
  ScenarioAnalysisStatus,
  ScenarioExecutionStatus,
} from "@mxflow/test-management";

export interface TestUnitApiModel {
  id: string;
  headScenarioExecutionId: string;
  scenarioExecutions: TestUnitScenarioExecutionApiModel[];
  repushable: boolean;
  scenarioDefinitionId: string;
  scenarioDefinitionName: string;
  contextId: string;
  subContextId?: string;
  assignee: string;
  branch: string;
  executionGroupId?: string;
  disableKeepExecution: boolean;
  validationScopeEnabled: boolean;
  incidentEnabled: boolean;
}

export interface TestUnitScenarioExecutionApiModel {
  scenarioExecutionId: string;
  analysisObjects: ScenarioExecutionAnalysisObjectsApiModel;
  analysisStatus: ScenarioAnalysisStatus;
  status: ScenarioExecutionStatus;
  startDate: string;
  endDate?: string;
  commitId: string;
  mxVersion: string;
  mxBuildId: string;
  factoryProductId: string;
  keptExecution: boolean;
  environment: ScenarioExecutionEnvironmentApiModel;
  cleaningStatus: string;
  failed: boolean;
  finished: boolean;
}

export interface ScenarioExecutionAnalysisObjectsApiModel {
  binaryImpacts: string[];
  binaryRegressions: string[];
  configurationImpacts: string[];
  configurationRegressions: string[];
  failureReasons: string[];
  incidents: string[];
}

export interface ScenarioExecutionEnvironmentApiModel {
  environmentId: string;
  status: string;
}
