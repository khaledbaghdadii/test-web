import type {
  ScenarioRunApiResponse,
  TestUnitApiModel,
  TestUnitScenarioExecutionApiModel,
} from "@mxevolve/domains/test/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import type { ScenarioRunTableViewModel } from "@mxevolve/domains/test/ui";
import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import type { ScenarioRunsPanelViewModel } from "./scenario-runs-panel-facade.service";
import type { UserApiResponse } from "@mxevolve/domains/user/data-access";
import type { PanelFilterData } from "./panel-filter-data";

export function mapTestUnitToRuns(
  testUnit: TestUnitApiModel
): HeadScenarioRunViewModel[] {
  const runs = testUnit.scenarioExecutions.map((execution) =>
    mapExecutionToRun(execution, testUnit)
  );
  const headId = testUnit.headScenarioExecutionId;
  const headIndex = runs.findIndex((run) => run.id === headId);
  if (headIndex > 0) {
    const [head] = runs.splice(headIndex, 1);
    runs.unshift(head);
  }
  return runs;
}

export function mapExecutionToRun(
  execution: TestUnitScenarioExecutionApiModel,
  testUnit: TestUnitApiModel
): HeadScenarioRunViewModel {
  return {
    id: execution.scenarioExecutionId,
    name: testUnit.scenarioDefinitionName,
    status: execution.status as ScenarioRunStatus,
    environmentId: execution.environment.environmentId,
    environmentStatus: execution.environment.status as EnvironmentStatus,
    analysisStatus: execution.analysisStatus,
    numberOfImpacts: countArrayLengths(
      execution.analysisObjects.binaryImpacts,
      execution.analysisObjects.configurationImpacts
    ),
    numberOfRegressions: countArrayLengths(
      execution.analysisObjects.binaryRegressions,
      execution.analysisObjects.configurationRegressions
    ),
    numberOfIncidents: execution.analysisObjects.incidents.length,
    impactIds: [
      ...execution.analysisObjects.binaryImpacts,
      ...execution.analysisObjects.configurationImpacts,
    ],
    regressionIds: [
      ...execution.analysisObjects.binaryRegressions,
      ...execution.analysisObjects.configurationRegressions,
    ],
    incidentIds: execution.analysisObjects.incidents,
    startDate: execution.startDate,
    endDate: execution.endDate,
    commitId: execution.commitId,
    assigneeId: testUnit.assignee,
    assigneeDisplayName: testUnit.assignee,
    assigneeEmail: "",
    mxVersion: execution.mxVersion,
    mxBuildId: execution.mxBuildId,
    scenarioDefinitionId: testUnit.scenarioDefinitionId,
    contextId: testUnit.contextId,
    subContextId: testUnit.subContextId,
    factoryProductId: execution.factoryProductId,
    executionGroupId: testUnit.executionGroupId,
    repushable: testUnit.repushable,
    warningMessage:
      !testUnit.disableKeepExecution && !execution.keptExecution
        ? "After repushing a scenario that is not kept, the previous execution will be cleaned."
        : undefined,
  };
}

export function mapApiResponseToRun(
  response: ScenarioRunApiResponse
): HeadScenarioRunViewModel {
  return {
    id: response.id,
    name: response.name,
    status: response.status as ScenarioRunStatus,
    environmentId: response.envInfo.environmentId,
    environmentStatus: response.envInfo.status as EnvironmentStatus,
    analysisStatus: response.analysisStatus,
    numberOfImpacts: countArrayLengths(
      response.detections.binaryImpactIds,
      response.detections.configurationImpactIds
    ),
    numberOfRegressions: countArrayLengths(
      response.detections.binaryRegressionIds,
      response.detections.configurationRegressionIds
    ),
    numberOfIncidents: response.linkedIncidents.length,
    impactIds: [
      ...response.detections.binaryImpactIds,
      ...response.detections.configurationImpactIds,
    ],
    regressionIds: [
      ...response.detections.binaryRegressionIds,
      ...response.detections.configurationRegressionIds,
    ],
    incidentIds: response.linkedIncidents.map((i) => i.id),
    startDate: response.startDate,
    endDate: response.endDate,
    commitId: response.commitId,
    assigneeId: response.assignee,
    assigneeDisplayName: response.assignee,
    assigneeEmail: "",
    mxVersion: response.mxVersion,
    mxBuildId: response.mxBuildId,
  };
}

export function splitIntoHeadAndPreviousRuns(
  runs: HeadScenarioRunViewModel[],
  environmentStatusMap: Map<string, EnvironmentStatus>,
  filterData: PanelFilterData
): ScenarioRunsPanelViewModel {
  const [head, ...previousRuns] = runs;
  return {
    head: applyEnvironmentStatus(head, environmentStatusMap),
    previousRuns: previousRuns.map((run) =>
      toTableViewModel(run, environmentStatusMap)
    ),
    filterData,
    totalNumberOfImpacts: new Set(runs.flatMap((r) => r.impactIds)).size,
    totalNumberOfRegressions: new Set(runs.flatMap((r) => r.regressionIds))
      .size,
    totalNumberOfIncidents: new Set(runs.flatMap((r) => r.incidentIds)).size,
  };
}

export function applyEnvironmentStatus(
  run: HeadScenarioRunViewModel,
  environmentStatusMap: Map<string, EnvironmentStatus>
): HeadScenarioRunViewModel {
  return {
    ...run,
    environmentStatus:
      environmentStatusMap.get(run.environmentId) ?? run.environmentStatus,
  };
}

