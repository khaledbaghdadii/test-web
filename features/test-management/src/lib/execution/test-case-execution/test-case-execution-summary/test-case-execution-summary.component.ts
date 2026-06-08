import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { TableModule } from "primeng/table";
import { FilterService } from "primeng/api";
import { DatePipe } from "@angular/common";
import { DurationPipeModule } from "@mxflow/pipe";
import { FormsModule } from "@angular/forms";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import {
  TestCaseExecutionStatus,
  TestCaseExecutionStatusDisplayValue,
} from "../status/test-case-execution-status";
import { TestCaseExecutionStatusComponent } from "../status/test-case-execution-status.component";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { Divider } from "primeng/divider";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Skeleton } from "primeng/skeleton";
import {
  catchError,
  combineLatest,
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Button } from "primeng/button";
import { AnalysisObjectLink } from "../../analysis-object-link/analysis-object-link";
import {
  BinaryImpactService,
  BinaryRegressionDataService,
  ConfigurationImpactService,
  ConfigurationRegressionService,
  DetectionCategory,
  DetectionType,
  LiteBinaryImpact,
  LiteBinaryRegression,
  LiteConfigurationImpact,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import {
  Incident,
  IncidentService,
} from "@mxflow/features/incident-management";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  LinkedDetectionData,
  TestCaseExecutionSummaryData,
} from "../test-case-execution-with-linked-analysis-objects";
import { AnalysisObjectLinksDisplayComponent } from "../../analysis-object-link/analysis-object-links-display/analysis-object-links-display.component";
import { Tooltip } from "primeng/tooltip";
import {
  AnalysisObject,
  AnalysisObjectType,
} from "@mxflow/features/analysis-objects";
import { LinkedDetectionPipe } from "../linked-detection/linked-detection.pipe";
import { LinkedIncidentPipe } from "../linked-incident/linked-incident.pipe";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { TestCaseExecutionAnalysisStatusComponent } from "../analysis-status/test-case-execution-analysis-status.component";
import {
  TestCaseExecutionAnalysisStatus,
  TestCaseExecutionAnalysisStatusDisplayValue,
} from "../analysis-status/test-case-execution-analysis-status";
import { Message } from "primeng/message";
import { TestCaseExecutionAnalyzabilityService } from "../test-case-execution-analyzability.service";
import { TestCaseTestUnitLinksDrawerComponent } from "../test-case-test-unit-links-drawer/test-case-test-unit-links-drawer.component";
import { TestCaseExecution } from "../test-case-execution";

