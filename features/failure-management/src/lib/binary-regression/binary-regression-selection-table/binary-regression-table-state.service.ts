import {
  computed,
  inject,
  Injectable,
  OnDestroy,
  Signal,
  signal,
} from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import {
  FetchBinaryRegressionsRequest,
  Pageable,
} from "../model/fetch-binary-regressions-request";
import {
  FetchBinaryRegressionsResponse,
  LiteBinaryRegression,
} from "../model/lite-binary-regression.model";
import { BinaryRegressionTableQuery } from "./binary-regression-table-query.model";
import { ValidationScope } from "@mxflow/features/validation-management";

@Injectable()
export class BinaryRegressionTableStateService implements OnDestroy {
  private readonly binaryRegressionService = inject(
    BinaryRegressionDataService
  );
  private readonly emptyResult: FetchBinaryRegressionsResponse = {
    binaryRegressions: {
      content: [],
      totalElements: 0,
    },
  };

  private readonly destroy$ = new Subject();
  private readonly refresh$ = new BehaviorSubject<boolean>(false);

  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _warningMessage = signal<string | undefined>(undefined);
  private readonly pageIndex = signal<number>(0);
  private readonly size = signal<number>(10);
  private readonly fixPhrase = signal<string | undefined>(undefined);
  private readonly ownerPhrase = signal<string | undefined>(undefined);
  private readonly titlePhrases = signal<string[] | undefined>(undefined);
  private readonly defectIdPhrases = signal<string[] | undefined>(undefined);
  private readonly mxVersionPhrases = signal<string[] | undefined>(undefined);
  private readonly currentVersion = signal<string | undefined>(undefined);
  private readonly referenceVersion = signal<string | undefined>(undefined);
  private readonly returnBinaryRegressionsNotLinkedToAnyDefect =
    signal<boolean>(false);

  private readonly fetchBinaryRegressionsRequest =
    computed<FetchBinaryRegressionsRequest>(() => ({
      fixPhrase: this.fixPhrase(),
      ownerPhrase: this.ownerPhrase(),
      titlePhrases: this.titlePhrases(),
      defectIdPhrases: this.defectIdPhrases(),
      mxVersionPhrases: this.mxVersionPhrases(),
      currentVersion: this.currentVersion(),
      referenceVersion: this.referenceVersion(),
      returnBinaryRegressionsNotLinkedToAnyDefect:
        this.returnBinaryRegressionsNotLinkedToAnyDefect(),
    }));

  private readonly pageable = computed<Pageable>(() => ({
    page: this.pageIndex(),
    size: this.size(),
  }));

  fetchBinaryRegressionResponse: Signal<FetchBinaryRegressionsResponse>;
  binaryRegressionsPage = computed(
    () => this.fetchBinaryRegressionResponse().binaryRegressions
  );
  binaryRegressions = computed<LiteBinaryRegression[]>(
    () => this.binaryRegressionsPage().content
  );
  warningMessage = computed(() => this._warningMessage());
  totalElements = computed(() => this.binaryRegressionsPage().totalElements);
  page = this.pageIndex.asReadonly();
  pageSize = this.size.asReadonly();

  readonly errorMessage = computed(() => this._errorMessage());
  readonly isLoading = computed(() => this._isLoading());

  constructor() {
    const fetchBinaryRegressionsRequest$ = toObservable(
      this.fetchBinaryRegressionsRequest
    ).pipe(takeUntil(this.destroy$));
    const pageable$ = toObservable(this.pageable).pipe(
      takeUntil(this.destroy$)
    );

    const fetchBinaryRegressionsResponse$ = combineLatest([
      pageable$,
      fetchBinaryRegressionsRequest$,
      this.refresh$,
    ]).pipe(
      tap(() => {
        this._isLoading.set(true);
        this._warningMessage.set(undefined);
      }),
      switchMap(([pageable, request]) => {
        return this.binaryRegressionService.fetchAll(pageable, request).pipe(
          catchError((error) => {
            this._errorMessage.set(error);
            return of(this.emptyResult);
          }),
          tap((response) => this._warningMessage.set(response.warningMessage)),
          finalize(() => this._isLoading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    );

    this.fetchBinaryRegressionResponse = toSignal(
      fetchBinaryRegressionsResponse$,
      {
        initialValue: this.emptyResult,
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  refreshBinaryRegressions(refresh: boolean) {
    this.refresh$.next(refresh);
  }

  setBinaryRegressionsTableQuery(query: BinaryRegressionTableQuery) {
    this.pageIndex.set(query.page ?? 0);
    this.size.set(query.pageSize ?? 10);
    this.titlePhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.titlePhrases)
    );
    this.defectIdPhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.defectIdPhrases)
    );
    this.mxVersionPhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.mxVersionPhrases)
    );
    this.fixPhrase.set(this.filterUndefinedAndEmptyString(query.fixPhrase));
    this.ownerPhrase.set(this.filterUndefinedAndEmptyString(query.ownerPhrase));
  }

  private filterUndefinedAndEmptyString(value?: string | undefined) {
    return value?.trim() ? value : undefined;
  }

  filterUndefinedAndEmptyStringArray(values?: string[] | undefined) {
    if (values?.length) {
      const filteredValues = values.filter((value) =>
        this.filterUndefinedAndEmptyString(value)
      );
      return filteredValues.length > 0 ? filteredValues : undefined;
    } else {
      return undefined;
    }
  }

  setValidationScope(validationScope: ValidationScope | undefined) {
    this.currentVersion.set(validationScope?.currentVersion);
    this.referenceVersion.set(validationScope?.referenceVersion);
    this.pageIndex.set(0);
  }

  showBinaryRegressionsWithoutDefects(value: boolean) {
    this.returnBinaryRegressionsNotLinkedToAnyDefect.set(value);
  }
}
