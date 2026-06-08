import { Injectable, signal, computed, inject, Signal } from "@angular/core";
import {
  BehaviorSubject,
  of,
  catchError,
  map,
  Observable,
  firstValueFrom,
} from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { WorkItemStatus, WorkItemPriority } from "../../../../model/work-item";
import { WorkItemService } from "../../../../services/work-item-api/work-item.service";
import { FormatLabelPipe } from "@mxflow/pipe";
import { WorkItemBoardFilter } from "../../model/work-item-board-filter.model";
import {
  DateRange,
  WorkItemBoardFilters,
  WorkItemBoardUrlFilters,
} from "../../model/work-item-board-filters.model";
import { AuthenticationService } from "@mxflow/core/auth";
import { KanbanViewService } from "../view-modes/kanban/kanban-view.service";
import { WorkItemBoardColumnConfig } from "../../model/work-item-board-column-config.model";
import {
  CategoryOption,
  SwimlaneViewService,
} from "../view-modes/swimlane/swimlane-view.service";
import { WorkItemSwimlaneOptionType } from "../../model/work-item-swimlane-option-type.enum";
import { WorkItemBoardViewMode } from "../../model/work-item-board-view-mode.enum";
import { WorkItemBoardUrlSyncService } from "../url-sync/work-item-board-url-sync.service";
import { WorkItemBoardFilterPersistenceService } from "../filter-persistence/work-item-board-filter-persistence.service";
import {
  WorkItemChange,
  WorkItemChangeAction,
} from "../../model/work-item-change.model";
import { workItemMatchesFilter } from "./work-item-filter-matcher";

export { WorkItemBoardColumnConfig, DateRange };

type ReadonlySignals<T> = {
  readonly [K in keyof T]: Signal<T[K]>;
};

type Loader = {
  shouldLoadMore: (pos: number, height: number) => boolean;
  nextPage: () => number;
  load: (page: number) => Observable<unknown>;
};

@Injectable()
export class WorkItemBoardStateService {
  private static readonly COLUMNS: WorkItemBoardColumnConfig[] = [
    { id: "open", title: "Open", status: WorkItemStatus.OPEN },
    { id: "assigned", title: "Assigned", status: WorkItemStatus.ASSIGNED },
    { id: "underway", title: "Underway", status: WorkItemStatus.UNDERWAY },
    { id: "pending", title: "Pending", status: WorkItemStatus.PENDING },
    { id: "done", title: "Done", status: WorkItemStatus.DONE },
  ];

  private readonly workItemService = inject(WorkItemService);
  private readonly formatLabelPipe = inject(FormatLabelPipe);
  private readonly authService = inject(AuthenticationService);
  private readonly kanbanService = inject(KanbanViewService);
  private readonly swimlaneService = inject(SwimlaneViewService);
  private readonly urlSyncService = inject(WorkItemBoardUrlSyncService);
  private readonly filterPersistenceService = inject(
    WorkItemBoardFilterPersistenceService
  );

  private readonly viewModeSignal = signal<WorkItemBoardViewMode>(
    WorkItemBoardViewMode.KANBAN
  );
  private readonly searchKeySignal = signal<string>("");
  private readonly showMyTasksOnlySignal = signal<boolean>(false);
  private readonly selectedProjectsSignal = signal<string[]>([]);
  private readonly selectedObjectIdsSignal = signal<string[]>([]);
  private readonly selectedPrioritySignal = signal<WorkItemPriority | null>(
    null
  );
  private readonly selectedAssigneesSignal = signal<string[]>([]);
  private readonly selectedCategoriesSignal = signal<string[]>([]);
  private readonly selectedDateRangeSignal = signal<DateRange | null>(null);
  private readonly sortBySignal = signal<string | null>(null);
  private readonly isProjectSpecificSignal = signal<boolean>(false);
  private readonly hasInitializedSignal = signal<boolean>(false);
  readonly columnConfigs = signal(WorkItemBoardStateService.COLUMNS);
  readonly viewMode = computed(() => this.viewModeSignal());
  readonly isProjectSpecific = computed(() => this.isProjectSpecificSignal());
  readonly workItemSwimlaneConfigs = this.swimlaneService.swimlanes;
  readonly swimlaneOptions = this.swimlaneService.swimlaneOptions;

