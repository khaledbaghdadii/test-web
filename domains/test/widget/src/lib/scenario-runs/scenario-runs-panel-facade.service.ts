import { inject, Injectable } from "@angular/core";
import { catchError, forkJoin, map, Observable, of, switchMap } from "rxjs";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
import { UserService } from "@mxevolve/domains/user/data-access";
import type { ScenarioRunTableViewModel } from "@mxevolve/domains/test/ui";
import {
  applyResolvedAssignees,
  buildEnvironmentStatusMap,
  buildIncidentStatusesByRunId,
  collectUniqueAssigneeIds,
  computeFilterDataFromTestUnit,
  extractUniqueEnvironmentIds,
  mapTestUnitToRuns,
  splitIntoHeadAndPreviousRuns,
} from "./scenario-runs-mapper";
import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import type { PanelFilterData } from "./panel-filter-data";

export interface DurationBreakdownData {
  readonly testExecutionTimings: readonly {
    startDate?: string;
    endDate?: string;
  }[];
  readonly deploymentStartedOn?: string;
  readonly deploymentEndedOn?: string;
}

export interface ScenarioRunsPanelViewModel {
  readonly head: HeadScenarioRunViewModel;
  readonly previousRuns: readonly ScenarioRunTableViewModel[];
  readonly filterData: PanelFilterData;
  readonly durationBreakdown?: DurationBreakdownData;
  readonly totalNumberOfImpacts: number;
  readonly totalNumberOfRegressions: number;
  readonly totalNumberOfIncidents: number;
}

export interface FetchScenarioRunsRequest {
  readonly projectId: string;
  readonly contextId?: string;
  readonly subContextId?: string;
  readonly scenarioRunIds?: string[];
}

