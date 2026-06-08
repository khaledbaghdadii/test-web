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
  ConfigurationImpactService,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";

@Injectable()
export class ConfigurationImpactTableSelectionStateService
  implements OnDestroy
{
  private readonly store = inject(Store);
  private readonly configurationImpactService = inject(
    ConfigurationImpactService
  );
  private readonly destroy$ = new Subject();

  private readonly _initiallySelectedConfigurationImpactsIds = signal<string[]>(
    []
  );
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isInitiallySelectedImpactsLoading = signal<boolean>(false);
  private readonly _initiallySelectedConfigurationImpacts = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);

  private readonly _initiallyConfigurationImpactSelectionStates = signal<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  >([]);
  private readonly _projectId = signal<string>("");

  readonly projectId = this._projectId.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isInitiallySelectedImpactsLoading =
    this._isInitiallySelectedImpactsLoading.asReadonly();
  readonly initiallyConfigurationImpactSelectionStates =
    this._initiallyConfigurationImpactSelectionStates.asReadonly();

  constructor() {
    const initiallySelectedConfigurationImpactsIds$ = toObservable(
      this._initiallySelectedConfigurationImpactsIds
    ).pipe(takeUntil(this.destroy$));

    const fetchInitiallySelectedConfigurationImpactSelectionStates$ =
      this.getProjectId$().pipe(
        switchMap((projectId) =>
          combineLatest([
            of(projectId),
            initiallySelectedConfigurationImpactsIds$,
          ])
        ),
        tap(() => this._isInitiallySelectedImpactsLoading.set(true)),
        switchMap(([projectId, initiallySelectedConfigurationImpactsIds]) => {
          return this.configurationImpactService
            .fetchByIds(projectId, initiallySelectedConfigurationImpactsIds)
            .pipe(
              catchError((error) => {
                this._errorMessage.set(error);
                return of([]);
              }),
              finalize(() => this._isInitiallySelectedImpactsLoading.set(false))
            );
        }),
        takeUntil(this.destroy$)
      );

    fetchInitiallySelectedConfigurationImpactSelectionStates$.subscribe(
      (impacts) => {
        this._initiallyConfigurationImpactSelectionStates.set(
          this.getInitiallySelectedConfigurationImpacts(
            impacts,
            this._initiallySelectedConfigurationImpacts()
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

  private getInitiallySelectedConfigurationImpacts(
    impacts: LiteConfigurationImpact[],
    selectedConfigurationImpacts: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    return impacts
      .map((analysisObject) => {
        const selectionState = selectedConfigurationImpacts.find(
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

  setInitiallySelectedConfigurationImpacts(
    selections: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this._initiallySelectedConfigurationImpacts.set(selections);
    this._initiallySelectedConfigurationImpactsIds.set(
      selections.map((selection) => selection.analysisObject.id)
    );
  }
}
