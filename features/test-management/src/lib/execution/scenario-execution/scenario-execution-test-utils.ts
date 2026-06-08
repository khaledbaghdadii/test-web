import { ScenarioAnalysisStatus } from "./scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionStatus } from "./scenario-execution-status/scenario-execution-status";
import { TestExecution } from "./scenario-execution";
import { TestExecutionMode } from "./model/test-execution-mode";
import { EnvironmentStatus } from "@mxflow/features/environment";

export const scenarioExecutionId = "scenario-execution-1";
export const scenarioExecutionId2 = "scenario-execution-2";
export const testUnitId1 = "testUnitId1";
export const projectId = "project-1";
export const projectId2 = "project-2";
export const errorMessage = "error message";
export const testExecutions: TestExecution[] = [
  {
    id: "test-execution-1",
    testPackageDefinitionName: "Test Package 1",
    nameUponExecution: "Execution 1",
    testSelectionNames: ["Test 1", "Test 2"],
    testPackageDefinitionId: "package-1",
    report: {
      url: "http://example.com/report",
      completeReportUrl: "http://example.com/complete-report",
      uploading: false,
    },
    testPackageRunLocation: "Location 1",
    status: ScenarioExecutionStatus.PASSED,
    startDate: "2025-03-19T10:00:00Z",
    endDate: "2025-03-19T12:00:00Z",
    isExecutionEnded: true,
    executionMode: TestExecutionMode.WEB_TEST_ENGINE,
  },
];
export const referenceFactoryProductId = "reference-factory-product-1";
export const requestedFactoryProductId = "requested-factory-product-1";
export const jumpType = "jumpType";
export const comment = "Execution comment.";
export const scenarioExecution = {
  id: scenarioExecutionId,
  cleaningStatus: "Clean",
  testUnitId: testUnitId1,
  status: ScenarioExecutionStatus.PASSED,
  analysisStatus: ScenarioAnalysisStatus.PASSED,
  scenarioDefinitionId: "scenario-1",
  name: "Scenario Execution 1",
  startDate: "2025-03-19T10:00:00Z",
  endDate: "2025-03-19T12:00:00Z",
  terminationMessage: "Execution completed successfully.",
  logFileUrl: "http://example.com/logfile",
  testExecutions: testExecutions,
  isFailed: true,
  contextId: "context-1",
  environmentId: "environment-1",
  environmentStatus: EnvironmentStatus.READY,
  assignee: "Assignee 1",
  commitId: "commit-1",
  mxVersion: "1.0.0",
  mxBuildId: "build-1",
  branch: "main",
  subContextId: "sub-context-1",
  comment: comment,
  executionGroupId: "group-1",
  repushable: true,
  isFinished: true,
  detections: {
    binaryRegressionIds: ["regression-1", "regression-2"],
    configurationRegressionIds: ["config-regression-1"],
    binaryImpactIds: ["impact-1"],
    configurationImpactIds: ["config-impact-1"],
    failureReasonIds: ["failure-1"],
  },
  linkedIncidents: [
    {
      id: "incident-1",
      title: "Incident 1",
      status: "Open",
      owner: "Owner 1",
      externalIssue: {
        id: "external-issue-1",
        link: "http://example.com/issue",
      },
    },
  ],
  fullMaintenance: false,
  factoryProductId: "factory-product-1",
  finalProductId: "final-product-1",
  rtpCommitId: "rtp-commit-1",
  validation: {
    scope: {
      referenceFactoryProductId: referenceFactoryProductId,
      requestedFactoryProductId: requestedFactoryProductId,
    },
    jumpType: jumpType,
  },
  keptExecution: true,
  disableKeepExecution: false,
  businessProcesses: [
    {
      id: "bp-1",
      name: "Business Process 1",
    },
  ],
  project: {
    id: projectId,
    name: "Project 1",
  },
  supportReconActivities: true,
};

export const scenarioExecution2 = {
  id: scenarioExecutionId2,
  testUnitId: "testUnitId2",
  cleaningStatus: "Not Clean",
  status: ScenarioExecutionStatus.FAILED,
  analysisStatus: ScenarioAnalysisStatus.FAILED,
  scenarioDefinitionId: "scenario-2",
  name: "Scenario Execution 2",
  startDate: "2025-03-20T10:00:00Z",
  endDate: "2025-03-20T12:00:00Z",
  terminationMessage: "Execution failed due to errors.",
  logFileUrl: "http://example.com/logfile2",
  testExecutions: testExecutions,
  contextId: "context-2",
  environmentId: "environment-2",
  environmentStatus: EnvironmentStatus.EXECUTING,
  assignee: "Assignee 2",
  commitId: "commit-2",
  mxVersion: "2.0.0",
  mxBuildId: "build-2",
  branch: "develop",
  subContextId: "sub-context-2",
  comment: comment,
  executionGroupId: "group-2",
  repushable: false,
  isFinished: false,
  detections: {
    binaryRegressionIds: ["regression-3", "regression-4"],
    configurationRegressionIds: ["config-regression-2"],
    binaryImpactIds: ["impact-2"],
    configurationImpactIds: ["config-impact-2"],
    failureReasonIds: ["failure-2"],
  },
  linkedIncidents: [
    {
      id: "incident-2",
      title: "Incident 2",
      status: "Closed",
      owner: "Owner 2",
      externalIssue: {
        id: "external-issue-2",
        link: "http://example.com/issue2",
      },
    },
  ],
  fullMaintenance: true,
  factoryProductId: "factory-product-2",
  finalProductId: "final-product-2",
  rtpCommitId: "rtp-commit-2",
  validation: {
    scope: {
      referenceFactoryProductId: referenceFactoryProductId,
      requestedFactoryProductId: requestedFactoryProductId,
    },
    jumpType: jumpType,
  },
  keptExecution: false,
  disableKeepExecution: false,
  businessProcesses: [
    {
      id: "bp-2",
      name: "Business Process 2",
    },
  ],
  project: {
    id: projectId2,
    name: "Project 2",
  },
};
