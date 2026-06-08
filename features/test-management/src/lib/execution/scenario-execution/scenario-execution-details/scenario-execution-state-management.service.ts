import { computed, inject, Injectable, signal } from "@angular/core";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import {
  concatMap,
  first,
  map,
  Observable,
  of,
  switchMap,
  tap,
  forkJoin,
} from "rxjs";
import {
  AnalysisObjectLink,
  TestUnitAnalysisObjectLink,
  TestCaseExecutionAnalysisObjectLinkModel,
  UpdateAnalysisObjectLinkRequest,
} from "../../analysis-object-link/analysis-object-link";
import { AnalysisObjectLinkService } from "../../analysis-object-link/analysis-object-link.service";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { TestCaseExecutionService } from "../../test-case-execution/test-case-execution.service";
import { ScenarioExecution, TestExecution } from "../scenario-execution";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { AuthorizationService } from "@mxflow/core/auth";
import { ValidationScope } from "@mxflow/features/validation-management";
import {
  Incident,
  IncidentService,
} from "@mxflow/features/incident-management";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TestUnitService } from "../../test-unit/test-unit.service";
import { TestUnitModel } from "../../test-unit/test-unit.model";
import { TestCaseExecutionAnalyzabilityService } from "../../test-case-execution/test-case-execution-analyzability.service";

