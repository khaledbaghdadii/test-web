import { TestExecutionMode } from "./test-execution-mode";

export interface ScenarioExecutionApiModel {
  id: string;
  testUnitId: string;
  cleaningStatus: string;
  scenarioDefinitionId: string;
  name: string;
  status: string;
  analysisStatus: string;
  startDate: string;
  endDate: string;
  terminationMessage: string;
  logFileUrl: string;
  testExecutions: TestExecutionApiModel[];
  contextId: string;
  assignee: string;
  envInfo: ScenarioEnvironmentDetailsApiModel;
  commitId: string;
  mxVersion: string;
  mxBuildId: string;
  branch: string;
  subContextId?: string;
  comment: string;
  executionGroupId: string;
  repushable: boolean;
  finished: boolean;
  failed: boolean;
  detections: ScenarioDetectionsApiModel;
  linkedIncidents: ScenarioIncidentApiModel[];
  factoryProductId: string;
  fullMaintenance: boolean;
  finalProductId?: string;
  rtpCommitId?: string;
  validation?: ValidationApiModel;
  keptExecution: boolean;
  supportReconActivities: boolean;
  businessProcesses: ScenarioExecutionBusinessProcessApiModel[];
  project: ScenarioExecutionProjectApiModel;
  qualityLevel?: string;
}

export class ScenarioExecutionBusinessProcessApiModel {
  id: string;
  name: string;
}

export class ScenarioExecutionProjectApiModel {
  id: string;
  name: string;
}

export interface TestExecutionApiModel {
  id: string;
  testPackageDefinitionId: string;
  nameUponExecution: string;
  testPackageName: string;
  testSelectionNames: string[];
  startDate: string;
  endDate: string;
  testExecutionStatus: string;
  report: ReportApiModel;
  testPackageRunLocation: string;
  executionEnded: boolean;
  executionMode: TestExecutionMode;
}

export interface ValidationApiModel {
  jumpType?: string;
  scope?: ScopeApiModel;
}

export interface ScopeApiModel {
  referenceFactoryProductId: string;
  requestedFactoryProductId: string;
}

interface ReportApiModel {
  url: string;
  completeReportUrl?: string;
  performanceReportUrl?: string;
  hardwareMonitoringReportUrl?: string;
  uploading: boolean;
}

export interface ScenarioEnvironmentDetailsApiModel {
  environmentId: string;
  status: string;
}

export class ScenarioDetectionsApiModel {
  binaryRegressionIds: string[];
  configurationRegressionIds: string[];
  binaryImpactIds: string[];
  configurationImpactIds: string[];
  failureReasonIds: string[];
}

export class ScenarioIncidentApiModel {
  id: string;
  title: string;
  status: string;
  owner: string;
  externalIssue: ScenarioIncidentExternalIssueApiModel;
}

export class ScenarioIncidentExternalIssueApiModel {
  id: string;
  link: string;
}
