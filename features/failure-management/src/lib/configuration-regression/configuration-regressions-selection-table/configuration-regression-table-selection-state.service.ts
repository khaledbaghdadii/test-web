import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import {
  catchError,
  combineLatest,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
} from "@mxflow/features/analysis-objects";
import {
  ConfigurationRegressionService,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";

@Injectable()
export class ConfigurationRegressionTableSelectionStateService
  implements OnDestroy
{
  private readonly store = inject(Store);
  private readonly configurationRegressionService = inject(
    ConfigurationRegressionService
  );
  private readonly destroy$ = new Subject();

  private readonly _initiallySelectedConfigurationRegressionsIds = signal<
    string[]
  >([]);
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isInitiallySelectedRegressionsLoading =
    signal<boolean>(false);
  private readonly _initiallySelectedConfigurationRegressions = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);

  private readonly _initiallyConfigurationRegressionSelectionStates = signal<
    AnalysisObjectSelectionState<LiteConfigurationRegression>[]
  >([]);
  private readonly _projectId = signal<string>("");

  readonly projectId = this._projectId.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isInitiallySelectedRegressionsLoading =
    this._isInitiallySelectedRegressionsLoading.asReadonly();
  readonly initiallyConfigurationRegressionSelectionStates =
    this._initiallyConfigurationRegressionSelectionStates.asReadonly();

  constructor() {
    this.getProjectId$().pipe(takeUntil(this.destroy$)).subscribe();
    const initiallySelectedConfigurationRegressionsIds$ = toObservable(
      this._initiallySelectedConfigurationRegressionsIds
    ).pipe(takeUntil(this.destroy$));
    const projectId$ = toObservable(this._projectId).pipe(
      takeUntil(this.destroy$)
    );

    const fetchInitiallySelectedConfigurationRegressionSelectionStates$ =
      combineLatest([
        projectId$,
        initiallySelectedConfigurationRegressionsIds$,
      ]).pipe(
        tap(() => this._isInitiallySelectedRegressionsLoading.set(true)),
        switchMap(
          ([projectId, initiallySelectedConfigurationRegressionsIds]) => {
            return this.configurationRegressionService
              .fetchByIds(
                projectId,
                initiallySelectedConfigurationRegressionsIds
              )
              .pipe(
                catchError((error) => {
                  this._errorMessage.set(error);
                  return of([]);
                }),
                finalize(() =>
                  this._isInitiallySelectedRegressionsLoading.set(false)
                )
              );
          }
        ),
        takeUntil(this.destroy$)
      );

    fetchInitiallySelectedConfigurationRegressionSelectionStates$.subscribe(
      (regressions) => {
        this._initiallyConfigurationRegressionSelectionStates.set(
          this.getInitiallySelectedConfigurationRegressions(
            regressions,
            this._initiallySelectedConfigurationRegressions()
          )
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private getProjectId$() {
    return this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(tap((projectId) => this._projectId.set(projectId)));
  }

  private getInitiallySelectedConfigurationRegressions(
    regressions: LiteConfigurationRegression[],
    selectedConfigurationRegressions: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    return regressions
      .map((analysisObject) => {
        const selectionState = selectedConfigurationRegressions.find(
          (selection) => selection.analysisObject.id === analysisObject.id
        );
        if (!selectionState) {
          return undefined;
        }
        return {
          analysisObject: analysisObject,
          selectionType: selectionState.selectionType,
          selectionMessage: selectionState.selectionMessage,
        };
      })
      .filter((item) => item !== undefined);
  }

  setInitiallySelectedConfigurationRegressions(
    selections: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this._initiallySelectedConfigurationRegressions.set(selections);
    this._initiallySelectedConfigurationRegressionsIds.set(
      selections.map((selection) => selection.analysisObject.id)
    );
  }
}
