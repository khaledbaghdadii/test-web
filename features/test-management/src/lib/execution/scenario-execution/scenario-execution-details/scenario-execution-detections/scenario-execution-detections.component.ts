import {
  Component,
  computed,
  inject,
  Input,
  OnDestroy,
  signal,
} from "@angular/core";
import {
  BinaryImpactService,
  BinaryRegressionDataService,
  ConfigurationImpactService,
  ConfigurationRegressionService,
  FailureReason,
  FailureReasonsDataService,
  LiteBinaryImpact,
  LiteBinaryRegression,
  LiteConfigurationImpact,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  catchError,
  combineLatest,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { AnalysisObjectLink } from "../../../analysis-object-link/analysis-object-link";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

@Component({
  selector: "mxevolve-scenario-execution-detections",
  templateUrl: "./scenario-execution-detections.component.html",
  standalone: false,
})
export class ScenarioExecutionDetectionsComponent implements OnDestroy {
  private configurationImpactsService = inject(ConfigurationImpactService);
  private configurationRegressionService = inject(
    ConfigurationRegressionService
  );
  private binaryRegressionService = inject(BinaryRegressionDataService);
  private binaryImpactService = inject(BinaryImpactService);
  private toastMessageService = inject(ToastMessageService);
  private failureReasonsDataService = inject(FailureReasonsDataService);

  stateService = inject(ScenarioExecutionStateManagementService);
  projectId = this.stateService.projectId;
  scenarioExecutionId = this.stateService.scenarioExecutionId;
  private _isConfigurationImpactsLoading = signal<boolean>(false);
  private _isConfigurationRegressionsLoading = signal<boolean>(false);
  private _isBinaryRegressionLoading = signal<boolean>(false);
  private _isBinaryImpactsLoading = signal<boolean>(false);
  private _configurationImpacts = signal<LiteConfigurationImpact[]>([]);
  private _configurationRegressions = signal<LiteConfigurationRegression[]>([]);
  private _binaryRegressions = signal<LiteBinaryRegression[]>([]);
  private _binaryImpacts = signal<LiteBinaryImpact[]>([]);
  isConfigurationImpactTableLoading = computed(
    () =>
      this._isConfigurationImpactsLoading() ||
      this.stateService.analysisObjectLinksLoading()
  );
  configurationImpacts = computed(() => {
    if (this.isConfigurationImpactTableLoading()) {
      return [];
    }
    return this._configurationImpacts();
  });
  isConfigurationRegressionTableLoading = computed(
    () =>
      this._isConfigurationRegressionsLoading() ||
      this.stateService.analysisObjectLinksLoading()
  );
  configurationRegressions = computed(() => {
    if (this.isConfigurationRegressionTableLoading()) {
      return [];
    }
    return this._configurationRegressions();
  });
  isBinaryRegressionTableLoading = computed(
    () =>
      this._isBinaryRegressionLoading() ||
      this.stateService.analysisObjectLinksLoading()
  );
  binaryRegressions = computed(() => {
    if (this.isBinaryRegressionTableLoading()) {
      return [];
    }
    return this._binaryRegressions();
  });
  isBinaryImpactTableLoading = computed(
    () =>
      this._isBinaryImpactsLoading() ||
      this.stateService.analysisObjectLinksLoading()
  );
  binaryImpacts = computed(() => {
    if (this.isBinaryImpactTableLoading()) {
      return [];
    }
    return this._binaryImpacts();
  });

  private _failureReasons = signal<FailureReason[]>([]);
  private _isFailureReasonsLoading = signal<boolean>(false);
  failureReasons = computed(() => {
    if (this._isFailureReasonsLoading()) {
      return [];
    }
    return this._failureReasons();
  });
  isFailureReasonsTableLoading = computed(
    () =>
      this._isFailureReasonsLoading() ||
      this.stateService.analysisObjectLinksLoading()
  );

  analysisObjectLinks$ = toObservable(this.stateService.analysisObjectLinks);
  private _isSelectedSignal = signal<boolean>(false);
  errorMessage = "Could not load detections.";
  destroy$ = new Subject();

  isUnlinkModalVisible: boolean;
  selectedAnalysisObjectId: string;
  selectedAnalysisObjectType: AnalysisObjectType;

  @Input()
  set isSelected(value: boolean) {
    this._isSelectedSignal.set(value);
    if (value) {
      this.stateService.getScenarioExecutionAnalysisObjectLinks$().subscribe();
    }
  }

  get isSelected(): boolean {
    return this._isSelectedSignal();
  }

  constructor() {
    combineLatest([this.analysisObjectLinks$])
      .pipe(
        switchMap(([analysisObjectLinks]) => {
          if (
            this.isSelected &&
            !this.stateService.analysisObjectLinksLoading()
          ) {
            return forkJoin([
              this.fetchScenarioExecutionConfigurationImpacts(
                analysisObjectLinks
              ),
              this.fetchScenarioExecutionConfigurationRegressions(
                analysisObjectLinks
              ),
              this.fetchScenarioExecutionBinaryRegressions(analysisObjectLinks),
              this.fetchScenarioExecutionBinaryImpacts(analysisObjectLinks),
              this.fetchScenarioExecutionFailureReasons(analysisObjectLinks),
            ]);
          }
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private fetchScenarioExecutionConfigurationImpacts(
    analysisObjectLinks: AnalysisObjectLink[]
  ): Observable<LiteConfigurationImpact[]> {
    const linkedConfigurationImpactIds =
      this.getDistinctLinkedConfigurationImpactIds(analysisObjectLinks);
    if (linkedConfigurationImpactIds.length > 0) {
      this._isConfigurationImpactsLoading.set(true);
      return this.configurationImpactsService
        .fetchByIds(this.projectId(), linkedConfigurationImpactIds)
        .pipe(
          tap((value) => {
            this._isConfigurationImpactsLoading.set(false);
            this._configurationImpacts.set(value);
          }),
          catchError(() => {
            this._isConfigurationImpactsLoading.set(false);
            this.displayErrorMessage(this.errorMessage);
            return of([]);
          })
        );
    } else {
      this._isConfigurationImpactsLoading.set(false);
      this._configurationImpacts.set([]);
      return of([]);
    }
  }

  private getDistinctLinkedConfigurationImpactIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    const configurationImpactIds =
      this.getLinkedConfigurationImpactIds(analysisObjectLinks);
    return this.getDistinctAnalysisObjectLinks(configurationImpactIds);
  }

  private getLinkedConfigurationImpactIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    return analysisObjectLinks
      .filter(
        (link) =>
          link.analysisObjectType === AnalysisObjectType.CONFIGURATION_IMPACT
      )
      .map((link) => link.analysisObjectId);
  }

  private fetchScenarioExecutionBinaryImpacts(
    analysisObjectLinks: AnalysisObjectLink[]
  ): Observable<LiteBinaryImpact[]> {
    const linkedBinaryImpactIds =
      this.getDistinctLinkedBinaryImpactIds(analysisObjectLinks);
    if (linkedBinaryImpactIds.length > 0) {
      this._isBinaryImpactsLoading.set(true);
      return this.binaryImpactService
        .fetchByIds(this.projectId(), linkedBinaryImpactIds)
        .pipe(
          tap((value) => {
            this._isBinaryImpactsLoading.set(false);
            this._binaryImpacts.set(value);
          }),
          catchError(() => {
            this._isBinaryImpactsLoading.set(false);

            this.displayErrorMessage(this.errorMessage);
            return of([]);
          })
        );
    } else {
      this._isBinaryImpactsLoading.set(false);
      this._binaryImpacts.set([]);
      return of([]);
    }
  }

  private getDistinctLinkedBinaryImpactIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    const binaryImpactIds = this.getLinkedBinaryImpactIds(analysisObjectLinks);
    return this.getDistinctAnalysisObjectLinks(binaryImpactIds);
  }

  private getDistinctAnalysisObjectLinks(analysisObjectLinksIds: string[]) {
    return Array.from(new Set(analysisObjectLinksIds));
  }

  private getLinkedBinaryImpactIds(analysisObjectLinks: AnalysisObjectLink[]) {
    return analysisObjectLinks
      .filter(
        (link) => link.analysisObjectType === AnalysisObjectType.BINARY_IMPACT
      )
      .map((link) => link.analysisObjectId);
  }

  private fetchScenarioExecutionConfigurationRegressions(
    analysisObjectLinks: AnalysisObjectLink[]
  ): Observable<LiteConfigurationRegression[]> {
    const linkedConfigurationRegressionIds =
      this.getDistinctLinkedConfigurationRegressionIds(analysisObjectLinks);
    if (linkedConfigurationRegressionIds.length > 0) {
      this._isConfigurationRegressionsLoading.set(true);
      return this.configurationRegressionService
        .fetchByIds(this.projectId(), linkedConfigurationRegressionIds)
        .pipe(
          tap((value) => {
            this._isConfigurationRegressionsLoading.set(false);
            this._configurationRegressions.set(value);
          }),
          catchError(() => {
            this._isConfigurationRegressionsLoading.set(false);

            this.displayErrorMessage(this.errorMessage);
            return of([]);
          })
        );
    } else {
      this._isConfigurationRegressionsLoading.set(false);
      this._configurationRegressions.set([]);
      return of([]);
    }
  }

  private getDistinctLinkedConfigurationRegressionIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    const configurationRegressionIds =
      this.getLinkedConfigurationRegressionIds(analysisObjectLinks);
    return this.getDistinctAnalysisObjectLinks(configurationRegressionIds);
  }

  private getLinkedConfigurationRegressionIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    return analysisObjectLinks
      .filter(
        (link) =>
          link.analysisObjectType ===
          AnalysisObjectType.CONFIGURATION_REGRESSION
      )
      .map((link) => link.analysisObjectId);
  }

  private fetchScenarioExecutionBinaryRegressions(
    analysisObjectLinks: AnalysisObjectLink[]
  ): Observable<LiteBinaryRegression[]> {
    const linkedBinaryRegressionIds =
      this.getDistinctLinkedBinaryRegressionIds(analysisObjectLinks);
    if (linkedBinaryRegressionIds.length > 0) {
      this._isBinaryRegressionLoading.set(true);
      return this.binaryRegressionService
        .fetchByIds(linkedBinaryRegressionIds)
        .pipe(
          tap((binaryRegressions) => {
            this._isBinaryRegressionLoading.set(false);
            this._binaryRegressions.set(binaryRegressions);
          }),
          catchError(() => {
            this._isBinaryRegressionLoading.set(false);

            this.displayErrorMessage(this.errorMessage);
            return of([]);
          })
        );
    } else {
      this._isBinaryRegressionLoading.set(false);
      this._binaryRegressions.set([]);
      return of([]);
    }
  }

  private getDistinctLinkedBinaryRegressionIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    const binaryRegressionIds =
      this.getLinkedBinaryRegressionIds(analysisObjectLinks);
    return this.getDistinctAnalysisObjectLinks(binaryRegressionIds);
  }

  private getLinkedBinaryRegressionIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    return analysisObjectLinks
      .filter(
        (link) =>
          link.analysisObjectType === AnalysisObjectType.BINARY_REGRESSION
      )
      .map((link) => link.analysisObjectId);
  }

  private fetchScenarioExecutionFailureReasons(
    analysisObjectLinks: AnalysisObjectLink[]
  ): Observable<FailureReason[]> {
    const linkedFailureReasonsIds =
      this.getDistinctLinkedFailureReasonsIds(analysisObjectLinks);
    if (linkedFailureReasonsIds.length > 0) {
      this._isFailureReasonsLoading.set(true);
      return this.failureReasonsDataService.getFailureReasons().pipe(
        map((failureReasons) =>
          failureReasons.filter((failureReason) =>
            linkedFailureReasonsIds.includes(failureReason.id)
          )
        ),
        tap((value) => {
          this._isFailureReasonsLoading.set(false);
          this._failureReasons.set(value);
        }),
        catchError(() => {
          this._isFailureReasonsLoading.set(false);

          this.displayErrorMessage(this.errorMessage);
          return of([]);
        })
      );
    } else {
      this._isFailureReasonsLoading.set(false);
      this._failureReasons.set([]);
      return of([]);
    }
  }

  private getDistinctLinkedFailureReasonsIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    const failureReasonsIds =
      this.getLinkedFailureReasonsIds(analysisObjectLinks);
    return this.getDistinctAnalysisObjectLinks(failureReasonsIds);
  }

  private getLinkedFailureReasonsIds(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    return analysisObjectLinks
      .filter(
        (link) => link.analysisObjectType === AnalysisObjectType.FAILURE_REASON
      )
      .map((link) => link.analysisObjectId);
  }

  openUnlinkModal(
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType
  ) {
    this.selectedAnalysisObjectId = analysisObjectId;
    this.selectedAnalysisObjectType = analysisObjectType;
    this.isUnlinkModalVisible = true;
  }

  private displayErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  protected readonly AnalysisObjectType = AnalysisObjectType;
}
