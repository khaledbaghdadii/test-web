import { ValidationSummaryService } from "./validation-summary.service";
import { EnvironmentStatus } from "@mxflow/features/environment";
import { BarColor } from "@mxflow/ui/bar";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionStatus } from "../scenario-execution-status/scenario-execution-status";
import {
  ScenarioExecutionAnalysisObjectsModel,
  TestUnitScenarioExecutionModel,
} from "@mxflow/test-management";
import { Incident } from "@mxflow/features/incident-management";

describe("Service: ValidationSummary", () => {
  const service = new ValidationSummaryService();
  it("should ...", () => {
    expect(service).toBeTruthy();
  });

  it("should count non failing scenario executions as passed", () => {
    const statusCount = service.countStatuses(getScenarioExecutions());
    expect(statusCount.PASSED).toEqual(3);
  });

  it("should count unfinished scenario executions as underway", () => {
    const statusCount = service.countStatuses(getScenarioExecutions());
    expect(statusCount.UNDERWAY).toEqual(2);
  });

  it("should count number of failed scenario executions as failed", () => {
    const statusCount = service.countStatuses(getScenarioExecutions());
    expect(statusCount.FAILED).toEqual(1);
  });

  it("should count analysis statuses correctly", () => {
    expect(service.countAnalysisStatuses(getScenarioExecutions())).toEqual({
      PASSED: 1,
      FAILED: 1,
      UNDER_ANALYSIS: 1,
      NA: 1,
      CANCELLED: 1,
      INCIDENT_SENT: 0,
      ASSIGNED: 1,
    });
  });

  it("should construct analysis status stacked bar input correctly", () => {
    expect(
      service.constructAnalysisStatusStackedBarInput(getScenarioExecutions())
    ).toEqual([
      {
        label: "Passed",
        color: BarColor.Green,
        value: 1,
      },
      {
        label: "Under Analysis",
        color: BarColor.Yellow,
        value: 1,
      },
      {
        label: "Failed",
        color: BarColor.Red,
        value: 1,
      },
      {
        label: "Cancelled",
        color: BarColor.Gray,
        value: 1,
      },
      {
        label: "N/A",
        color: BarColor.LightGray,
        value: 1,
      },
      {
        label: "Assigned",
        color: BarColor.Blue,
        value: 1,
      },
      {
        label: "Incident Sent",
        color: BarColor.Indigo,
        value: 0,
      },
    ]);
  });

  it("should construct scenario status stacked bar input correctly", () => {
    expect(
      service.constructScenarioStatusStackedBarInput(getScenarioExecutions())
    ).toEqual([
      {
        label: "Passed",
        color: BarColor.Green,
        value: 3,
      },
      {
        label: "Underway",
        color: BarColor.Yellow,
        value: 2,
      },
      {
        label: "Failed",
        color: BarColor.Red,
        value: 1,
      },
    ]);
  });

  describe("mergeDistinctDetections", () => {
    it("should merge detections correctly", () => {
      expect(service.mergeDistinctDetections(getScenarioExecutions())).toEqual({
        binaryRegressionIds: ["binaryRegression1", "binaryRegression2"],
        configurationRegressionIds: [
          "configurationRegression1",
          "configurationRegression2",
        ],
        binaryImpactIds: ["binaryImpact1", "binaryImpact2"],
        configurationImpactIds: [
          "configurationImpact1",
          "configurationImpact2",
        ],
        failureReasonIds: ["failureReason1", "failureReason2"],
      });
    });

    it("should return empty scenarioDetections object if all scenario executions have no detections", () => {
      const scenarioExecutionsWithoutDetections = getScenarioExecutions().map(
        (scenarioExecution) => {
          scenarioExecution.analysisObjects =
            undefined as unknown as ScenarioExecutionAnalysisObjectsModel;
          return scenarioExecution;
        }
      );
      expect(
        service.mergeDistinctDetections(scenarioExecutionsWithoutDetections)
      ).toEqual({
        binaryRegressionIds: [],
        configurationRegressionIds: [],
        binaryImpactIds: [],
        configurationImpactIds: [],
        failureReasonIds: [],
      });
    });
  });

  describe("groupLinkedIncidentsStatuses", () => {
    it("should group linked incidents statuses correctly", () => {
      expect(
        service.groupLinkedIncidentsStatuses([
          { status: "status" } as unknown as Incident,
          { status: "status1" } as unknown as Incident,
          { status: "status1" } as unknown as Incident,
        ])
      ).toEqual({
        statuses: [
          { name: "status", count: 1 },
          { name: "status1", count: 2 },
        ],
      });
    });
  });
});

function getScenarioExecutions(): TestUnitScenarioExecutionModel[] {
  return [
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.UNDER_ANALYSIS,
      isFinished: false,
    },
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.PASSED,
      isFinished: false,
    },
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.FAILED,
      isFailed: false,
    },
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.NA,
      isFailed: false,
    },
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.ASSIGNED,
      isFailed: false,
    },
    {
      ...getScenarioExecution(),
      analysisStatus: ScenarioAnalysisStatus.CANCELLED,
      isFailed: true,
      analysisObjects: {
        binaryRegressions: ["binaryRegression1", "binaryRegression2"],
        configurationRegressions: [
          "configurationRegression1",
          "configurationRegression2",
        ],
        binaryImpacts: ["binaryImpact1", "binaryImpact2"],
        configurationImpacts: ["configurationImpact1", "configurationImpact2"],
        failureReasons: ["failureReason1", "failureReason2"],
        incidents: ["incident1"],
      },
    },
  ];
}

function getScenarioExecution(): TestUnitScenarioExecutionModel {
  return {
    id: "scenarioExecutionId",
    analysisStatus: ScenarioAnalysisStatus.NA,
    status: ScenarioExecutionStatus.PASSED,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    commitId: "commitId",
    mxVersion: "mxVersion",
    mxBuildId: "mxBuildId",
    factoryProductId: "factoryProductId",
    keptExecution: true,
    environment: {
      id: "environmentId",
      status: EnvironmentStatus.READY,
    },
    analysisObjects: {
      binaryImpacts: ["binaryImpact1"],
      binaryRegressions: ["binaryRegression1"],
      configurationImpacts: ["configurationImpact1"],
      configurationRegressions: ["configurationRegression1"],
      failureReasons: ["failureReason1"],
      incidents: ["incident1"],
    },
    cleaningStatus: "NOT_LAUNCHED",
    isFailed: false,
    isFinished: true,
  };
}
