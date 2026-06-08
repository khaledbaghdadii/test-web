import { EnvironmentStatus } from "@mxflow/features/environment";
import { TestExecutionMode } from "./model/test-execution-mode";
import { ScenarioExecutionStatus } from "./scenario-execution-status/scenario-execution-status";
import { ScenarioAnalysisStatus } from "./scenario-analysis-status/scenario-analysis-status";

export class TestExecution {
  id: string;
  testPackageDefinitionName: string;
  nameUponExecution: string;
  testSelectionNames: string[];
  testPackageDefinitionId: string;
  report: Report;
  testPackageRunLocation: string;
  status: TestExecutionStatus;
  startDate: string;
  endDate: string | null;
  isExecutionEnded: boolean;
  executionMode: TestExecutionMode;
}

export class ScenarioDetections {
  binaryRegressionIds: string[];
  configurationRegressionIds: string[];
  binaryImpactIds: string[];
  configurationImpactIds: string[];
  failureReasonIds: string[];
}

export class ScenarioIncident {
  id: string;
  title: string;
  status: string;
  owner: string;
  externalIssue: ScenarioIncidentExternalIssue;
}

export class ScenarioIncidentExternalIssue {
  id: string;
  link: string;
}

export class Report {
  url: string;
  completeReportUrl?: string;
  performanceReportUrl?: string;
  hardwareMonitoringReportUrl?: string;
  uploading: boolean;
}

export interface ScenarioExecution {
  id: string;
  testUnitId: string;
  cleaningStatus: string;
  status: ScenarioExecutionStatus;
  analysisStatus?: ScenarioAnalysisStatus;
  scenarioDefinitionId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  terminationMessage: string;
  logFileUrl: string;
  testExecutions: TestExecution[];
  contextId: string;
  environmentId: string;
  environmentStatus: EnvironmentStatus;
  assignee?: string;
  commitId: string;
  mxVersion: string;
  mxBuildId: string;
  branch: string;
  subContextId?: string;
  comment: string;
  executionGroupId?: string;
  repushable: boolean;
  isFinished: boolean;
  isFailed: boolean;
  detections?: ScenarioDetections;
  linkedIncidents?: ScenarioIncident[];
  fullMaintenance: boolean;
  factoryProductId: string;
  finalProductId?: string;
  rtpCommitId?: string;
  validation?: Validation;
  keptExecution: boolean;
  supportReconActivities: boolean;
  businessProcesses: ScenarioExecutionBusinessProcess[];
  project: ScenarioExecutionProject;
  qualityLevel?: string;
}

export class ScenarioExecutionBusinessProcess {
  id: string;
  name: string;
}

export class ScenarioExecutionProject {
  id: string;
  name: string;
}

export interface Validation {
  jumpType?: string;
  scope?: Scope;
}

export interface Scope {
  referenceFactoryProductId: string;
  requestedFactoryProductId: string;
}

export const TestExecutionStatus = {
  QUEUED: "Queued",
  PASSED: "Passed",
  FAILED: "Failed",
  UNDERWAY: "Underway",
  READY: "READY",
  NA: "NA",
};
export const possibleTestExecutionStatuses = [
  TestExecutionStatus.QUEUED,
  TestExecutionStatus.PASSED,
  TestExecutionStatus.FAILED,
  TestExecutionStatus.UNDERWAY,
  TestExecutionStatus.READY,
  TestExecutionStatus.NA,
] as const;

export type TestExecutionStatus =
  | (typeof possibleTestExecutionStatuses)[number]
  | undefined;