@Component({
  selector: "mxevolve-test-case-execution-summary",
  templateUrl: "./test-case-execution-summary.component.html",
  standalone: true,
  imports: [
    TableModule,
    DatePipe,
    DurationPipeModule,
    HeaderTitleModule,
    TableCheckboxFilterComponent,
    TestCaseExecutionStatusComponent,
    Divider,
    Skeleton,
    TableEmptyMessageComponent,
    Button,
    ShowElementIfAuthorizedDirective,
    AnalysisObjectLinksDisplayComponent,
    Tooltip,
    LinkedDetectionPipe,
    LinkedIncidentPipe,
    TestCaseExecutionAnalysisStatusComponent,
    Message,
    FormsModule,
    TestCaseTestUnitLinksDrawerComponent,
  ],
})
export class TestCaseExecutionSummaryComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastMessage = inject(ToastMessageService);
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly binaryRegressionService = inject(
    BinaryRegressionDataService
  );
  private readonly configurationImpactService = inject(
    ConfigurationImpactService
  );
  private readonly configurationRegressionService = inject(
    ConfigurationRegressionService
  );
  private readonly incidentService = inject(IncidentService);
  private readonly testCaseExecutionAnalyzabilityService = inject(
    TestCaseExecutionAnalyzabilityService
  );
  private readonly jiraConfig = inject<JiraConfig>(JIRA_CONFIG);
  private readonly filterService = inject(FilterService);
  private readonly stateService = inject(
    ScenarioExecutionStateManagementService
  );
  private readonly configurationImpactLinks$ = toObservable(
    this.stateService.configurationImpactLinks
  );
  private readonly configurationRegressionLinks$ = toObservable(
    this.stateService.configurationRegressionLinks
  );
  private readonly binaryImpactLinks$ = toObservable(
    this.stateService.binaryImpactLinks
  );
  private readonly binaryRegressionLinks$ = toObservable(
    this.stateService.binaryRegressionLinks
  );
  private readonly incidentLinks$ = toObservable(
    this.stateService.incidentLinks
  );
  private readonly testCaseExecutions$ = toObservable(
    this.stateService.testCaseExecutions
  );

  protected readonly Array = Array;
  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
  protected readonly testCaseTestUnitAnalysisObjectLinksMap =
    this.stateService.testCaseTestUnitAnalysisObjectLinksMap;

  destroy$ = new Subject();
  functionalTestCaseBaseUrl: string;
  unmappedTestCaseExecutionsExist = false;
  drawerVisible = false;
  testExecutionId = signal("");
  selectedStatusFilters = signal<string[]>([]);
  selectedAnalysisStatusFilters = signal<string[]>([]);
  incidents = signal<Incident[]>([]);
  isTestCaseExecutionsLoading = signal(false);
  binaryImpacts = signal<LiteBinaryImpact[]>([]);
  binaryRegressions = signal<LiteBinaryRegression[]>([]);
  configurationImpacts = signal<LiteConfigurationImpact[]>([]);
  configurationRegressions = signal<LiteConfigurationRegression[]>([]);
  selectedTestCaseExecution = signal<TestCaseExecution | undefined>(undefined);
  displayedTestCaseExecutionCount = signal<number>(0);

  constructor() {
    const jiraConfig = this.jiraConfig;

    this.functionalTestCaseBaseUrl = jiraConfig.functionalTestCaseBaseUrl;

    this.filterService.register(
      "arrayContainsIncident",
      this.filterIncidents()
    );

    this.filterService.register(
      "arrayContainsDetection",
      this.filterDetections()
    );
  }

  ngOnInit(): void {
    this.isTestCaseExecutionsLoading.set(true);
    this.route.params
      .pipe(
        tap((params: Params) => {
          const testExecutionId = params["test-execution-id"];
          if (testExecutionId) {
            this.testExecutionId.set(testExecutionId);
            this.stateService.setCurrentlyViewedTestExecutionId(
              testExecutionId
            );
          }
        })
      )
      .subscribe();

    combineLatest([
      this.testCaseExecutions$,
      this.configurationImpactLinks$,
      this.configurationRegressionLinks$,
      this.binaryImpactLinks$,
      this.binaryRegressionLinks$,
      this.incidentLinks$,
    ])
      .pipe(
        switchMap(
          ([
            testCaseExecutions,
            configurationImpactLinks,
            configurationRegressionLinks,
            binaryImpactLinks,
            binaryRegressionLinks,
            incidentLinks,
          ]) => {
            if (!testCaseExecutions.length) {
              return of([]);
            }

            const fetchTasks = [
              this.getTestCaseExecutionLinkedBinaryImpacts$(binaryImpactLinks),
              this.getTestCaseExecutionLinkedBinaryRegressions$(
                binaryRegressionLinks
              ),
              this.getTestCaseExecutionLinkedConfigurationImpacts$(
                configurationImpactLinks
              ),
              this.getTestCaseExecutionLinkedConfigurationRegressions$(
                configurationRegressionLinks
              ),
              this.getTestCaseExecutionLinkedIncidents$(incidentLinks),
            ];

            return forkJoin(fetchTasks);
          }
        ),
        tap(() => this.isTestCaseExecutionsLoading.set(false)),
        catchError((error) => {
          this.toastMessage.showError(error);
          this.isTestCaseExecutionsLoading.set(false);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  testCaseExecutionsOfATestExecution = computed(() => {
    this.unmappedTestCaseExecutionsExist = false;
    return this.stateService
      .testCaseExecutions()
      .filter((testCaseExecution) => {
        return testCaseExecution.testExecutionId === this.testExecutionId();
      })
      .filter((testCaseExecution) => {
        if (
          this.testCaseExecutionAnalyzabilityService.isUnmapped(
            testCaseExecution
          )
        ) {
          this.unmappedTestCaseExecutionsExist = true;
        }
        return this.testCaseExecutionAnalyzabilityService.isAnalyzable(
          testCaseExecution
        );
      });
  });

  private readonly testCaseExecutionIds = computed(() => {
    return new Set(
      this.testCaseExecutionsOfATestExecution().map(
        (testCaseExecution) => testCaseExecution.id
      )
    );
  });

  analysisObjectsLinkedToTestCaseExecutions = computed(() => {
    return this.filterAnalysisObjectsLinkedToTestCaseExecution(
      this.stateService.analysisObjectLinks()
    );
  });

  analysisObjectLinkedToTestCaseExecutionsGroupedByType = computed<
    Record<string, AnalysisObjectLink[]>
  >(() => {
    const analysisObjectLinks =
      this.analysisObjectsLinkedToTestCaseExecutions();
    return analysisObjectLinks.reduce((acc, link) => {
      if (!acc[link.analysisObjectType]) {
        acc[link.analysisObjectType] = [];
      }
      acc[link.analysisObjectType].push(link);
      return acc;
    }, {} as Record<string, AnalysisObjectLink[]>);
  });

  private filterDetections() {
    return (detections: LinkedDetectionData[], filter: string): boolean => {
      if (!filter) return true;
      const filterLower = filter.toLowerCase();
      return (
        detections?.some((detection: LinkedDetectionData) =>
          detection.title.toLowerCase().includes(filterLower)
        ) ?? false
      );
    };
  }

  private filterIncidents() {
    return (incidents: Incident[], filter: string): boolean => {
      if (!filter) return true;
      const filterLower = filter.toLowerCase();
      return (
        incidents?.some((incident: Incident) =>
          incident.externalIssue.id.toLowerCase().includes(filterLower)
        ) ?? false
      );
    };
  }

  updateDisplayedTestCaseExecutionCount(event: {
    filteredValue?: unknown[] | null;
  }) {
    this.displayedTestCaseExecutionCount.set(
      event.filteredValue?.length ?? this.testCaseExecutionsSummaryData().length
    );
  }

  isLoading = computed(
    () =>
      this.stateService.isScenarioExecutionDetailsLoading() ||
      this.isTestCaseExecutionsLoading()
  );

  statusFilterOptions = Object.values(TestCaseExecutionStatus)
    .filter((status) => status !== TestCaseExecutionStatus.SKIPPED)
    .map((status) => ({
      text: TestCaseExecutionStatusDisplayValue[status],
      value: status,
    }));

  analysisStatusFilterOptions = Object.values(
    TestCaseExecutionAnalysisStatus
  ).map((status) => ({
    text: TestCaseExecutionAnalysisStatusDisplayValue[status],
    value: status,
  }));

  testCaseExecutionsSummaryData = computed<TestCaseExecutionSummaryData[]>(
    () => {
      const fetchedBinaryImpacts = this.binaryImpacts();
      const fetchedConfigurationImpacts = this.configurationImpacts();
      const fetchedBinaryRegressions = this.binaryRegressions();
      const fetchedConfigurationRegressions = this.configurationRegressions();
      const fetchedIncidents = this.incidents();

      return this.testCaseExecutionsOfATestExecution().map(
        (testCaseExecution) => {
          const testCaseExecutionId = testCaseExecution.id;

          const binaryImpactsLinkedToTestCaseExecution =
            this.getAnalysisObjectDetailsLinkedToTestCaseExecution(
              testCaseExecutionId,
              this.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
                AnalysisObjectType.BINARY_IMPACT
              ],
              fetchedBinaryImpacts
            );

          const configurationImpactsLinkedToTestCaseExecution =
            this.getAnalysisObjectDetailsLinkedToTestCaseExecution(
              testCaseExecutionId,
              this.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
                AnalysisObjectType.CONFIGURATION_IMPACT
              ],
              fetchedConfigurationImpacts
            );

          const binaryRegressionsLinkedToTestCaseExecution =
            this.getAnalysisObjectDetailsLinkedToTestCaseExecution(
              testCaseExecutionId,
              this.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
                AnalysisObjectType.BINARY_REGRESSION
              ],
              fetchedBinaryRegressions
            );

          const configurationRegressionsLinkedToTestCaseExecution =
            this.getAnalysisObjectDetailsLinkedToTestCaseExecution(
              testCaseExecutionId,
              this.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
                AnalysisObjectType.CONFIGURATION_REGRESSION
              ],
              fetchedConfigurationRegressions
            );

          const incidentsLinkedToTestCaseExecution =
            this.getAnalysisObjectDetailsLinkedToTestCaseExecution(
              testCaseExecutionId,
              this.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
                AnalysisObjectType.INCIDENT
              ],
              fetchedIncidents
            );

          const linkedRegressions: LinkedDetectionData[] =
            this.getLinkedDetectionData(
              binaryRegressionsLinkedToTestCaseExecution,
              configurationRegressionsLinkedToTestCaseExecution
            );

          const linkedImpacts: LinkedDetectionData[] =
            this.getLinkedDetectionData(
              binaryImpactsLinkedToTestCaseExecution,
              configurationImpactsLinkedToTestCaseExecution
            );

          const linkedIncidents = [
            ...incidentsLinkedToTestCaseExecution,
          ] as Incident[];

          const hasTestUnitAnalysisObjectLinks =
            this.testCaseTestUnitAnalysisObjectLinksMap().has(
              testCaseExecution.externalId
            );

          return {
            testCaseExecution: testCaseExecution,
            linkedRegressions: linkedRegressions,
            linkedImpacts: linkedImpacts,
            linkedIncidents: linkedIncidents,
            hasTestUnitAnalysisObjectLinks: hasTestUnitAnalysisObjectLinks,
          };
        }
      );
    }
  );

  private getAnalysisObjectDataLinkedToTestCaseExecution(
    analysisObjectsLinkedToTestCaseExecution: AnalysisObject[],
    analysisObjectType: DetectionType
  ): LinkedDetectionData[] {
    return analysisObjectsLinkedToTestCaseExecution.map((analysisObject) => {
      return {
        ...analysisObject,
        analysisObjectType: analysisObjectType,
      } as LinkedDetectionData;
    });
  }

  private getLinkedDetectionData(
    binaryDetectionsLinkedToTestCaseExecution: AnalysisObject[],
    configurationDetectionsLinkedToTestCaseExecution: AnalysisObject[]
  ) {
    return [
      ...this.getAnalysisObjectDataLinkedToTestCaseExecution(
        binaryDetectionsLinkedToTestCaseExecution,
        DetectionType.Binary
      ),
      ...this.getAnalysisObjectDataLinkedToTestCaseExecution(
        configurationDetectionsLinkedToTestCaseExecution,
        DetectionType.Configuration
      ),
    ];
  }

  private getAnalysisObjectDetailsLinkedToTestCaseExecution(
    testCaseExecutionId: string,
    analysisObjectLinks: AnalysisObjectLink[],
    fetchedAnalysisObjects: AnalysisObject[]
  ) {
    return fetchedAnalysisObjects.filter((analysisObject) =>
      analysisObjectLinks
        ? analysisObjectLinks.some(
            (link) =>
              link.analysisObjectId === analysisObject.id &&
              link.testCaseExecutionId === testCaseExecutionId
          )
        : false
    );
  }

  private filterAnalysisObjectsLinkedToTestCaseExecution(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    return analysisObjectLinks.filter((link) => {
      return (
        link.testCaseExecutionId &&
        this.testCaseExecutionIds().has(link.testCaseExecutionId)
      );
    });
  }

  onStatusFilterChange(selectedStatuses: string[]) {
    this.selectedStatusFilters.set(selectedStatuses);
  }

  private getTestCaseExecutionLinkedBinaryImpacts$(
    binaryImpactLinks: AnalysisObjectLink[]
  ): Observable<LiteBinaryImpact[]> {
    const binaryImpactIds = this.filterAnalysisObjectsLinkedToTestCaseExecution(
      binaryImpactLinks
    ).map((analysisObjectLink) => analysisObjectLink.analysisObjectId);
    return binaryImpactIds.length === 0
      ? of([])
      : this.binaryImpactService
          .fetchByIds(this.stateService.projectId(), binaryImpactIds)
          .pipe(
            tap((binaryImpacts) => {
              this.binaryImpacts.set(binaryImpacts);
            }),
            catchError((error) => {
              this.toastMessage.showError(error);
              return of([]);
            })
          );
  }

  private getTestCaseExecutionLinkedConfigurationImpacts$(
    configurationImpactLinks: AnalysisObjectLink[]
  ): Observable<LiteConfigurationImpact[]> {
    const configurationImpactIds =
      this.filterAnalysisObjectsLinkedToTestCaseExecution(
        configurationImpactLinks
      ).map((analysisObjectLink) => analysisObjectLink.analysisObjectId);
    return configurationImpactIds.length === 0
      ? of([])
      : this.configurationImpactService
          .fetchByIds(this.stateService.projectId(), configurationImpactIds)
          .pipe(
            tap((configurationImpacts) => {
              this.configurationImpacts.set(configurationImpacts);
            }),
            catchError((error) => {
              this.toastMessage.showError(error);
              return of([]);
            })
          );
  }

  private getTestCaseExecutionLinkedBinaryRegressions$(
    binaryRegressionLinks: AnalysisObjectLink[]
  ): Observable<LiteBinaryRegression[]> {
    const binaryRegressionIds =
      this.filterAnalysisObjectsLinkedToTestCaseExecution(
        binaryRegressionLinks
      ).map((analysisObjectLink) => analysisObjectLink.analysisObjectId);
    return binaryRegressionIds.length === 0
      ? of([])
      : this.binaryRegressionService.fetchByIds(binaryRegressionIds).pipe(
          tap((binaryRegressions) => {
            this.binaryRegressions.set(binaryRegressions);
          }),
          catchError((error) => {
            this.toastMessage.showError(error);
            return of([]);
          })
        );
  }

  private getTestCaseExecutionLinkedConfigurationRegressions$(
    configurationRegressionLinks: AnalysisObjectLink[]
  ): Observable<LiteConfigurationRegression[]> {
    const configurationRegressionIds =
      this.filterAnalysisObjectsLinkedToTestCaseExecution(
        configurationRegressionLinks
      ).map((analysisObjectLink) => analysisObjectLink.analysisObjectId);
    return configurationRegressionIds.length === 0
      ? of([])
      : this.configurationRegressionService
          .fetchByIds(this.stateService.projectId(), configurationRegressionIds)
          .pipe(
            tap((configurationRegressions) => {
              this.configurationRegressions.set(configurationRegressions);
            }),
            catchError((error) => {
              this.toastMessage.showError(error);
              return of([]);
            })
          );
  }

  private getTestCaseExecutionLinkedIncidents$(
    incidentLinks: AnalysisObjectLink[]
  ): Observable<Incident[]> {
    const incidentIds = this.filterAnalysisObjectsLinkedToTestCaseExecution(
      incidentLinks
    ).map((analysisObjectLink) => analysisObjectLink.analysisObjectId);
    return incidentIds.length === 0
      ? of([])
      : this.incidentService.fetchIncidentsByIds(incidentIds).pipe(
          tap((incidents) => {
            this.incidents.set(incidents);
          }),
          catchError((error) => {
            this.toastMessage.showError(error);
            return of([]);
          })
        );
  }

  private navigateWithoutAffectingRouteHistory(url: string) {
    this.router.navigate([url], { replaceUrl: true });
  }

  back() {
    this.navigateWithoutAffectingRouteHistory(
      `/app/${this.stateService.projectId()}/test/execution/details/${this.stateService.scenarioExecutionId()}`
    );
  }

  ngOnDestroy(): void {
    this.stateService.setCurrentlyViewedTestExecutionId(undefined);
    this.destroy$.next({});
    this.destroy$.complete();
  }

  openDrawer(testCaseSummaryData: TestCaseExecutionSummaryData) {
    this.selectedTestCaseExecution.set(testCaseSummaryData.testCaseExecution);
    this.drawerVisible = true;
  }
}
