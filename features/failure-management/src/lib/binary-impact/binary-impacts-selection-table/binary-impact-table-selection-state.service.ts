import { computed, inject, Injectable, OnDestroy, signal } from "@angular/core";
import {
  BinaryImpactService,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
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
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
} from "@mxflow/features/analysis-objects";
import { toObservable } from "@angular/core/rxjs-interop";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";

@Injectable()
export class BinaryImpactTableSelectionStateService implements OnDestroy {
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly store = inject(Store);

  private readonly destroy$ = new Subject();

  private readonly _initiallySelectedBinaryImpactsIds = signal<string[]>([]);
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isInitiallySelectedImpactsLoading = signal<boolean>(false);
  private readonly _initiallySelectedBinaryImpacts = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);

  private readonly _initiallyBinaryImpactSelectionStates = signal<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >([]);
  private readonly _projectId = signal<string>("");

  readonly projectId = computed(() => this._projectId());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly isInitiallySelectedImpactsLoading = computed(() =>
    this._isInitiallySelectedImpactsLoading()
  );
  readonly initiallyBinaryImpactSelectionStates = computed<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >(() => this._initiallyBinaryImpactSelectionStates());

  constructor() {
    this.getProjectId$().pipe(takeUntil(this.destroy$)).subscribe();

    const initiallySelectedBinaryImpactsIds$ = toObservable(
      this._initiallySelectedBinaryImpactsIds
    ).pipe(takeUntil(this.destroy$));
    const projectId$ = toObservable(this._projectId).pipe(
      takeUntil(this.destroy$)
    );

    const fetchInitiallySelectedBinaryImpactSelectionStates$ = combineLatest([
      projectId$,
      initiallySelectedBinaryImpactsIds$,
    ]).pipe(
      tap(() => this._isInitiallySelectedImpactsLoading.set(true)),
      switchMap(([projectId, initiallySelectedBinaryImpactsIds]) => {
        return this.binaryImpactService
          .fetchByIds(projectId, initiallySelectedBinaryImpactsIds)
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

    fetchInitiallySelectedBinaryImpactSelectionStates$.subscribe((impacts) => {
      this._initiallyBinaryImpactSelectionStates.set(
        this.getInitiallySelectedBinaryImpacts(
          impacts,
          this._initiallySelectedBinaryImpacts()
        )
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private getInitiallySelectedBinaryImpacts(
    impacts: LiteBinaryImpact[],
    selectedBinaryImpacts: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    return impacts
      .map((analysisObject) => {
        const selectionState = selectedBinaryImpacts.find(
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

  setInitiallySelectedBinaryImpacts(
    selections: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this._initiallySelectedBinaryImpacts.set(selections);
    this._initiallySelectedBinaryImpactsIds.set(
      selections.map((selection) => selection.analysisObject.id)
    );
  }

  private getProjectId$() {
    return this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(tap((projectId) => this._projectId.set(projectId)));
  }
}
