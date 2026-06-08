import { computed, inject, Injectable, signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import { LazyLoadEvent } from "primeng/api";
import {
  WorkItemAssignableUser,
  WorkItemAssignableUsersApiResponse,
} from "../../../services/work-item-api/response/work-item-assignable-users-api-response.model";
import { WorkItemService } from "../../../services/work-item-api/work-item.service";
import { NotificationService } from "@mxflow/ui/alert";

interface AssigneesSearchState {
  projectId: string | null;
  workItemId: string | null;
  searchQuery: string;
}

@Injectable()
export class WorkItemAssigneeAutocompleteStateService {
  private readonly workItemService = inject(WorkItemService);
  private readonly notificationService = inject(NotificationService);

  private readonly CONFIG = {
    PAGE_SIZE: 25,
    INITIAL_PAGE: 0,
    SEARCH_DEBOUNCE_MS: 300,
    LAZY_LOAD_STEP: 25,
    MIN_SEARCH_LENGTH: 2,
  } as const;

  private readonly EMPTY_PAGE: WorkItemAssignableUsersApiResponse = {
    content: [],
    last: true,
  };

  private readonly searchState = signal<AssigneesSearchState>({
    projectId: null,
    workItemId: null,
    searchQuery: "",
  });

  private readonly pageIndex$ = new BehaviorSubject<number>(
    this.CONFIG.INITIAL_PAGE
  );
  private readonly shouldResetSuggestions$ = new BehaviorSubject<boolean>(
    false
  );

  readonly isLoading = signal(false);

  private readonly currentPage = toSignal(this.createPageStream(), {
    initialValue: this.EMPTY_PAGE,
  });

  readonly isLastPage = computed(() => this.currentPage().last);
  readonly assigneeSuggestions = signal<WorkItemAssignableUser[]>([]);
  readonly minSearchLength = this.CONFIG.MIN_SEARCH_LENGTH;
  readonly itemsStep = this.CONFIG.LAZY_LOAD_STEP;

  initialize(projectId: string, workItemId: string): void {
    this.searchState.set({
      projectId,
      workItemId,
      searchQuery: "",
    });
    this.pageIndex$.next(this.CONFIG.INITIAL_PAGE);
    this.assigneeSuggestions.set([]);
  }

  search(query: string): void {
    if (query.length < this.CONFIG.MIN_SEARCH_LENGTH) {
      return;
    }
    this.searchState.update((state) => ({
      ...state,
      searchQuery: query,
    }));
    this.pageIndex$.next(this.CONFIG.INITIAL_PAGE);
    this.shouldResetSuggestions$.next(true);
  }

  handleLazyLoad(event: LazyLoadEvent): void {
    const lastVisibleIndex = event.last ?? 0;
    const currentSuggestionsCount = this.assigneeSuggestions().length;
    if (
      currentSuggestionsCount === 0 ||
      this.isLoading() ||
      this.isLastPage()
    ) {
      return;
    }
    const itemsFromEnd = currentSuggestionsCount - lastVisibleIndex;
    const loadThreshold = Math.floor(this.CONFIG.LAZY_LOAD_STEP / 2);
    if (itemsFromEnd <= loadThreshold) {
      this.loadNextPage();
    }
  }

  private loadNextPage(): void {
    if (this.isLoading() || this.isLastPage()) {
      return;
    }
    this.pageIndex$.next(this.pageIndex$.value + 1);
    this.shouldResetSuggestions$.next(false);
  }

  private createPageStream(): Observable<WorkItemAssignableUsersApiResponse> {
    const debouncedSearch$ = toObservable(this.searchState).pipe(
      debounceTime(this.CONFIG.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(
        (prev, curr) =>
          prev.projectId === curr.projectId &&
          prev.workItemId === curr.workItemId &&
          prev.searchQuery === curr.searchQuery
      ),
      filter(
        (state) =>
          !!state.projectId &&
          !!state.workItemId &&
          state.searchQuery.length >= this.CONFIG.MIN_SEARCH_LENGTH
      ),
      shareReplay(1)
    );

    return combineLatest([
      debouncedSearch$,
      this.pageIndex$,
      this.shouldResetSuggestions$,
    ]).pipe(
      distinctUntilChanged(
        ([prevSearch, prevPage], [currSearch, currPage]) =>
          prevSearch.projectId === currSearch.projectId &&
          prevSearch.workItemId === currSearch.workItemId &&
          prevSearch.searchQuery === currSearch.searchQuery &&
          prevPage === currPage
      ),
      switchMap(([searchState, pageIdx, shouldReset]) =>
        this.fetchPage(
          searchState.projectId!,
          searchState.workItemId!,
          pageIdx,
          searchState.searchQuery
        ).pipe(
          map((page) => {
            if (shouldReset) {
              this.updateSuggestionsAndReset(page.content);
            } else {
              this.updateSuggestions(page.content);
            }
            return page;
          })
        )
      ),
      takeUntilDestroyed()
    );
  }

  private fetchPage(
    projectId: string,
    workItemId: string,
    pageIndex: number,
    searchQuery: string
  ): Observable<WorkItemAssignableUsersApiResponse> {
    this.isLoading.set(true);
    return this.workItemService
      .getWorkItemAssignableUsers(
        projectId,
        workItemId,
        pageIndex,
        this.CONFIG.PAGE_SIZE,
        searchQuery || undefined
      )
      .pipe(
        catchError(() => {
          this.notificationService.showError("Failed to load assignable users");
          return of(this.EMPTY_PAGE);
        }),
        finalize(() => this.isLoading.set(false))
      );
  }

  private updateSuggestions(newUsers: WorkItemAssignableUser[]): void {
    this.assigneeSuggestions.update((current) => [...current, ...newUsers]);
  }

  private updateSuggestionsAndReset(newUsers: WorkItemAssignableUser[]): void {
    this.assigneeSuggestions.set(newUsers);
    this.shouldResetSuggestions$.next(false);
  }
}
