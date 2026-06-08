import {
  BinaryImpactService,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import {
  computed,
  inject,
  Injectable,
  OnDestroy,
  Signal,
  signal,
} from "@angular/core";
import { FetchBinaryImpactsResponse } from "../fetch-binary-impacts-response.model";
import { FetchBinaryImpactsQuery } from "../fetch-binary-impacts-query";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
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
import { FetchBinaryImpactsTableQuery } from "./fetch-binary-impacts-table-query.model";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { ValidationScope } from "@mxflow/features/validation-management";

@Injectable()
export class BinaryImpactTableStateService implements OnDestroy {
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly store = inject(Store);

  private readonly emptyResult: FetchBinaryImpactsResponse = {
    binaryImpacts: {
      content: [],
      totalElements: 0,
    },
  };
  private readonly destroy$ = new Subject();
  private readonly refresh$ = new BehaviorSubject<boolean>(false);
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _isLoading = signal<boolean>(false);
  private readonly pageIndex = signal<number>(0);
  private readonly pageSize = signal<number>(10);
  private readonly _projectId = signal<string>("");
  readonly projectId = computed(() => this._projectId());
  private readonly titlePhrase = signal<string | undefined>(undefined);
  private readonly ownerPhrase = signal<string | undefined>(undefined);
  private readonly upgradeImpactExternalIssuePhrase = signal<
    string | undefined
  >(undefined);
  private readonly mxVersionPhrases = signal<string[] | undefined>(undefined);
  private readonly ids = signal<string[] | undefined>(undefined);
  private readonly currentVersion = signal<string | undefined>(undefined);
  private readonly referenceVersion = signal<string | undefined>(undefined);
  private readonly _warningMessage = signal<string | undefined>(undefined);
  private readonly returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact =
    signal<boolean>(false);
  private readonly fetchBinaryImpactsRequest =
    computed<FetchBinaryImpactsQuery>(() => ({
      page: this.pageIndex(),
      size: this.pageSize(),
      ids: this.ids(),
      titlePhrase: this.titlePhrase(),
      ownerPhrase: this.ownerPhrase(),
      upgradeImpactExternalIssuePhrase: this.upgradeImpactExternalIssuePhrase(),
      mxVersionPhrases: this.mxVersionPhrases(),
      currentVersion: this.currentVersion(),
      referenceVersion: this.referenceVersion(),
      returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact:
        this.returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact(),
    }));

  fetchBinaryImpactResponse: Signal<FetchBinaryImpactsResponse>;
  binaryImpactsPage = computed(
    () =>
      this.fetchBinaryImpactResponse()?.binaryImpacts ?? {
        content: [],
        totalElements: 0,
      }
  );
  binaryImpacts = computed<LiteBinaryImpact[]>(
    () => this.binaryImpactsPage().content
  );
  totalElements = computed(() => this.binaryImpactsPage().totalElements);
  warningMessage = computed(() => this._warningMessage());
  page = this.pageIndex.asReadonly();
  size = this.pageSize.asReadonly();

  readonly errorMessage = computed(() => this._errorMessage());
  readonly isLoading = computed(() => this._isLoading());

  constructor() {
    this.getProjectId$().pipe(takeUntil(this.destroy$)).subscribe();
    const fetchBinaryImpactsRequest$ = toObservable(
      this.fetchBinaryImpactsRequest
    ).pipe(takeUntil(this.destroy$));

    const projectId$ = toObservable(this._projectId).pipe(
      takeUntil(this.destroy$)
    );

    const fetchBinaryImpactsResponse$ = combineLatest([
      projectId$,
      fetchBinaryImpactsRequest$,
      this.refresh$,
    ]).pipe(
      tap(() => {
        this._isLoading.set(true);
        this._warningMessage.set(undefined);
      }),
      switchMap(([projectId, request]) => {
        return this.binaryImpactService.fetchAll(projectId, request).pipe(
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

    this.fetchBinaryImpactResponse = toSignal(fetchBinaryImpactsResponse$, {
      initialValue: this.emptyResult,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  refreshBinaryImpacts(refresh: boolean) {
    this.refresh$.next(refresh);
  }

  setBinaryImpactsTableQuery(query: FetchBinaryImpactsTableQuery) {
    this.pageIndex.set(query.page ?? 0);
    this.pageSize.set(query.pageSize ?? 10);
    this.mxVersionPhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.mxVersionPhrases)
    );
    this.titlePhrase.set(this.filterUndefinedAndEmptyString(query.titlePhrase));
    this.ownerPhrase.set(this.filterUndefinedAndEmptyString(query.ownerPhrase));
    this.upgradeImpactExternalIssuePhrase.set(
      this.filterUndefinedAndEmptyString(query.upgradeImpactExternalIssuePhrase)
    );
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

  private getProjectId$() {
    return this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(tap((projectId) => this._projectId.set(projectId)));
  }

  setValidationScope(validationScope: ValidationScope | undefined) {
    this.currentVersion.set(validationScope?.currentVersion);
    this.referenceVersion.set(validationScope?.referenceVersion);
    this.pageIndex.set(0);
  }

  showImpactsWithoutDefects(value: boolean) {
    this.returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact.set(value);
  }
}
