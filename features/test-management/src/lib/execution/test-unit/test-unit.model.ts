import {
  ScenarioAnalysisStatus,
  ScenarioExecutionStatus,
} from "@mxflow/test-management";

export interface TestUnitModel {
  id: string;
  headScenarioExecution: TestUnitScenarioExecutionModel;
  scenarioExecutions: TestUnitScenarioExecutionModel[];
  repushable: boolean;
  executionGroupId?: string;
  scenarioDefinitionId: string;
  scenarioDefinitionName: string;
  contextId: string;
  subContextId?: string;
  assignee: string;
  branch: string;
  disableKeepExecution: boolean;
  validationScopeEnabled: boolean;
  incidentEnabled: boolean;
}

export interface TestUnitScenarioExecutionModel {
  id: string;
  analysisObjects: ScenarioExecutionAnalysisObjectsModel;
  analysisStatus: ScenarioAnalysisStatus;
  status: ScenarioExecutionStatus;
  startDate: string;
  endDate?: string;
  commitId: string;
  mxVersion: string;
  mxBuildId: string;
  factoryProductId: string;
  keptExecution: boolean;
  environment: ScenarioExecutionEnvironmentModel;
  cleaningStatus: string;
  isFailed: boolean;
  isFinished: boolean;
}

export interface ScenarioExecutionAnalysisObjectsModel {
  binaryImpacts: string[];
  binaryRegressions: string[];
  configurationImpacts: string[];
  configurationRegressions: string[];
  failureReasons: string[];
  incidents: string[];
}

export interface ScenarioExecutionEnvironmentModel {
  id: string;
  status: string;
}
