import { Injectable } from "@angular/core";
import { AnalysisStatus } from "@mxevolve/domains/test/model";
import type { ScenarioRunApiResponse } from "@mxevolve/domains/test/data-access";

export interface AnalysisStatusSummary {
  readonly notStarted: number;
  readonly na: number;
  readonly assigned: number;
  readonly underAnalysis: number;
  readonly incidentSent: number;
  readonly done: number;
  readonly passed: number;
  readonly failed: number;
  readonly cancelled: number;
}

export interface DetectionsSummary {
  readonly wasteReasonCount: number;
  readonly regressionCount: number;
  readonly impactCount: number;
}

export interface IncidentStatusBreakdown {
  readonly name: string;
  readonly count: number;
}

export interface IncidentsSummary {
  readonly openCount: number;
  readonly closedCount: number;
  readonly totalCount: number;
  readonly openBreakdown: IncidentStatusBreakdown[];
}

const CLOSED_STATUSES = new Set(["CLOSED", "DUPLICATE", "CANCEL"]);

@Injectable()
export class ScenarioRunsSummaryAggregationService {
  aggregateAnalysisStatuses(
    runs: ScenarioRunApiResponse[],
    headRunIds: Set<string>
  ): AnalysisStatusSummary {
    const headRuns = runs.filter((run) => headRunIds.has(run.id));

    let notStarted = 0;
    let assigned = 0;
    let underAnalysis = 0;
    let incidentSent = 0;
    let passed = 0;
    let failed = 0;
    let cancelled = 0;

    for (const run of headRuns) {
      switch (run.analysisStatus) {
        case AnalysisStatus.NA:
          notStarted++;
          break;
        case AnalysisStatus.ASSIGNED:
          assigned++;
          break;
        case AnalysisStatus.UNDER_ANALYSIS:
          underAnalysis++;
          break;
        case AnalysisStatus.INCIDENT_SENT:
          incidentSent++;
          break;
        case AnalysisStatus.PASSED:
          passed++;
          break;
        case AnalysisStatus.FAILED:
          failed++;
          break;
        case AnalysisStatus.CANCELLED:
          cancelled++;
          break;
      }
    }

    return {
      notStarted: notStarted + assigned,
      na: notStarted,
      assigned,
      underAnalysis,
      incidentSent,
      done: passed + failed + cancelled,
      passed,
      failed,
      cancelled,
    };
  }

  aggregateDetections(runs: ScenarioRunApiResponse[]): DetectionsSummary {
    const failureReasonIds = new Set<string>();
    const binaryRegressionIds = new Set<string>();
    const configurationRegressionIds = new Set<string>();
    const binaryImpactIds = new Set<string>();
    const configurationImpactIds = new Set<string>();

    for (const run of runs) {
      const detections = run.detections;
      if (!detections) continue;
      for (const id of detections.failureReasonIds ?? [])
        failureReasonIds.add(id);
      for (const id of detections.binaryRegressionIds ?? [])
        binaryRegressionIds.add(id);
      for (const id of detections.configurationRegressionIds ?? [])
        configurationRegressionIds.add(id);
      for (const id of detections.binaryImpactIds ?? [])
        binaryImpactIds.add(id);
      for (const id of detections.configurationImpactIds ?? [])
        configurationImpactIds.add(id);
    }

    return {
      wasteReasonCount: failureReasonIds.size,
      regressionCount:
        binaryRegressionIds.size + configurationRegressionIds.size,
      impactCount: binaryImpactIds.size + configurationImpactIds.size,
    };
  }

  aggregateIncidents(runs: ScenarioRunApiResponse[]): IncidentsSummary {
    const seenIds = new Set<string>();
    const uniqueIncidents: NonNullable<
      ScenarioRunApiResponse["linkedIncidents"]
    > = [];
    for (const run of runs) {
      for (const incident of run.linkedIncidents ?? []) {
        if (!seenIds.has(incident.id)) {
          seenIds.add(incident.id);
          uniqueIncidents.push(incident);
        }
      }
    }

    let closedCount = 0;
    const openStatusMap = new Map<string, number>();

    for (const incident of uniqueIncidents) {
      const status = incident.status?.toUpperCase() ?? "";
      if (CLOSED_STATUSES.has(status)) {
        closedCount++;
      } else {
        const displayStatus = incident.status ?? "Unknown";
        openStatusMap.set(
          displayStatus,
          (openStatusMap.get(displayStatus) ?? 0) + 1
        );
      }
    }

    const openBreakdown: IncidentStatusBreakdown[] = Array.from(
      openStatusMap
    ).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      openCount: uniqueIncidents.length - closedCount,
      closedCount,
      totalCount: uniqueIncidents.length,
      openBreakdown,
    };
  }
}
