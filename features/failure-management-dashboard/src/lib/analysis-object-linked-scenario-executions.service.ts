import { inject, Injectable } from "@angular/core";
import {
  catchError,
  forkJoin,
  groupBy,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
  toArray,
} from "rxjs";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "./model/analysis/analysis-object-linked-scenario-execution";
import {
  AnalysisObjectLinkedScenarioExecution,
  AnalysisObjectLinkService,
  FetchTestCaseExecutionsRequest,
  ScenarioExecution,
  ScenarioExecutionService,
  TestCaseExecution,
  TestCaseExecutionService,
} from "@mxflow/test-management";
import {
  GlobalAnalysisObjectType,
  ProjectSpecificAnalysisObjectType,
} from "@mxflow/features/analysis-objects";

@Injectable()
export class AnalysisObjectLinkedScenarioExecutionsService {
  private readonly analysisObjectLinkService = inject(
    AnalysisObjectLinkService
  );
  private readonly testCaseExecutionService = inject(TestCaseExecutionService);
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);

  public getProjectSpecificAnalysisObjectLinks(
    projectId: string,
    analysisObjectId: string,
    analysisObjectType: ProjectSpecificAnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails[]> {
    return this._getProjectSpecificAnalysisObjectLinkedScenarioExecutions(
      projectId,
      analysisObjectId,
      analysisObjectType
    );
  }

  public getGlobalAnalysisObjectLinks(
    analysisObjectId: string,
    analysisObjectType: GlobalAnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails[]> {
    return this._getGlobalAnalysisObjectLinkedScenarioExecutions(
      analysisObjectId,
      analysisObjectType
    );
  }

  private _getProjectSpecificAnalysisObjectLinkedScenarioExecutions(
    projectId: string,
    analysisObjectId: string,
    analysisObjectType: ProjectSpecificAnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails[]> {
    const links$ =
      this.analysisObjectLinkService.fetchProjectSpecificAnalysisObjectLinks(
        projectId,
        analysisObjectId,
        analysisObjectType
      );
    return this.groupAndFetchScenarioExecutionDetails(links$);
  }

  private _getGlobalAnalysisObjectLinkedScenarioExecutions(
    analysisObjectId: string,
    analysisObjectType: GlobalAnalysisObjectType
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails[]> {
    const linkedScenarioExecutions$ =
      this.analysisObjectLinkService.fetchGlobalAnalysisObjectLinks(
        analysisObjectId,
        analysisObjectType
      );
    return this.groupAndFetchScenarioExecutionDetails(
      linkedScenarioExecutions$
    );
  }

  private groupAndFetchScenarioExecutionDetails(
    linkedScenarioExecutions$: Observable<
      AnalysisObjectLinkedScenarioExecution[]
    >
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails[]> {
    return linkedScenarioExecutions$.pipe(
      mergeMap((linkedScenarioExecutions) => linkedScenarioExecutions),
      groupBy(
        (linkedScenarioExecution) => linkedScenarioExecution.scenarioExecutionId
      ),
      mergeMap((scenarioExecutionLinks$) =>
        scenarioExecutionLinks$.pipe(
          toArray(),
          switchMap((scenarioExecutionLinks) =>
            this.fetchLinkedScenarioExecutionDetails(scenarioExecutionLinks)
          )
        )
      ),
      toArray(),
      catchError((error) => throwError(() => new Error(error.error)))
    );
  }

  private fetchLinkedScenarioExecutionDetails(
    scenarioExecutionLinks: AnalysisObjectLinkedScenarioExecution[]
  ): Observable<AnalysisObjectLinkedScenarioExecutionDetails> {
    const scenarioExecutionLink = scenarioExecutionLinks[0];
    return forkJoin([
      this.fetchScenarioExecution(scenarioExecutionLink),
      this.getTestCaseExecutionOfScenarioExecution(scenarioExecutionLinks),
    ]).pipe(
      map(([scenarioExecution, linkedTestCaseExecutionNames]) => ({
        scenarioExecutionId: scenarioExecutionLink.scenarioExecutionId,
        scenarioDefinitionName: scenarioExecution.name,
        businessProcesses: scenarioExecution.businessProcesses,
        project: scenarioExecution.project,
        testCaseExecutions: linkedTestCaseExecutionNames,
      }))
    );
  }

  getTestCaseExecutionOfScenarioExecution(
    scenarioExecutionLinks: AnalysisObjectLinkedScenarioExecution[]
  ): Observable<TestCaseExecution[]> {
    const linkedTestCaseIds = scenarioExecutionLinks
      .map((link) => link.testCaseExecutionId as string)
      .filter((id) => !!id);
    if (linkedTestCaseIds.length === 0) {
      return of([]);
    }
    const linkedScenarioExecution = scenarioExecutionLinks[0];
    const request: FetchTestCaseExecutionsRequest = {
      projectId: linkedScenarioExecution.projectId,
      params: {
        testCaseExecutionIds: linkedTestCaseIds,
      },
    };
    return this.testCaseExecutionService.fetchAnalyzableTestCaseExecutions(
      request
    );
  }

  private fetchScenarioExecution(
    linkedScenarioExecution: AnalysisObjectLinkedScenarioExecution
  ): Observable<ScenarioExecution> {
    return this.scenarioExecutionService.getScenarioExecution(
      linkedScenarioExecution.projectId,
      linkedScenarioExecution.scenarioExecutionId
    );
  }
}