export function toTableViewModel(
  run: HeadScenarioRunViewModel,
  environmentStatusMap: Map<string, EnvironmentStatus>
): ScenarioRunTableViewModel {
  return {
    id: run.id,
    name: run.name,
    status: run.status,
    environmentStatus:
      environmentStatusMap.get(run.environmentId) ?? run.environmentStatus,
    startDate: run.startDate,
    endDate: run.endDate,
    commitId: run.commitId,
    mxVersion: run.mxVersion,
    mxBuildId: run.mxBuildId,
    assigneeId: run.assigneeId,
    assigneeDisplayName: run.assigneeDisplayName,
    assigneeEmail: run.assigneeEmail,
  };
}

export function applyResolvedAssignees(
  result: ScenarioRunsPanelViewModel,
  users: UserApiResponse[]
): ScenarioRunsPanelViewModel {
  const displayNameById = new Map(
    users.map((user) => [user.id, user.displayName])
  );
  const emailById = new Map(users.map((user) => [user.id, user.mail]));

  return {
    ...result,
    head: {
      ...result.head,
      assigneeDisplayName:
        displayNameById.get(result.head.assigneeId) ??
        result.head.assigneeDisplayName,
      assigneeEmail:
        emailById.get(result.head.assigneeId) ?? result.head.assigneeEmail,
    },
    previousRuns: result.previousRuns.map((run) => ({
      ...run,
      assigneeDisplayName:
        displayNameById.get(run.assigneeId) ?? run.assigneeDisplayName,
      assigneeEmail: emailById.get(run.assigneeId) ?? run.assigneeEmail,
    })),
    filterData: result.filterData,
  };
}

export function extractUniqueEnvironmentIds(
  runs: HeadScenarioRunViewModel[]
): string[] {
  return [...new Set(runs.map((run) => run.environmentId).filter(Boolean))];
}

export function buildEnvironmentStatusMap(
  environments: { id: string; status: EnvironmentStatus }[]
): Map<string, EnvironmentStatus> {
  return new Map(
    environments.map((environment) => [environment.id, environment.status])
  );
}

export function collectUniqueAssigneeIds(
  result: ScenarioRunsPanelViewModel
): string[] {
  const allAssigneeIds = [
    result.head.assigneeId,
    ...result.previousRuns.map((run) => run.assigneeId),
  ].filter(Boolean);
  return [...new Set(allAssigneeIds)];
}

function countArrayLengths(
  a: readonly unknown[],
  b: readonly unknown[]
): number {
  return a.length + b.length;
}

export function buildIncidentStatusesByRunId(
  responses: ScenarioRunApiResponse[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const run of responses) {
    if (run.linkedIncidents.length > 0) {
      map.set(run.id, run.linkedIncidents.map((i) => i.status).filter(Boolean));
    }
  }
  return map;
}

export function computeFilterDataFromTestUnit(
  testUnit: TestUnitApiModel,
  incidentStatusesByRunId?: Map<string, string[]>,
  businessProcessChainIds?: string[]
): PanelFilterData {
  let hasWasteReasons = false;
  let hasRegressions = false;
  let hasImpacts = false;
  let hasIncidents = false;
  const statusSet = new Set<string>();

  for (const execution of testUnit.scenarioExecutions) {
    const ao = execution.analysisObjects;
    if (ao.failureReasons.length > 0) hasWasteReasons = true;
    if (
      ao.binaryRegressions.length > 0 ||
      ao.configurationRegressions.length > 0
    )
      hasRegressions = true;
    if (ao.binaryImpacts.length > 0 || ao.configurationImpacts.length > 0)
      hasImpacts = true;
    if (ao.incidents.length > 0) hasIncidents = true;
    const statuses = incidentStatusesByRunId?.get(
      execution.scenarioExecutionId
    );
    if (statuses) {
      for (const s of statuses) statusSet.add(s);
    }
  }

  return {
    hasWasteReasons,
    hasRegressions,
    hasImpacts,
    hasIncidents,
    incidentStatuses: [...statusSet],
    businessProcessChainIds: businessProcessChainIds ?? [],
  };
}

export function computeFilterDataFromApiResponses(
  responses: ScenarioRunApiResponse[],
  businessProcessChainIds?: string[]
): PanelFilterData {
  let hasWasteReasons = false;
  let hasRegressions = false;
  let hasImpacts = false;
  let hasIncidents = false;
  const statusSet = new Set<string>();

  for (const response of responses) {
    if (!response.detections) continue;
    const d = response.detections;
    if (d.failureReasonIds.length > 0) hasWasteReasons = true;
    if (
      d.binaryRegressionIds.length > 0 ||
      d.configurationRegressionIds.length > 0
    )
      hasRegressions = true;
    if (d.binaryImpactIds.length > 0 || d.configurationImpactIds.length > 0)
      hasImpacts = true;
    if (response.linkedIncidents.length > 0) {
      hasIncidents = true;
      collectIncidentStatuses(response.linkedIncidents, statusSet);
    }
  }

  return {
    hasWasteReasons,
    hasRegressions,
    hasImpacts,
    hasIncidents,
    incidentStatuses: [...statusSet],
    businessProcessChainIds: businessProcessChainIds ?? [],
  };
}

function collectIncidentStatuses(
  incidents: readonly { status?: string }[],
  statusSet: Set<string>
): void {
  for (const incident of incidents) {
    if (incident.status) statusSet.add(incident.status);
  }
}
