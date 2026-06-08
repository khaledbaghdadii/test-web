import { Injectable } from "@angular/core";
import { ScenarioDetections } from "../scenario-execution";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionStatus } from "../scenario-execution-status/scenario-execution-status";
import { BarColor, StackedBarItem } from "@mxflow/ui/bar";
import { TestUnitScenarioExecutionModel } from "../../test-unit/test-unit.model";
import { Incident } from "@mxflow/features/incident-management";

@Injectable()
export class ValidationSummaryService {
  constructAnalysisStatusStackedBarInput(
    testUnitScenarioExecutions: TestUnitScenarioExecutionModel[]
  ): StackedBarItem[] {
    const analysisStatusCounts = this.countAnalysisStatuses(
      testUnitScenarioExecutions
    );
    return [
      {
        label: "Passed",
        color: BarColor.Green,
        value: analysisStatusCounts.PASSED,
      },
      {
        label: "Under Analysis",
        color: BarColor.Yellow,
        value: analysisStatusCounts.UNDER_ANALYSIS,
      },
      {
        label: "Failed",
        color: BarColor.Red,
        value: analysisStatusCounts.FAILED,
      },
      {
        label: "Cancelled",
        color: BarColor.Gray,
        value: analysisStatusCounts.CANCELLED,
      },
      {
        label: "N/A",
        color: BarColor.LightGray,
        value: analysisStatusCounts.NA,
      },
      {
        label: "Assigned",
        color: BarColor.Blue,
        value: analysisStatusCounts.ASSIGNED,
      },
      {
        label: "Incident Sent",
        color: BarColor.Indigo,
        value: analysisStatusCounts.INCIDENT_SENT,
      },
    ];
  }

  constructScenarioStatusStackedBarInput(
    testUnitScenarioExecutions: TestUnitScenarioExecutionModel[]
  ): StackedBarItem[] {
    const statusCounts = this.countStatuses(testUnitScenarioExecutions);
    return [
      {
        label: "Passed",
        color: BarColor.Green,
        value: statusCounts.PASSED,
      },
      {
        label: "Underway",
        color: BarColor.Yellow,
        value: statusCounts.UNDERWAY,
      },
      {
        label: "Failed",
        color: BarColor.Red,
        value: statusCounts.FAILED,
      },
    ];
  }

  mergeDistinctDetections(
    testUnitScenarioExecutions: TestUnitScenarioExecutionModel[]
  ) {
    const scenarioDetections: ScenarioDetections = {
      binaryImpactIds: [],
      binaryRegressionIds: [],
      configurationImpactIds: [],
      configurationRegressionIds: [],
      failureReasonIds: [],
    };
    testUnitScenarioExecutions.forEach(
      (testUnitScenarioExecution: TestUnitScenarioExecutionModel) => {
        const analysisObjects = testUnitScenarioExecution.analysisObjects;
        if (analysisObjects) {
          scenarioDetections.binaryRegressionIds = this.mergeArraysUnique(
            scenarioDetections.binaryRegressionIds,
            analysisObjects.binaryRegressions
          );
          scenarioDetections.configurationRegressionIds =
            this.mergeArraysUnique(
              scenarioDetections.configurationRegressionIds,
              analysisObjects.configurationRegressions
            );
          scenarioDetections.binaryImpactIds = this.mergeArraysUnique(
            scenarioDetections.binaryImpactIds,
            analysisObjects.binaryImpacts
          );

          scenarioDetections.configurationImpactIds = this.mergeArraysUnique(
            scenarioDetections.configurationImpactIds,
            analysisObjects.configurationImpacts
          );
          scenarioDetections.failureReasonIds = this.mergeArraysUnique(
            scenarioDetections.failureReasonIds,
            analysisObjects.failureReasons
          );
        }
      }
    );
    return scenarioDetections;
  }

  countAnalysisStatuses(
    testUnitScenarioExecutions: TestUnitScenarioExecutionModel[]
  ) {
    type ScenarioAnalysisStatusKey = keyof typeof ScenarioAnalysisStatus;
    const analysisStatusCounts: Record<ScenarioAnalysisStatusKey, number> = {
      NA: 0,
      ASSIGNED: 0,
      PASSED: 0,
      FAILED: 0,
      UNDER_ANALYSIS: 0,
      INCIDENT_SENT: 0,
      CANCELLED: 0,
    };

    testUnitScenarioExecutions.forEach(({ analysisStatus }) => {
      if (analysisStatus === ScenarioAnalysisStatus.NA) {
        analysisStatusCounts.NA = this.incrementStatusCount(
          analysisStatusCounts.NA
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.PASSED) {
        analysisStatusCounts.PASSED = this.incrementStatusCount(
          analysisStatusCounts.PASSED
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.FAILED) {
        analysisStatusCounts.FAILED = this.incrementStatusCount(
          analysisStatusCounts.FAILED
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.CANCELLED) {
        analysisStatusCounts.CANCELLED = this.incrementStatusCount(
          analysisStatusCounts.CANCELLED
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.ASSIGNED) {
        analysisStatusCounts.ASSIGNED = this.incrementStatusCount(
          analysisStatusCounts.ASSIGNED
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.UNDER_ANALYSIS) {
        analysisStatusCounts.UNDER_ANALYSIS = this.incrementStatusCount(
          analysisStatusCounts.UNDER_ANALYSIS
        );
      } else if (analysisStatus === ScenarioAnalysisStatus.INCIDENT_SENT) {
        analysisStatusCounts.INCIDENT_SENT = this.incrementStatusCount(
          analysisStatusCounts.INCIDENT_SENT
        );
      }
    });
    return analysisStatusCounts;
  }

  countStatuses(testUnitScenarioExecutions: TestUnitScenarioExecutionModel[]) {
    type ScenarioStatusKey = keyof typeof ScenarioExecutionStatus;
    const statusCounts: Record<ScenarioStatusKey, number> = {
      PASSED: 0,
      FAILED: 0,
      ABORTING: 0,
      ABORTED: 0,
      FAILED_TO_ABORT: 0,
      UNDERWAY: 0,
      READY: 0,
      NA: 0,
    };

    testUnitScenarioExecutions.forEach((scenarioExecution) => {
      if (!scenarioExecution.isFinished) {
        statusCounts.UNDERWAY = this.incrementStatusCount(
          statusCounts.UNDERWAY
        );
      } else if (scenarioExecution.isFailed) {
        statusCounts.FAILED = this.incrementStatusCount(statusCounts.FAILED);
      } else if (!scenarioExecution.isFailed) {
        statusCounts.PASSED = this.incrementStatusCount(statusCounts.PASSED);
      }
    });
    return statusCounts;
  }

  groupLinkedIncidentsStatuses(incidents: Incident[]) {
    const hashmap = new Map<string, number>();
    incidents.forEach((incident) => {
      hashmap.set(incident.status, (hashmap.get(incident.status) ?? 0) + 1);
    });
    return {
      statuses: Array.from(hashmap).map(([name, count]) => ({ name, count })),
    };
  }

  private mergeArraysUnique(arr1: string[], arr2: string[]): string[] {
    const combinedArray = [...arr1, ...arr2];
    return Array.from(new Set(combinedArray));
  }

  private incrementStatusCount(statusCount: number | null) {
    if (statusCount === null) {
      return 1;
    }

    return statusCount + 1;
  }
}