  readonly filters: ReadonlySignals<WorkItemBoardFilters> = {
    searchKey: this.searchKeySignal.asReadonly(),
    showMyTasksOnly: this.showMyTasksOnlySignal.asReadonly(),
    selectedProjects: this.selectedProjectsSignal.asReadonly(),
    selectedObjectIds: this.selectedObjectIdsSignal.asReadonly(),
    selectedPriority: this.selectedPrioritySignal.asReadonly(),
    selectedAssignees: this.selectedAssigneesSignal.asReadonly(),
    selectedCategories: this.selectedCategoriesSignal.asReadonly(),
    selectedDateRange: this.selectedDateRangeSignal.asReadonly(),
    sortBy: this.sortBySignal.asReadonly(),
  };

  private readonly availableCategoriesSubject = new BehaviorSubject<
    CategoryOption[]
  >([]);
  readonly availableCategories = toSignal(
    this.availableCategoriesSubject.asObservable(),
    { initialValue: [] as CategoryOption[] }
  );

  readonly columnsInLoadingState = computed(() => {
    return this.viewMode() === WorkItemBoardViewMode.KANBAN
      ? this.kanbanService.isLoading()
      : this.swimlaneService.isLoading();
  });

  readonly visibleWorkItems = computed(() => {
    const service = this.getCurrentViewService();
    return service.allVisibleWorkItems();
  });

  async initializeBoard(): Promise<void> {
    if (this.hasInitializedSignal()) return;
    await this.updateAvailableCategories();
    const hasUrlFilters = this.restoreFiltersFromUrl();
    if (!hasUrlFilters) {
      const hasPersistedFilters = this.restoreFiltersFromStorage();
      if (!hasPersistedFilters && this.selectedAssigneesSignal().length === 0) {
        this.setSelectedAssignees([this.authService.getUsername()]);
      }
    }
    this.hasInitializedSignal.set(true);
    this.refreshCurrentView();
  }

  setSearchKey(searchKey: string): void {
    this.searchKeySignal.set(searchKey);
    this.refreshCurrentView();
  }

  setShowMyTasksOnly(showMyTasksOnly: boolean): void {
    this.showMyTasksOnlySignal.set(showMyTasksOnly);
    this.setSelectedAssignees(
      showMyTasksOnly ? [this.authService.getUsername()] : []
    );
    this.refreshCurrentView();
  }

  async setSelectedProjects(projectIds: string[]): Promise<void> {
    this.selectedProjectsSignal.set(projectIds);
    await this.updateAvailableCategories();
    this.refreshCurrentView();
  }

  setSelectedObjectIds(objectIds: string[]): void {
    this.selectedObjectIdsSignal.set(objectIds);
    this.refreshCurrentView();
  }

  setSelectedPriority(priority: WorkItemPriority | null): void {
    this.selectedPrioritySignal.set(priority);
    if (this.sortBySignal() === WorkItemSwimlaneOptionType.PRIORITY) {
      this.swimlaneService.setSwimlanesByPriority(priority ?? undefined);
    }
    this.refreshCurrentView();
  }

  setSortBy(sortBy: string | null): void {
    this.sortBySignal.set(sortBy);
    this.viewModeSignal.set(
      sortBy ? WorkItemBoardViewMode.SWIMLANE : WorkItemBoardViewMode.KANBAN
    );
    this.configureSwimlanesForSort(sortBy);
    this.refreshCurrentView();
  }

  setSelectedAssignees(assignees: string[]): void {
    this.selectedAssigneesSignal.set(assignees);
    if (
      assignees.length === 1 &&
      assignees[0] === this.authService.getUsername()
    ) {
      this.showMyTasksOnlySignal.set(true);
    } else {
      this.showMyTasksOnlySignal.set(false);
    }
    this.refreshCurrentView();
  }

