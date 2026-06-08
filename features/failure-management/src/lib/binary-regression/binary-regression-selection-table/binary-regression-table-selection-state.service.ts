import { computed, inject, Injectable, OnDestroy, signal } from "@angular/core";
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
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { LiteBinaryRegression } from "../model/lite-binary-regression.model";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
} from "@mxflow/features/analysis-objects";

@Injectable()
export class BinaryRegressionTableSelectionStateService implements OnDestroy {
  private readonly binaryRegressionService = inject(
    BinaryRegressionDataService
  );
  private readonly destroy$ = new Subject();

  private readonly _initiallySelectedBinaryRegressionsIds = signal<string[]>(
    []
  );
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isInitiallySelectedRegressionsLoading =
    signal<boolean>(false);
  private readonly _initiallySelectedBinaryRegressions = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);

  private readonly _initiallyBinaryRegressionSelectionStates = signal<
    AnalysisObjectSelectionState<LiteBinaryRegression>[]
  >([]);

  readonly errorMessage = computed(() => this._errorMessage());
  readonly isInitiallySelectedRegressionsLoading = computed(() =>
    this._isInitiallySelectedRegressionsLoading()
  );
  readonly initiallyBinaryRegressionSelectionStates = computed<
    AnalysisObjectSelectionState<LiteBinaryRegression>[]
  >(() => this._initiallyBinaryRegressionSelectionStates());

  constructor() {
    const initiallySelectedBinaryRegressionsIds$ = toObservable(
      this._initiallySelectedBinaryRegressionsIds
    ).pipe(takeUntil(this.destroy$));

    const fetchInitiallySelectedBinaryRegressionSelectionStates$ =
      combineLatest([initiallySelectedBinaryRegressionsIds$]).pipe(
        tap(() => this._isInitiallySelectedRegressionsLoading.set(true)),
        switchMap(([initiallySelectedBinaryRegressionsIds]) => {
          return this.binaryRegressionService
            .fetchByIds(initiallySelectedBinaryRegressionsIds)
            .pipe(
              catchError((error) => {
                this._errorMessage.set(error);
                return of([]);
              }),
              finalize(() =>
                this._isInitiallySelectedRegressionsLoading.set(false)
              )
            );
        }),
        takeUntil(this.destroy$)
      );

    fetchInitiallySelectedBinaryRegressionSelectionStates$.subscribe(
      (regressions) => {
        this._initiallyBinaryRegressionSelectionStates.set(
          this.getInitiallySelectedBinaryRegressions(
            regressions,
            this._initiallySelectedBinaryRegressions()
          )
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private getInitiallySelectedBinaryRegressions(
    regressions: LiteBinaryRegression[],
    selectedBinaryRegressions: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    return regressions
      .map((analysisObject) => {
        const selectionState = selectedBinaryRegressions.find(
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

  setInitiallySelectedBinaryRegressions(
    selections: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this._initiallySelectedBinaryRegressions.set(selections);
    this._initiallySelectedBinaryRegressionsIds.set(
      selections.map((selection) => selection.analysisObject.id)
    );
  }
}
