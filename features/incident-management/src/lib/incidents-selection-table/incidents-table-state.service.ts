import {
  computed,
  inject,
  Injectable,
  OnDestroy,
  signal,
  Signal,
} from "@angular/core";
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
import { IncidentService } from "../incident.service";
import { IncidentPage } from "../model/incident-page.model";
import {
  IncidentsApiRequest,
  IncidentsFetchRequest,
  IncidentsQueryParams,
} from "@mxflow/features/incident-management";
import { IncidentsTableQuery } from "./incidents-table-query.model";
import { PreviouslyLinkedFilter } from "@mxevolve/domains/test/model";

@Injectable()
export class IncidentsTableStateService implements OnDestroy {
  private readonly incidentService = inject(IncidentService);

  private readonly destroy$ = new Subject();
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly DEFAULT_QUERY = {
    queryParams: {
      page: 0,
      size: 10,
    },
  };

  private readonly emptyIncidentPage: IncidentPage = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    size: 0,
    number: 0,
    last: true,
  };

  private readonly pageIndex = signal<number>(0);
  private readonly pageSize = signal<number>(10);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _statusOptions = signal<{ text: string; value: string }[]>(
    []
  );
  private readonly _errorMessage = signal<string | undefined>(undefined);
  private readonly _statusesErrorMessage = signal<string | undefined>(
    undefined
  );

  private readonly fetchIncidentsRequest = signal<IncidentsFetchRequest>(
    this.DEFAULT_QUERY
  );

  private readonly incidentPage: Signal<IncidentPage>;

  readonly incidents = computed(() => this.incidentPage().content);
  readonly total = computed(() => this.incidentPage().totalElements);
  readonly page = computed(() => this.pageIndex());
  readonly size = computed(() => this.pageSize());
  readonly isLoading = computed(() => this._isLoading());
  readonly statusOptions = computed(() => this._statusOptions());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly statusesErrorMessage = computed(() => this._statusesErrorMessage());

  constructor() {
    const fetchIncidentsRequest$ = toObservable(
      this.fetchIncidentsRequest
    ).pipe(takeUntil(this.destroy$));

    const incidentPage$ = combineLatest([
      fetchIncidentsRequest$,
      this.refresh$,
    ]).pipe(
      tap(() => this._isLoading.set(true)),
      switchMap(([request]) =>
        this.incidentService.fetch(request).pipe(
          catchError((error) => {
            this._errorMessage.set(error.message);
            return of(this.emptyIncidentPage);
          }),
          finalize(() => this._isLoading.set(false))
        )
      ),
      takeUntil(this.destroy$)
    );

    this.incidentPage = toSignal(incidentPage$, {
      initialValue: this.emptyIncidentPage,
    });

    this.fetchIncidentStatusesUponRefresh();
  }

  private fetchIncidentStatusesUponRefresh() {
    this.refresh$
      .pipe(
        switchMap(() =>
          this.incidentService.fetchAllStatuses().pipe(
            catchError((error) => {
              this._statusesErrorMessage.set(error.message);
              return of([]);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((statuses) => {
        this._statusOptions.set(
          statuses.map((status) => ({
            text: status,
            value: status,
          }))
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  refresh() {
    this.fetchIncidentsRequest.set(this.DEFAULT_QUERY);
    this.refresh$.next(undefined);
  }

  setPreviouslyLinkedFilterCriteria(
    filter: PreviouslyLinkedFilter | undefined
  ) {
    const currentRequest = this.fetchIncidentsRequest();
    this.fetchIncidentsRequest.set({
      ...currentRequest,
      filters: {
        ...currentRequest.filters,
        testCaseExternalIds:
          filter?.testCaseExternalIds && filter.testCaseExternalIds.length > 0
            ? filter.testCaseExternalIds
            : undefined,
        scenarioDefinitionId: filter?.scenarioDefinitionId,
      },
    });
  }

  setIncidentsTableQuery(query: IncidentsTableQuery) {
    this.fetchIncidentsRequest.set({ ...this.mapToFetchRequest(query) });
  }

  private mapToFetchRequest(
    incidentsTableQuery: IncidentsTableQuery
  ): IncidentsFetchRequest {
    const queryParams: IncidentsQueryParams = {
      page: incidentsTableQuery.page,
      size: incidentsTableQuery.pageSize,
    };

    const currentRequest = this.fetchIncidentsRequest();
    const filters: IncidentsApiRequest = {
      titlePhrase: incidentsTableQuery.titlePhrase,
      ...(incidentsTableQuery.statuses &&
      incidentsTableQuery.statuses.length > 0
        ? { statuses: incidentsTableQuery.statuses }
        : {}),
      externalIssueIdPhrase: incidentsTableQuery.externalIssueIdPhrase,
      reporterPhrase: incidentsTableQuery.reporterPhrase,
      assigneePhrase: incidentsTableQuery.assigneePhrase,
      testCaseExternalIds: currentRequest.filters?.testCaseExternalIds,
      scenarioDefinitionId: currentRequest.filters?.scenarioDefinitionId,
    };

    return {
      queryParams: queryParams,
      filters: filters,
    };
  }
}
