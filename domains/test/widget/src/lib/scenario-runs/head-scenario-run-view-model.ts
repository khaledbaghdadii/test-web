import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

export interface HeadScenarioRunViewModel {
  readonly id: string;
  readonly name: string;
  readonly status: ScenarioRunStatus;
  readonly environmentId: string;
  readonly environmentStatus: EnvironmentStatus;
  readonly analysisStatus: string;
  readonly numberOfImpacts: number;
  readonly numberOfRegressions: number;
  readonly numberOfIncidents: number;
  readonly impactIds: readonly string[];
  readonly regressionIds: readonly string[];
  readonly incidentIds: readonly string[];
  readonly startDate: string;
  readonly endDate?: string;
  readonly commitId: string;
  readonly assigneeId: string;
  readonly assigneeDisplayName: string;
  readonly assigneeEmail: string;
  readonly mxVersion: string;
  readonly mxBuildId: string;
  readonly scenarioDefinitionId?: string;
  readonly contextId?: string;
  readonly subContextId?: string;
  readonly factoryProductId?: string;
  readonly executionGroupId?: string;
  readonly repushable?: boolean;
  readonly warningMessage?: string;
}