  setSelectedCategories(categories: string[]): void {
    this.selectedCategoriesSignal.set(categories);
    if (this.sortBySignal() === WorkItemSwimlaneOptionType.CATEGORY) {
      this.swimlaneService.setSwimlanesByCategories(
        this.availableCategories(),
        categories.length > 0 ? categories : undefined
      );
    }
    this.refreshCurrentView();
  }

  setSelectedDateRange(dateRange: DateRange | null): void {
    this.selectedDateRangeSignal.set(dateRange);
    if (this.sortBySignal() === WorkItemSwimlaneOptionType.DUE_DATE) {
      const dateRangeFilter = dateRange
        ? {
            from: dateRange.startDate?.toISOString(),
            to: dateRange.endDate?.toISOString(),
          }
        : undefined;
      this.swimlaneService.setSwimlanesByDueDate(dateRangeFilter);
    }
    this.refreshCurrentView();
  }

  setIsProjectSpecific(isProjectSpecific: boolean): void {
    this.isProjectSpecificSignal.set(isProjectSpecific);
  }

  getColumnStateSignalForContext(columnId: string, contextId?: string) {
    if (this.viewMode() === WorkItemBoardViewMode.KANBAN) {
      return this.kanbanService.getColumnState(columnId);
    }
    if (contextId) {
      return this.swimlaneService.getColumnStateForSwimlane(
        contextId,
        columnId
      );
    }
    return this.swimlaneService.getAggregatedColumnState(columnId);
  }

  toggleSwimlaneCollapse(swimlaneId: string): void {
    this.swimlaneService.toggleCollapse(swimlaneId);
  }

  handleBoardScroll(
    scrollPosition: number,
    scrollHeight: number,
    swimlaneId?: string
  ): void {
    const loader = this.getLoader(this.viewMode(), swimlaneId);
    if (!loader) return;
    if (!loader.shouldLoadMore(scrollPosition, scrollHeight)) return;
    const page = loader.nextPage();
    firstValueFrom(loader.load(page));
  }

  fullBoardRefresh(): void {
    this.refreshCurrentView();
  }

  applyWorkItemChanges(changes: WorkItemChange[]): void {
    const service = this.getCurrentViewService();
    const filters = this.createFilters();
    changes.forEach((change) => this.applyChange(service, change, filters));
  }

  private getCurrentViewService(): KanbanViewService | SwimlaneViewService {
    return this.viewMode() === WorkItemBoardViewMode.KANBAN
      ? this.kanbanService
      : this.swimlaneService;
  }

  private applyChange(
    service: KanbanViewService | SwimlaneViewService,
    change: WorkItemChange,
    filters: WorkItemBoardFilter
  ): void {
    switch (change.action) {
      case WorkItemChangeAction.CREATE:
        if (workItemMatchesFilter(change.workItem, filters)) {
          service.addWorkItem(change.workItem);
        }
        break;
      case WorkItemChangeAction.UPDATE:
        if (workItemMatchesFilter(change.workItem, filters)) {
          service.updateWorkItem(change.workItem);
        } else {
          service.removeWorkItem(change.workItem.id);
        }
        break;
      case WorkItemChangeAction.DELETE:
        service.removeWorkItem(change.workItemId);
        break;
    }
  }

  private restoreFiltersFromUrl(): boolean {
    const urlFilters = this.urlSyncService.getFiltersFromUrl();
    const hasFilters = this.hasAnyFilters(urlFilters);

    if (urlFilters.searchKey) this.setSearchKey(urlFilters.searchKey);
    if (urlFilters.selectedProjects?.length)
      this.setSelectedProjects(urlFilters.selectedProjects);
    if (urlFilters.selectedObjectIds?.length)
      this.setSelectedObjectIds(urlFilters.selectedObjectIds);
    if (urlFilters.selectedPriority)
      this.setSelectedPriority(urlFilters.selectedPriority);
    if (urlFilters.selectedCategories?.length)
      this.setSelectedCategories(urlFilters.selectedCategories);
    if (urlFilters.selectedDateRange)
      this.setSelectedDateRange(urlFilters.selectedDateRange);
    if (urlFilters.selectedAssignees?.length)
      this.setSelectedAssignees(urlFilters.selectedAssignees);
    if (urlFilters.sortBy) this.setSortBy(urlFilters.sortBy);

    return hasFilters;
  }

