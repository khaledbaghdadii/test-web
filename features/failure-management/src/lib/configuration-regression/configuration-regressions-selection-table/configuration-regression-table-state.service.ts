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
import { ConfigurationRegressionTableQuery } from "./configuration-regression-table-query.model";
import {
  ConfigurationRegressionService,
  FetchConfigurationRegressionsRequest,
  FetchConfigurationRegressionsResponse,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";

@Injectable()
export class ConfigurationRegressionTableStateService implements OnDestroy {
  private readonly store = inject(Store);
  private readonly configurationRegressionService = inject(
    ConfigurationRegressionService
  );
  private readonly emptyResult: FetchConfigurationRegressionsResponse = {
    configurationRegressions: {
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
  readonly projectId = this._projectId.asReadonly();
  private readonly fixPhrase = signal<string | undefined>(undefined);
  private readonly ownerPhrase = signal<string | undefined>(undefined);
  private readonly titlePhrases = signal<string[] | undefined>(undefined);
  private readonly guiltyChangePhrases = signal<string[] | undefined>(
    undefined
  );

  private readonly fetchConfigurationRegressionsRequest =
    computed<FetchConfigurationRegressionsRequest>(() => ({
      page: this.pageIndex(),
      size: this.pageSize(),
      fixPhrase: this.fixPhrase(),
      ownerPhrase: this.ownerPhrase(),
      titlePhrases: this.titlePhrases(),
      guiltyChangePhrases: this.guiltyChangePhrases(),
    }));

  fetchConfigurationRegressionsResponse: Signal<FetchConfigurationRegressionsResponse>;
  private readonly configurationRegressionsPage = computed(
    () => this.fetchConfigurationRegressionsResponse().configurationRegressions
  );
  configurationRegressions = computed<LiteConfigurationRegression[]>(
    () => this.configurationRegressionsPage().content
  );
  totalElements = computed(
    () => this.configurationRegressionsPage().totalElements
  );

  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.getProjectId$().pipe(takeUntil(this.destroy$)).subscribe();
    const fetchConfigurationRegressionsRequest$ = toObservable(
      this.fetchConfigurationRegressionsRequest
    ).pipe(takeUntil(this.destroy$));
    const projectId$ = toObservable(this._projectId).pipe(
      takeUntil(this.destroy$)
    );

    const fetchConfigurationRegressionsResponse$ = combineLatest([
      projectId$,
      fetchConfigurationRegressionsRequest$,
      this.refresh$,
    ]).pipe(
      tap(() => {
        this._isLoading.set(true);
      }),
      switchMap(([projectId, request]) => {
        return this.configurationRegressionService
          .fetchAll(projectId, request)
          .pipe(
            catchError((error) => {
              this._errorMessage.set(error);
              return of(this.emptyResult);
            }),
            finalize(() => this._isLoading.set(false))
          );
      }),
      takeUntil(this.destroy$)
    );

    this.fetchConfigurationRegressionsResponse = toSignal(
      fetchConfigurationRegressionsResponse$,
      {
        initialValue: this.emptyResult,
      }
    );
  }

  private getProjectId$() {
    return this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(tap((projectId) => this._projectId.set(projectId)));
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  refreshConfigurationRegressions(refresh: boolean) {
    this.refresh$.next(refresh);
  }

  setConfigurationRegressionsTableQuery(
    query: ConfigurationRegressionTableQuery
  ) {
    this.pageIndex.set(query.page ?? 0);
    this.pageSize.set(query.pageSize ?? 10);
    this.titlePhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.titlePhrases)
    );
    this.guiltyChangePhrases.set(
      this.filterUndefinedAndEmptyStringArray(query.guiltyChangePhrases)
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
}