@Injectable()
export class ScenarioRunsPanelFacadeService {
  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly managementRequestService = inject(ManagementRequestService);
  private readonly userService = inject(UserService);
  private readonly testUnitService = inject(TestUnitService);
  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );

  fetch(
    request: FetchScenarioRunsRequest
  ): Observable<ScenarioRunsPanelViewModel[]> {
    if (request.scenarioRunIds?.length) {
      return this.fetchByScenarioRunIds(
        request.projectId,
        request.scenarioRunIds
      );
    }
    return this.fetchByContext(
      request.projectId,
      request.contextId ?? "",
      request.subContextId ?? ""
    );
  }

  private fetchByContext(
    projectId: string,
    contextId: string,
    subContextId: string
  ): Observable<ScenarioRunsPanelViewModel[]> {
    return forkJoin({
      testUnits: this.testUnitService.fetch({
        projectId,
        contextId,
        subContextId,
      }),
      scenarioRuns: this.scenarioRunService.fetch(
        projectId,
        contextId,
        subContextId
      ),
    }).pipe(
      switchMap(({ testUnits, scenarioRuns }) => {
        if (testUnits.length === 0) return of([]);
        const incidentStatusesByRunId =
          buildIncidentStatusesByRunId(scenarioRuns);
        const uniqueScenarioDefIds = [
          ...new Set(testUnits.map((tu) => tu.scenarioDefinitionId)),
        ];
        return this.fetchBpcIdsByScenarioDefinitionId(
          projectId,
          uniqueScenarioDefIds
        ).pipe(
          switchMap((bpcMap) => {
            const testExecutionsByRunId = new Map(
              scenarioRuns.map((run) => [run.id, run.testExecutions ?? []])
            );
            return forkJoin(
              testUnits.map((testUnit) =>
                this.buildPanelFromRuns(
                  mapTestUnitToRuns(testUnit),
                  projectId,
                  computeFilterDataFromTestUnit(
                    testUnit,
                    incidentStatusesByRunId,
                    bpcMap.get(testUnit.scenarioDefinitionId)
                  ),
                  testExecutionsByRunId
                )
              )
            );
          })
        );
      })
    );
  }

  private fetchByScenarioRunIds(
    projectId: string,
    scenarioRunIds: string[]
  ): Observable<ScenarioRunsPanelViewModel[]> {
    return forkJoin({
      testUnits: this.testUnitService.fetch({
        projectId: projectId,
        scenarioExecutionIds: scenarioRunIds,
      }),
      scenarioRuns: this.scenarioRunService.fetch(
        projectId,
        undefined,
        undefined,
        undefined,
        scenarioRunIds
      ),
    }).pipe(
      switchMap(({ testUnits, scenarioRuns }) => {
        if (testUnits.length === 0) return of([]);
        const incidentStatusesByRunId =
          buildIncidentStatusesByRunId(scenarioRuns);
        const uniqueScenarioDefIds = [
          ...new Set(testUnits.map((tu) => tu.scenarioDefinitionId)),
        ];
        return this.fetchBpcIdsByScenarioDefinitionId(
          projectId,
          uniqueScenarioDefIds
        ).pipe(
          switchMap((bpcMap) => {
            const testExecutionsByRunId = new Map(
              scenarioRuns.map((run) => [run.id, run.testExecutions ?? []])
            );
            return forkJoin(
              testUnits.map((testUnit) =>
                this.buildPanelFromRuns(
                  mapTestUnitToRuns(testUnit),
                  projectId,
                  computeFilterDataFromTestUnit(
                    testUnit,
                    incidentStatusesByRunId,
                    bpcMap.get(testUnit.scenarioDefinitionId)
                  ),
                  testExecutionsByRunId
                )
              )
            );
          })
        );
      })
    );
  }

  private fetchBpcIdsByScenarioDefinitionId(
    projectId: string,
    scenarioDefinitionIds: string[]
  ): Observable<Map<string, string[]>> {
    if (scenarioDefinitionIds.length === 0) {
      return of(new Map());
    }
    return forkJoin(
      scenarioDefinitionIds.map((id) =>
        this.scenarioDefinitionService
          .getScenarioDefinitionById(id, projectId)
          .pipe(
            map((def) => [id, def.bpcs ?? []] as [string, string[]]),
            catchError(() => of([id, []] as [string, string[]]))
          )
      )
    ).pipe(map((entries) => new Map(entries)));
  }

  private buildPanelFromRuns(
    runs: HeadScenarioRunViewModel[],
    projectId: string,
    filterData: PanelFilterData,
    testExecutionsByRunId: Map<
      string,
      readonly { startDate?: string; endDate?: string }[]
    > = new Map()
  ): Observable<ScenarioRunsPanelViewModel> {
    return this.enrichWithEnvironmentStatuses(runs, filterData).pipe(
      switchMap((panel) =>
        this.enrichWithDurationBreakdown(
          panel,
          projectId,
          testExecutionsByRunId
        )
      ),
      switchMap((panel) => this.resolveAssigneeNames(panel, projectId))
    );
  }

  private enrichWithDurationBreakdown(
    panel: ScenarioRunsPanelViewModel,
    projectId: string,
    testExecutionsByRunId: Map<
      string,
      readonly { startDate?: string; endDate?: string }[]
    >
  ): Observable<ScenarioRunsPanelViewModel> {
    const testExecutionTimings = testExecutionsByRunId.get(panel.head.id) ?? [];
    return this.managementRequestService
      .fetchByProjectAndEnvironmentId(projectId, panel.head.environmentId)
      .pipe(
        catchError(() => of([])),
        map((requests) => {
          const deploymentRequest = requests.find(
            (r) => r.type === "deployment"
          );
          return {
            ...panel,
            durationBreakdown: {
              testExecutionTimings,
              deploymentStartedOn: deploymentRequest?.startedOn,
              deploymentEndedOn: deploymentRequest?.endedOn,
            },
          };
        })
      );
  }

  private enrichWithEnvironmentStatuses(
    runs: HeadScenarioRunViewModel[],
    filterData: PanelFilterData
  ): Observable<ScenarioRunsPanelViewModel> {
    const environmentIds = extractUniqueEnvironmentIds(runs);
    if (environmentIds.length === 0) {
      return of(splitIntoHeadAndPreviousRuns(runs, new Map(), filterData));
    }
    return this.environmentService
      .fetchByEnvironmentIds(environmentIds)
      .pipe(
        map((environments) =>
          splitIntoHeadAndPreviousRuns(
            runs,
            buildEnvironmentStatusMap(environments),
            filterData
          )
        )
      );
  }

  private resolveAssigneeNames(
    panel: ScenarioRunsPanelViewModel,
    projectId: string
  ): Observable<ScenarioRunsPanelViewModel> {
    const assigneeIds = collectUniqueAssigneeIds(panel);
    if (assigneeIds.length === 0) {
      return of(panel);
    }
    return this.userService.fetchByIds(projectId, assigneeIds).pipe(
      catchError(() => of([])),
      map((users) => applyResolvedAssignees(panel, users))
    );
  }
}