@Injectable()
export class ScenarioExecutionStateManagementService {
  private readonly store = inject(Store);
  private readonly testCaseExecutionService = inject(TestCaseExecutionService);
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly analysisObjectLinkService = inject(
    AnalysisObjectLinkService
  );
  private readonly incidentService = inject(IncidentService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly testUnitService = inject(TestUnitService);
  private readonly testCaseExecutionAnalyzabilityService = inject(
    TestCaseExecutionAnalyzabilityService
  );

  private readonly _isScenarioExecutionDetailsLoading = signal(false);
  readonly isScenarioExecutionDetailsLoading =
    this._isScenarioExecutionDetailsLoading.asReadonly();

  private readonly _projectId = signal<string>("");
  readonly projectId = this._projectId.asReadonly();

  private readonly _scenarioExecutionId = signal<string>("");
  readonly scenarioExecutionId = this._scenarioExecutionId.asReadonly();

  private readonly _fetchedScenarioExecution = signal<ScenarioExecution>({
    id: this._scenarioExecutionId(),
    comment: "",
    analysisStatus: ScenarioAnalysisStatus.NA,
    testExecutions: [] as TestExecution[],
  } as ScenarioExecution);
  readonly scenarioExecution = this._fetchedScenarioExecution.asReadonly();

  private readonly _testCaseExecutionsLoading = signal<boolean>(false);
  readonly testCaseExecutionsLoading =
    this._testCaseExecutionsLoading.asReadonly();
  private readonly _testCaseExecutions = signal<TestCaseExecution[]>([]);
  readonly testCaseExecutions = this._testCaseExecutions.asReadonly();
  readonly analyzableTestCaseExecutions = computed(() =>
    this._testCaseExecutions().filter((testCaseExecution) =>
      this.testCaseExecutionAnalyzabilityService.isAnalyzable(testCaseExecution)
    )
  );
  private readonly _analysisObjectLinksLoading = signal<boolean>(false);
  readonly analysisObjectLinksLoading =
    this._analysisObjectLinksLoading.asReadonly();
  private readonly _testUnitAnalysisObjectLinksLoading = signal<boolean>(false);
  readonly testUnitAnalysisObjectLinksLoading =
    this._testUnitAnalysisObjectLinksLoading.asReadonly();
  private readonly _analysisObjectLinks = signal<AnalysisObjectLink[]>([]);
  readonly analysisObjectLinks = this._analysisObjectLinks.asReadonly();
  private readonly _testUnitAnalysisObjectLinks = signal<
    TestUnitAnalysisObjectLink[]
  >([]);
  readonly testUnitAnalysisObjectLinks =
    this._testUnitAnalysisObjectLinks.asReadonly();

  testCaseTestUnitAnalysisObjectLinksMap = computed<
    Map<string, TestUnitAnalysisObjectLink[]>
  >(() => {
    const map = new Map<string, TestUnitAnalysisObjectLink[]>();
    const testUnitAnalysisObjectLinks = this.testUnitAnalysisObjectLinks();
    testUnitAnalysisObjectLinks.forEach((link) => {
      const testCaseExternalId = link.testCaseExecution?.externalId;
      if (!testCaseExternalId) return;

      if (!map.has(testCaseExternalId)) {
        map.set(testCaseExternalId, []);
      }
      map.get(testCaseExternalId)!.push(link);
    });

    return map;
  });

  private readonly _isUserAuthorizedToAccessAnalysisObjects = signal(false);

  readonly configurationImpactLinks = computed(() =>
    this._analysisObjectLinks().filter(
      (link) =>
        link.analysisObjectType === AnalysisObjectType.CONFIGURATION_IMPACT
    )
  );
  readonly configurationRegressionLinks = computed(() =>
    this._analysisObjectLinks().filter(
      (link) =>
        link.analysisObjectType === AnalysisObjectType.CONFIGURATION_REGRESSION
    )
  );
  readonly binaryImpactLinks = computed(() =>
    this._analysisObjectLinks().filter(
      (link) => link.analysisObjectType === AnalysisObjectType.BINARY_IMPACT
    )
  );
  readonly binaryRegressionLinks = computed(() =>
    this._analysisObjectLinks().filter(
      (link) => link.analysisObjectType === AnalysisObjectType.BINARY_REGRESSION
    )
  );
  readonly incidentLinks = computed(() =>
    this._analysisObjectLinks().filter(
      (link) => link.analysisObjectType === AnalysisObjectType.INCIDENT
    )
  );

  readonly linkedIncidents = computed<Incident[]>(() =>
    this._linkedIncidents()
  );
  _linkedIncidents = signal<Incident[]>([]);

  readonly validationScope = signal<ValidationScope | undefined>(undefined);
  readonly validationScopeWarningMessage = signal<string | undefined>(
    undefined
  );

  private readonly _webReportSelectedTestCaseExecutions = signal<
    TestCaseExecution[]
  >([]);
  readonly webReportSelectedTestCaseExecutions =
    this._webReportSelectedTestCaseExecutions.asReadonly();

  private readonly _webReportCurrentlyViewedTestCaseExecution = signal<
    TestCaseExecution | undefined
  >(undefined);
  readonly webReportCurrentlyViewedTestCaseExecution =
    this._webReportCurrentlyViewedTestCaseExecution.asReadonly();

  private readonly _currentlyViewedTestExecutionId = signal<string | undefined>(
    undefined
  );
  readonly currentlyViewedTestExecutionId =
    this._currentlyViewedTestExecutionId.asReadonly();

  private readonly _testUnit = signal<TestUnitModel | undefined>(undefined);
  readonly testUnit = this._testUnit.asReadonly();

  initialize(scenarioExecutionId: string): Observable<unknown> {
    return this.getProjectId$().pipe(
      switchMap(() => this.getSelectedScenarioExecution$(scenarioExecutionId)),
      switchMap(() => this.getTestCaseExecutions$()),
      switchMap(() => this.getTestUnitById$()),
      switchMap(() => this.checkUserAccessToAnalysisObjects$()),
      switchMap(() => this.refreshAnalysisObjectLinks$())
    );
  }

  refreshAnalysisObjectLinks$(): Observable<void> {
    return forkJoin([
      this.getScenarioExecutionAnalysisObjectLinks$(),
      this.getTestUnitAnalysisObjectLinks$(),
    ]).pipe(map(() => undefined));
  }

  setAnalysisStatus(analysisStatus: ScenarioAnalysisStatus) {
    if (analysisStatus) {
      this._fetchedScenarioExecution.update((scenarioExecution) => {
        return {
          ...scenarioExecution,
          analysisStatus: analysisStatus,
        } as ScenarioExecution;
      });
    }
  }

  setWebReportSelectedTestCaseExecutions(executions: TestCaseExecution[]) {
    this._webReportSelectedTestCaseExecutions.set(executions);
  }

  setWebReportCurrentlyViewedTestCaseExecution(
    execution: TestCaseExecution | undefined
  ) {
    this._webReportCurrentlyViewedTestCaseExecution.set(execution);
  }

  setCurrentlyViewedTestExecutionId(id: string | undefined) {
    this._currentlyViewedTestExecutionId.set(id);
  }

  refreshSelectedScenarioExecution$(): Observable<void> {
    return this.getSelectedScenarioExecution$(this.scenarioExecutionId()).pipe(
      switchMap(() => this.getTestUnitById$()),
      map(() => undefined)
    );
  }

  setComment(comment: string) {
    this._fetchedScenarioExecution.update((scenarioExecution) => {
      return {
        ...scenarioExecution,
        comment: comment,
      } as ScenarioExecution;
    });
  }

  setKeptExecution(keptExecution: boolean) {
    this._fetchedScenarioExecution.update((scenarioExecution) => {
      return {
        ...scenarioExecution,
        keptExecution: keptExecution,
      };
    });
  }

  setKeptExecutionForTestUnitScenarioExecution(
    scenarioExecutionId: string,
    keptExecution: boolean
  ) {
    const testUnit = this._testUnit();
    if (!testUnit) return;

    const updatedScenarioExecutions = testUnit.scenarioExecutions.map(
      (execution) =>
        execution.id === scenarioExecutionId
          ? { ...execution, keptExecution }
          : execution
    );

    this._testUnit.update(() => ({
      ...testUnit,
      scenarioExecutions: updatedScenarioExecutions,
    }));
  }

  setLoading(isLoading: boolean) {
    this._isScenarioExecutionDetailsLoading.set(isLoading);
  }

  setValidationScope(validationScope: ValidationScope) {
    this.validationScope.set(validationScope);
  }

  setValidationScopeWarningMessage(warningMessage: string) {
    this.validationScopeWarningMessage.set(warningMessage);
  }

  updateAnalysisObjectsLinks(updateRequest: UpdateAnalysisObjectLinkRequest) {
    return this.analysisObjectLinkService
      .update(this.projectId(), this.scenarioExecutionId(), updateRequest)
      .pipe(concatMap(() => this.refreshAnalysisObjectLinks$()));
  }

  createAnalysisObjectLink(
    projectId: string,
    scenarioExecutionId: string,
    analysisObjectLink: TestCaseExecutionAnalysisObjectLinkModel
  ) {
    return this.analysisObjectLinkService
      .createLink({
        projectId,
        scenarioExecutionId,
        link: analysisObjectLink,
      })
      .pipe(concatMap(() => this.refreshAnalysisObjectLinks$()));
  }

  getTestCaseExecutions$(): Observable<TestCaseExecution[]> {
    this._testCaseExecutionsLoading.set(true);
    return this.testCaseExecutionService
      .fetch({
        projectId: this.projectId(),
        params: {
          scenarioExecutionId: this.scenarioExecutionId(),
        },
      })
      .pipe(
        tap((testCaseExecutions: TestCaseExecution[]) => {
          this._testCaseExecutions.set(testCaseExecutions);
          this._testCaseExecutionsLoading.set(false);
        })
      );
  }

  private getTestUnitById$(): Observable<TestUnitModel> {
    return this.testUnitService
      .fetchById(this.projectId(), this.scenarioExecution().testUnitId)
      .pipe(tap((testUnit: TestUnitModel) => this._testUnit.set(testUnit)));
  }

  private getSelectedScenarioExecution$(
    scenarioExecutionId: string
  ): Observable<ScenarioExecution> {
    return this.scenarioExecutionService
      .getScenarioExecution(this.projectId(), scenarioExecutionId)
      .pipe(
        tap((scenarioExecution: ScenarioExecution) => {
          this._scenarioExecutionId.set(scenarioExecution.id);
          this._fetchedScenarioExecution.set(scenarioExecution);
        })
      );
  }

  private checkUserAccessToAnalysisObjects$(): Observable<boolean> {
    return this.authorizationService
      .isAuthorized({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      })
      .pipe(
        tap((isUserAuthorizedToAccessAnalysisObjects) =>
          this._isUserAuthorizedToAccessAnalysisObjects.set(
            isUserAuthorizedToAccessAnalysisObjects
          )
        ),
        first()
      );
  }

  getScenarioExecutionAnalysisObjectLinks$(): Observable<
    AnalysisObjectLink[] | undefined
  > {
    if (this._isUserAuthorizedToAccessAnalysisObjects()) {
      this._analysisObjectLinksLoading.set(true);
      return this.analysisObjectLinkService
        .fetch(this.projectId(), this.scenarioExecutionId())
        .pipe(
          tap((analysisObjectLinks: AnalysisObjectLink[]) => {
            this._analysisObjectLinks.set(analysisObjectLinks);
            this._analysisObjectLinksLoading.set(false);
          }),
          concatMap((analysisObjectLinks) => {
            const incidentIds = Array.from(
              new Set(
                analysisObjectLinks
                  .filter(
                    (link) =>
                      link.analysisObjectType === AnalysisObjectType.INCIDENT
                  )
                  .map((link) => link.analysisObjectId)
              )
            );
            return this.getDistinctIncidents$(incidentIds).pipe(
              switchMap(() => of(analysisObjectLinks))
            );
          })
        );
    } else {
      return of(undefined);
    }
  }

  getTestUnitAnalysisObjectLinks$(): Observable<
    TestUnitAnalysisObjectLink[] | undefined
  > {
    if (this._isUserAuthorizedToAccessAnalysisObjects()) {
      this._testUnitAnalysisObjectLinksLoading.set(true);
      return this.analysisObjectLinkService
        .fetchTestUnitAnalysisObjectLinks(
          this.projectId(),
          this.scenarioExecution().testUnitId
        )
        .pipe(
          tap((testUnitAnalysisObjectLinks: TestUnitAnalysisObjectLink[]) => {
            this._testUnitAnalysisObjectLinks.set(testUnitAnalysisObjectLinks);
            this._testUnitAnalysisObjectLinksLoading.set(false);
          })
        );
    } else {
      return of([]);
    }
  }

  private getDistinctIncidents$(
    incidentLinkIds: string[]
  ): Observable<Incident[]> {
    return this.incidentService.fetchIncidentsByIds(incidentLinkIds).pipe(
      tap((incidents) => {
        this._linkedIncidents.set(incidents);
      })
    );
  }

  private getProjectId$() {
    return this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(tap((projectId) => this._projectId.set(projectId)));
  }
}
