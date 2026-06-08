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
import {
  ConfigurationImpactService,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { FetchConfigurationImpactsResponse } from "../model/fetch-configuration-impacts-response";
import { FetchConfigurationImpactsRequest } from "../model/fetch-configuration-impacts-request";
import { ConfigurationImpactTableQuery } from "./configuration-impact-table-query.model";

@Injectable()
export class ConfigurationImpactTableStateService implements OnDestroy {
  private readonly store = inject(Store);
  private readonly configurationImpactsService = inject(
    ConfigurationImpactService
  );
  private readonly emptyResult: FetchConfigurationImpactsResponse = {
    configurationImpacts: {
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
  private readonly ownerPhrase = signal<string | undefined>(undefined);
  private readonly titlePhrase = signal<string | undefined>(undefined);
  private readonly guiltyChangePhrase = signal<string | undefined>(undefined);

  private readonly fetchConfigurationImpactsRequest =
    computed<FetchConfigurationImpactsRequest>(() => ({
      page: this.pageIndex(),
      size: this.pageSize(),
      ownerPhrase: this.ownerPhrase(),
      titlePhrase: this.titlePhrase(),
      guiltyChangePhrase: this.guiltyChangePhrase(),
    }));

  fetchConfigurationImpactsResponse: Signal<FetchConfigurationImpactsResponse>;
  private readonly configurationImpactsPage = computed(
    () => this.fetchConfigurationImpactsResponse().configurationImpacts
  );
  configurationImpacts = computed<LiteConfigurationImpact[]>(
    () => this.configurationImpactsPage().content
  );
  totalElements = computed(() => this.configurationImpactsPage().totalElements);

  readonly errorMessage = this._errorMessage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.getProjectId$().pipe(takeUntil(this.destroy$)).subscribe();
    const fetchConfigurationImpactsRequest$ = toObservable(
      this.fetchConfigurationImpactsRequest
    ).pipe(takeUntil(this.destroy$));
    const projectId$ = toObservable(this._projectId).pipe(
      takeUntil(this.destroy$)
    );

    const fetchConfigurationImpactsResponse$ = combineLatest([
      projectId$,
      fetchConfigurationImpactsRequest$,
      this.refresh$,
    ]).pipe(
      tap(() => {
        this._isLoading.set(true);
      }),
      switchMap(([projectId, request]) => {
        return this.configurationImpactsService
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

    this.fetchConfigurationImpactsResponse = toSignal(
      fetchConfigurationImpactsResponse$,
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

  refreshConfigurationImpacts(refresh: boolean) {
    this.refresh$.next(refresh);
  }

  setConfigurationImpactsTableQuery(query: ConfigurationImpactTableQuery) {
    this.pageIndex.set(query.page ?? 0);
    this.pageSize.set(query.pageSize ?? 10);
    this.titlePhrase.set(query.titlePhrase);
    this.guiltyChangePhrase.set(query.guiltyChangePhrase);
    this.ownerPhrase.set(query.ownerPhrase);
  }
}