  private restoreFiltersFromStorage(): boolean {
    const storedFilters = this.filterPersistenceService.loadFilters(
      this.authService.getUsername()
    );
    if (!storedFilters) return false;

    if (storedFilters.searchKey) this.setSearchKey(storedFilters.searchKey);
    if (
      storedFilters.selectedProjects?.length &&
      !this.isProjectSpecificSignal()
    )
      this.setSelectedProjects(storedFilters.selectedProjects);
    if (storedFilters.selectedObjectIds?.length)
      this.setSelectedObjectIds(storedFilters.selectedObjectIds);
    if (storedFilters.selectedPriority)
      this.setSelectedPriority(storedFilters.selectedPriority);
    if (storedFilters.selectedCategories?.length)
      this.setSelectedCategories(storedFilters.selectedCategories);
    if (storedFilters.selectedDateRange)
      this.setSelectedDateRange(storedFilters.selectedDateRange);
    if (storedFilters.selectedAssignees?.length)
      this.setSelectedAssignees(storedFilters.selectedAssignees);
    if (storedFilters.sortBy) this.setSortBy(storedFilters.sortBy);

    return true;
  }

  private hasAnyFilters(filters: Partial<WorkItemBoardUrlFilters>): boolean {
    return Object.entries(filters).some(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value != null && value !== "";
    });
  }

  private async refreshCurrentView(): Promise<void> {
    if (!this.hasInitializedSignal()) {
      return;
    }
    await this.syncFiltersToUrl();
    const filters = this.createFilters();
    const columns = this.columnConfigs();
    const mode = this.viewMode();
    if (mode === WorkItemBoardViewMode.KANBAN) {
      await this.refreshKanbanView(columns, filters);
      return;
    }
    if (mode === WorkItemBoardViewMode.SWIMLANE) {
      await this.refreshSwimlaneView(columns, filters);
    }
  }

  private async syncFiltersToUrl(): Promise<void> {
    const urlFilters: WorkItemBoardUrlFilters = {
      searchKey: this.searchKeySignal(),
      selectedProjects: this.selectedProjectsSignal(),
      selectedPriority: this.selectedPrioritySignal(),
      selectedAssignees: this.selectedAssigneesSignal(),
      selectedCategories: this.selectedCategoriesSignal(),
      selectedDateRange: this.selectedDateRangeSignal(),
      selectedObjectIds: this.selectedObjectIdsSignal(),
      sortBy: this.sortBySignal(),
    };
    this.urlSyncService.syncFiltersToUrl(
      urlFilters,
      true,
      this.isProjectSpecificSignal()
    );
    const filtersToSave: WorkItemBoardUrlFilters =
      this.isProjectSpecificSignal()
        ? {
            ...urlFilters,
            selectedProjects:
              this.filterPersistenceService.loadFilters(
                this.authService.getUsername()
              )?.selectedProjects ?? [],
          }
        : urlFilters;
    this.filterPersistenceService.saveFilters(
      filtersToSave,
      this.authService.getUsername()
    );
  }

  private async refreshKanbanView(
    columns: readonly WorkItemBoardColumnConfig[],
    filters: WorkItemBoardFilter
  ): Promise<void> {
    this.kanbanService.reset();
    await firstValueFrom(this.kanbanService.loadData(columns, filters, 0));
  }

  private async refreshSwimlaneView(
    columns: readonly WorkItemBoardColumnConfig[],
    filters: WorkItemBoardFilter
  ): Promise<void> {
    this.swimlaneService.reset();
    const swimlanes = this.workItemSwimlaneConfigs();
    if (!swimlanes?.length) {
      return;
    }
    await Promise.all(
      swimlanes.map(({ id }) => {
        this.swimlaneService.initializeSwimlane(id, columns);
        return firstValueFrom(
          this.swimlaneService.loadSwimlaneData(id, columns, filters, 0)
        );
      })
    );
  }

  private createFilters(): WorkItemBoardFilter {
    const dateRange = this.selectedDateRangeSignal();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const filter: WorkItemBoardFilter = {
      search: this.searchKeySignal() || undefined,
      projectIds:
        this.selectedProjectsSignal().length > 0
          ? this.selectedProjectsSignal()
          : undefined,
      workItemPriority: this.selectedPrioritySignal() ?? undefined,
      workItemCategories:
        this.selectedCategoriesSignal().length > 0
          ? this.selectedCategoriesSignal()
          : undefined,
      dueDateFrom: dateRange?.startDate?.toISOString() ?? undefined,
      dueDateTo: dateRange?.endDate?.toISOString() ?? undefined,
      assignees: this.selectedAssigneesSignal() ?? undefined,
      objectIds:
        this.selectedObjectIdsSignal().length > 0
          ? this.selectedObjectIdsSignal()
          : undefined,
      resolvedDateSince: fiveDaysAgo.toISOString(),
    };
    return filter;
  }

  private getLoader(
    mode: WorkItemBoardViewMode,
    swimlaneId?: string,
    columnConfigs = this.columnConfigs(),
    filters = this.createFilters()
  ): Loader | undefined {
    switch (mode) {
      case WorkItemBoardViewMode.KANBAN:
        return {
          shouldLoadMore: (pos, h) => this.kanbanService.shouldLoadMore(pos, h),
          nextPage: () => this.kanbanService.getHighestPage() + 1,
          load: (page) =>
            this.kanbanService.loadData(columnConfigs, filters, page),
        };

      case WorkItemBoardViewMode.SWIMLANE:
        if (!swimlaneId) return undefined;
        return {
          shouldLoadMore: (pos, h) =>
            this.swimlaneService.shouldLoadMore(pos, h),
          nextPage: () => this.swimlaneService.getHighestPage(swimlaneId) + 1,
          load: (page) =>
            this.swimlaneService.loadSwimlaneData(
              swimlaneId,
              columnConfigs,
              filters,
              page
            ),
        };

      default:
        return undefined;
    }
  }

  private configureSwimlanesForSort(sortBy: string | null): void {
    if (!sortBy) return;
    const swimlaneConfigurations: Record<string, () => void> = {
      [WorkItemSwimlaneOptionType.CATEGORY]: () => {
        const categoryFilter = this.selectedCategoriesSignal();
        this.swimlaneService.setSwimlanesByCategories(
          this.availableCategories(),
          categoryFilter.length > 0 ? categoryFilter : undefined
        );
      },
      [WorkItemSwimlaneOptionType.PRIORITY]: () => {
        this.swimlaneService.setSwimlanesByPriority(
          this.selectedPrioritySignal() ?? undefined
        );
      },
      [WorkItemSwimlaneOptionType.DUE_DATE]: () => {
        const dateRange = this.selectedDateRangeSignal();
        const dateRangeFilter = dateRange
          ? {
              from: dateRange.startDate?.toISOString(),
              to: dateRange.endDate?.toISOString(),
            }
          : undefined;
        this.swimlaneService.setSwimlanesByDueDate(dateRangeFilter);
      },
    };
    swimlaneConfigurations[sortBy]?.();
  }

  private async updateAvailableCategories(): Promise<void> {
    const projectIds = this.selectedProjectsSignal();
    const categories = await firstValueFrom(
      this.workItemService
        .getWorkItemCategories(projectIds.length ? projectIds : undefined)
        .pipe(
          map((list: string[]) =>
            list.map((category) => ({
              label: this.formatLabelPipe.transform(category),
              value: category,
            }))
          ),
          catchError(() => of<CategoryOption[]>([]))
        )
    );
    this.availableCategoriesSubject.next(categories);
  }
}
