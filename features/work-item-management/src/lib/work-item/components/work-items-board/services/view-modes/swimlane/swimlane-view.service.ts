import { WorkItemSwimlaneSelectOption } from "../../../model/work-item-swimlane-select-option";
import {
  Injectable,
  signal,
  computed,
  inject,
  type Signal,
  type WritableSignal,
} from "@angular/core";
import { Observable, finalize, tap, catchError, of, map } from "rxjs";
import {
  WorkItemStatus,
  WorkItemPriority,
  WorkItem,
} from "../../../../../model/work-item";
import { WorkItemsColumnState } from "../../../model/work-items-column-state.model";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemBoardFilter } from "../../../model/work-item-board-filter.model";
import { WorkItemsPerStatusApiResponse } from "../../../../../services/work-item-api/response/work-items-per-status-api-response.model";
import { WorkItemBoardColumnConfig } from "../../../model/work-item-board-column-config.model";
import { WorkItemSwimlaneOptionType } from "../../../model/work-item-swimlane-option-type.enum";
import { WorkItemSwimlaneConfig } from "../../../model/work-item-swimlane-config.model";
import { WorkItemSwimlaneGroupBy } from "../../../model/work-item-swimlane-group-by.enum";
import { WorkItemDueDateRange } from "../../../model/work-item-due-date-range.enum";
import { DueDateRangeCalculator } from "./calculator/due-date-range-calculator";
import { SwimlaneConfigFactory } from "./factory/swimlane-config-factory";
import {
  SwimlaneMatchStrategy,
  PrioritySwimlaneStrategy,
  CategorySwimlaneStrategy,
  DueDateSwimlaneStrategy,
} from "./strategy/swimlane-match-strategies";

export interface CategoryOption {
  label: string;
  value: string;
}

interface WorkItemLocation {
  swimlaneId: string;
  columnId: string;
}

@Injectable()
export class SwimlaneViewService {
  private static readonly ITEMS_PER_PAGE = 10;
  private static readonly LOAD_THRESHOLD = 0.8;

  private readonly workItemService = inject(WorkItemService);

  private readonly swimlaneStrategies: Map<
    WorkItemSwimlaneGroupBy,
    SwimlaneMatchStrategy
  >;

  readonly swimlaneOptions: WorkItemSwimlaneSelectOption[] = [
    { label: "Priority", value: WorkItemSwimlaneOptionType.PRIORITY },
    { label: "Category", value: WorkItemSwimlaneOptionType.CATEGORY },
    { label: "Due Date", value: WorkItemSwimlaneOptionType.DUE_DATE },
  ];

  private readonly workItemSwimlaneConfigsSignal = signal<
    WorkItemSwimlaneConfig[]
  >([]);
  readonly swimlanes = this.workItemSwimlaneConfigsSignal.asReadonly();

  private readonly swimlaneStates = new Map<
    string,
    Map<string, WritableSignal<WorkItemsColumnState>>
  >();

  private readonly columnConfigs = new Map<string, WorkItemBoardColumnConfig>();

  private readonly activeRequests = new Set<string>();

  private readonly loadingCountSignal = signal<number>(0);

  readonly isLoading = computed(() => this.loadingCountSignal() > 0);

  readonly allVisibleWorkItems = computed(() =>
    Array.from(this.swimlaneStates.values())
      .flatMap((swimlane) =>
        Array.from(swimlane.values()).flatMap((state) => state().items)
      )
      .filter(
        (item, index, self) => self.findIndex((i) => i.id === item.id) === index
      )
  );

  constructor() {
    this.swimlaneStrategies = new Map([
      [WorkItemSwimlaneGroupBy.PRIORITY, new PrioritySwimlaneStrategy()],
      [WorkItemSwimlaneGroupBy.CATEGORY, new CategorySwimlaneStrategy()],
      [
        WorkItemSwimlaneGroupBy.DUE_DATE,
        new DueDateSwimlaneStrategy(
          this.getMostRestrictiveStartDate.bind(this),
          this.getMostRestrictiveEndDate.bind(this)
        ),
      ],
    ]);
  }

  initializeSwimlane(
    swimlaneId: string,
    columns: readonly WorkItemBoardColumnConfig[]
  ): void {
    if (this.swimlaneStates.has(swimlaneId)) {
      return;
    }

    columns.forEach((column) => {
      this.columnConfigs.set(column.id, column);
    });

    const columnStates = new Map<
      string,
      WritableSignal<WorkItemsColumnState>
    >();
    columns.forEach((column) => {
      columnStates.set(column.id, signal(this.createEmptyColumnState()));
    });
    this.swimlaneStates.set(swimlaneId, columnStates);
  }

  getColumnStateForSwimlane(
    swimlaneId: string,
    columnId: string
  ): Signal<WorkItemsColumnState> {
    const swimlane = this.ensureSwimlaneExists(swimlaneId);
    const columnState = this.ensureColumnExists(swimlane, columnId);
    return columnState.asReadonly();
  }

  loadSwimlaneData(
    swimlaneId: string,
    columns: readonly WorkItemBoardColumnConfig[],
    baseFilters: WorkItemBoardFilter,
    pageNumber = 0
  ): Observable<void> {
    const swimlane = this.getWorkItemSwimlaneConfig(swimlaneId);
    if (!swimlane) {
      return of(undefined);
    }
    const statusesToLoad = this.getStatusesNeedingData(
      swimlaneId,
      columns,
      pageNumber
    );
    if (statusesToLoad.length === 0) {
      return of(undefined);
    }
    if (this.isDuplicateRequest(swimlaneId, pageNumber)) {
      return of(undefined);
    }
    return this.executeSwimlaneLoad(
      swimlane,
      statusesToLoad,
      baseFilters,
      swimlaneId,
      columns,
      pageNumber
    );
  }

  toggleCollapse(swimlaneId: string): void {
    this.updateCollapseState(swimlaneId, (current) => !current);
  }

  reset(): void {
    this.swimlaneStates.forEach((swimlane) =>
      swimlane.forEach((state) => state.set(this.createEmptyColumnState()))
    );
    this.activeRequests.clear();
    this.loadingCountSignal.set(0);
  }

  setSwimlanesByPriority(priorityFilter?: WorkItemPriority): void {
    const allSwimlanes = SwimlaneConfigFactory.createPrioritySwimlanes();
    const filteredSwimlanes = priorityFilter
      ? allSwimlanes.filter((swimlane) => swimlane.value === priorityFilter)
      : allSwimlanes;
    this.workItemSwimlaneConfigsSignal.set(filteredSwimlanes);
  }

  setSwimlanesByCategories(
    categories: CategoryOption[],
    categoryFilter?: string[]
  ): void {
    const allSwimlanes =
      SwimlaneConfigFactory.createCategorySwimlanes(categories);
    const filteredSwimlanes =
      categoryFilter && categoryFilter.length > 0
        ? allSwimlanes.filter((swimlane) =>
            categoryFilter.includes(swimlane.value)
          )
        : allSwimlanes;
    this.workItemSwimlaneConfigsSignal.set(filteredSwimlanes);
  }

  setSwimlanesByDueDate(dateRangeFilter?: {
    from?: string;
    to?: string;
  }): void {
    const allSwimlanes = SwimlaneConfigFactory.createDueDateSwimlanes();
    const filteredSwimlanes = dateRangeFilter
      ? this.filterSwimlanesByDateRange(allSwimlanes, dateRangeFilter)
      : allSwimlanes;
    this.workItemSwimlaneConfigsSignal.set(filteredSwimlanes);
  }

  shouldLoadMore(scrollPosition: number, scrollHeight: number): boolean {
    return scrollPosition >= scrollHeight * SwimlaneViewService.LOAD_THRESHOLD;
  }

  getHighestPage(swimlaneId: string): number {
    const swimlane = this.swimlaneStates.get(swimlaneId);
    return swimlane
      ? Math.max(
          0,
          ...Array.from(swimlane.values()).map((state) => state().currentPage)
        )
      : 0;
  }

  getWorkItemSwimlaneConfig(
    swimlaneId: string
  ): WorkItemSwimlaneConfig | undefined {
    return this.swimlanes().find(
      (s: WorkItemSwimlaneConfig) => s.id === swimlaneId
    );
  }

  addWorkItem(workItem: WorkItem): void {
    const columnId = this.getColumnIdByStatus(workItem.workItemStatus);
    if (!columnId) return;
    const swimlaneIds = this.findSwimlanesForWorkItem(workItem);
    swimlaneIds.forEach((swimlaneId) => {
      this.addWorkItemToColumn(workItem, swimlaneId, columnId);
    });
  }

  updateWorkItem(workItem: WorkItem): void {
    const oldLocations = this.findWorkItemLocation(workItem.id);
    if (!oldLocations?.length) return;
    const newColumnId = this.getColumnIdByStatus(workItem.workItemStatus);
    if (!newColumnId) return;
    const newSwimlaneIds = this.findSwimlanesForWorkItem(workItem);
    this.removeWorkItemFromOldLocations(
      workItem.id,
      oldLocations,
      newSwimlaneIds,
      newColumnId
    );
    this.addOrUpdateWorkItemInNewLocations(
      workItem,
      newSwimlaneIds,
      newColumnId
    );
  }

  removeWorkItem(workItemId: string): void {
    const locations = this.findWorkItemLocation(workItemId);
    if (!locations) return;
    locations.forEach(({ swimlaneId, columnId }) => {
      this.removeWorkItemFromSwimlaneColumn(workItemId, swimlaneId, columnId);
    });
  }

  getAggregatedColumnState(columnId: string): Signal<WorkItemsColumnState> {
    return computed(() => {
      const swimlanes = this.swimlanes();
      return swimlanes.reduce(
        (acc, swimlane) => {
          const state = this.getColumnStateForSwimlane(swimlane.id, columnId)();
          return {
            totalItems: acc.totalItems + state.totalItems,
            currentPage: Math.max(acc.currentPage, state.currentPage),
            items: [...acc.items, ...state.items],
            isLastPage: acc.isLastPage && state.isLastPage,
          };
        },
        {
          totalItems: 0,
          currentPage: 0,
          items: [],
          isLastPage: true,
        } as WorkItemsColumnState
      );
    });
  }

  private ensureSwimlaneExists(
    swimlaneId: string
  ): Map<string, WritableSignal<WorkItemsColumnState>> {
    if (!this.swimlaneStates.has(swimlaneId)) {
      this.swimlaneStates.set(swimlaneId, new Map());
    }
    return this.swimlaneStates.get(swimlaneId)!;
  }

  private ensureColumnExists(
    swimlane: Map<string, WritableSignal<WorkItemsColumnState>>,
    columnId: string
  ): WritableSignal<WorkItemsColumnState> {
    if (!swimlane.has(columnId)) {
      swimlane.set(columnId, signal(this.createEmptyColumnState()));
    }
    return swimlane.get(columnId)!;
  }

  private isDuplicateRequest(swimlaneId: string, pageNumber: number): boolean {
    const requestKey = this.createRequestKey(swimlaneId, pageNumber);
    return this.activeRequests.has(requestKey);
  }

  private executeSwimlaneLoad(
    swimlane: WorkItemSwimlaneConfig,
    statusesToLoad: WorkItemStatus[],
    baseFilters: WorkItemBoardFilter,
    swimlaneId: string,
    columns: readonly WorkItemBoardColumnConfig[],
    pageNumber: number
  ): Observable<void> {
    const requestKey = this.createRequestKey(swimlaneId, pageNumber);
    this.markRequestStart(requestKey);
    const filters = this.buildSwimlaneFilters(swimlane, baseFilters);
    filters.workItemStatuses = statusesToLoad;
    return this.workItemService
      .getWorkItemsPerStatus(
        filters,
        pageNumber,
        SwimlaneViewService.ITEMS_PER_PAGE
      )
      .pipe(
        tap((response) => {
          this.applyResponseToColumns(
            swimlaneId,
            columns,
            response,
            pageNumber,
            statusesToLoad
          );
          if (pageNumber === 0) {
            const hasItems = this.responseHasItems(response);
            this.updateCollapseState(swimlaneId, () => !hasItems);
          }
        }),
        catchError(() => of(null)),
        finalize(() => this.markRequestComplete(requestKey)),
        map(() => undefined)
      );
  }

  private createRequestKey(swimlaneId: string, pageNumber: number): string {
    return `${swimlaneId}:${pageNumber}`;
  }

  private markRequestStart(requestKey: string): void {
    this.activeRequests.add(requestKey);
    this.loadingCountSignal.update((count) => count + 1);
  }

  private markRequestComplete(requestKey: string): void {
    this.activeRequests.delete(requestKey);
    this.loadingCountSignal.update((count) => count - 1);
  }

  private createEmptyColumnState(): WorkItemsColumnState {
    return {
      items: [],
      currentPage: 0,
      isLastPage: false,
      totalItems: 0,
    };
  }

  private getStatusesNeedingData(
    swimlaneId: string,
    columns: readonly WorkItemBoardColumnConfig[],
    pageNumber: number
  ): WorkItemStatus[] {
    const swimlane = this.swimlaneStates.get(swimlaneId);
    if (!swimlane) {
      return pageNumber === 0 ? columns.map((col) => col.status) : [];
    }
    return columns
      .filter((column) =>
        this.columnNeedsPage(swimlane.get(column.id), pageNumber)
      )
      .map((column) => column.status);
  }

  private columnNeedsPage(
    state: WritableSignal<WorkItemsColumnState> | undefined,
    pageNumber: number
  ): boolean {
    if (!state) {
      return pageNumber === 0;
    }
    const current = state();
    if (pageNumber === 0) {
      return true;
    }
    if (current.isLastPage) {
      return false;
    }
    return current.currentPage < pageNumber;
  }

  private filterSwimlanesByDateRange(
    swimlanes: WorkItemSwimlaneConfig[],
    userDateRange: { from?: string; to?: string }
  ): WorkItemSwimlaneConfig[] {
    if (!userDateRange.from && !userDateRange.to) {
      return swimlanes;
    }
    return swimlanes.filter((swimlane) => {
      const swimlaneRange = DueDateRangeCalculator.getDateRangeFilter(
        swimlane.value as WorkItemDueDateRange
      );
      return this.isDateRangeOverlapping(userDateRange, swimlaneRange);
    });
  }

  private isDateRangeOverlapping(
    userRange: { from?: string; to?: string },
    swimlaneRange: { from?: string; to?: string }
  ): boolean {
    const userStart = userRange.from ? new Date(userRange.from) : null;
    const userEnd = userRange.to ? new Date(userRange.to) : null;
    const swimlaneStart = swimlaneRange.from
      ? new Date(swimlaneRange.from)
      : null;
    const swimlaneEnd = swimlaneRange.to ? new Date(swimlaneRange.to) : null;
    if (!swimlaneEnd || !userEnd) {
      return this.hasUnboundedOverlap(
        userStart,
        userEnd,
        swimlaneStart,
        swimlaneEnd
      );
    }
    const startsBeforeEnd = !userStart || userStart <= swimlaneEnd;
    const endsAfterStart = !swimlaneStart || userEnd >= swimlaneStart;
    return startsBeforeEnd && endsAfterStart;
  }

  private hasUnboundedOverlap(
    userStart: Date | null,
    userEnd: Date | null,
    swimlaneStart: Date | null,
    swimlaneEnd: Date | null
  ): boolean {
    if (!swimlaneEnd) {
      if (!userEnd) return true;
      if (!swimlaneStart) return true;
      return userEnd >= swimlaneStart;
    }
    if (!userStart) return true;
    return userStart <= swimlaneEnd;
  }

  private buildSwimlaneFilters(
    swimlane: WorkItemSwimlaneConfig,
    baseFilters: WorkItemBoardFilter
  ): WorkItemBoardFilter {
    const filters = { ...baseFilters };
    const strategy = this.swimlaneStrategies.get(swimlane.groupBy);
    if (strategy) {
      strategy.applyFilter(filters, swimlane.value);
    }
    return filters;
  }

  private getMostRestrictiveStartDate(
    baseDate: string | undefined,
    swimlaneDate: string | undefined
  ): string | undefined {
    if (!baseDate) return swimlaneDate;
    if (!swimlaneDate) return baseDate;
    return new Date(baseDate) > new Date(swimlaneDate)
      ? baseDate
      : swimlaneDate;
  }

  private getMostRestrictiveEndDate(
    baseDate: string | undefined,
    swimlaneDate: string | undefined
  ): string | undefined {
    if (!baseDate) return swimlaneDate;
    if (!swimlaneDate) return baseDate;
    return new Date(baseDate) < new Date(swimlaneDate)
      ? baseDate
      : swimlaneDate;
  }

  private applyResponseToColumns(
    swimlaneId: string,
    columns: readonly WorkItemBoardColumnConfig[],
    response: WorkItemsPerStatusApiResponse,
    pageNumber: number,
    statuses: WorkItemStatus[]
  ): void {
    const swimlane = this.swimlaneStates.get(swimlaneId);
    if (!swimlane) return;
    statuses.forEach((status) => {
      const column = columns.find((col) => col.status === status);
      if (column) {
        this.updateColumnWithResponse(
          swimlane,
          column.id,
          response[status],
          pageNumber
        );
      }
    });
  }

  private updateColumnWithResponse(
    swimlane: Map<string, WritableSignal<WorkItemsColumnState>>,
    columnId: string,
    statusResponse:
      | { content: WorkItem[]; last: boolean; totalElements: number }
      | undefined,
    pageNumber: number
  ): void {
    const state = swimlane.get(columnId);
    if (!state || !statusResponse) return;
    const currentState = state();
    const items =
      pageNumber === 0
        ? statusResponse.content
        : [...currentState.items, ...statusResponse.content];
    state.set({
      items,
      currentPage: pageNumber,
      isLastPage: statusResponse.last,
      totalItems: statusResponse.totalElements,
    });
  }

  private responseHasItems(response: WorkItemsPerStatusApiResponse): boolean {
    return Object.values(response).some(
      (statusResponse) => statusResponse && statusResponse.totalElements > 0
    );
  }

  private updateCollapseState(
    swimlaneId: string,
    nextState: (current: boolean) => boolean
  ): void {
    const swimlanes = this.workItemSwimlaneConfigsSignal();
    let hasChanges = false;
    const updated = swimlanes.map((swimlane: WorkItemSwimlaneConfig) => {
      if (swimlane.id !== swimlaneId) {
        return swimlane;
      }
      const next = nextState(!!swimlane.isCollapsed);
      if (next === swimlane.isCollapsed) {
        return swimlane;
      }
      hasChanges = true;
      return { ...swimlane, isCollapsed: next };
    });
    if (hasChanges) {
      this.workItemSwimlaneConfigsSignal.set(updated);
    }
  }

  private getColumnIdByStatus(status: WorkItemStatus): string | undefined {
    for (const [columnId, config] of this.columnConfigs.entries()) {
      if (config.status === status) return columnId;
    }
    return undefined;
  }

  private findSwimlanesForWorkItem(workItem: WorkItem): string[] {
    return this.workItemSwimlaneConfigsSignal()
      .filter((swimlane: WorkItemSwimlaneConfig) =>
        this.workItemMatchesSwimlane(workItem, swimlane)
      )
      .map((swimlane: WorkItemSwimlaneConfig) => swimlane.id);
  }

  private workItemMatchesSwimlane(
    workItem: WorkItem,
    swimlane: WorkItemSwimlaneConfig
  ): boolean {
    const strategy = this.swimlaneStrategies.get(swimlane.groupBy);
    return strategy ? strategy.matches(workItem, swimlane.value) : false;
  }

  private findWorkItemLocation(
    workItemId: string
  ): WorkItemLocation[] | undefined {
    const locations = Array.from(this.swimlaneStates.entries()).flatMap(
      ([swimlaneId, swimlane]) =>
        Array.from(swimlane.entries())
          .filter(([, state]) =>
            state().items.some((item) => item.id === workItemId)
          )
          .map(([columnId]): WorkItemLocation => ({ swimlaneId, columnId }))
    );

    return locations.length > 0 ? locations : undefined;
  }

  private removeWorkItemFromSwimlaneColumn(
    workItemId: string,
    swimlaneId: string,
    columnId: string
  ): void {
    const columnState = this.getColumnState(swimlaneId, columnId);
    if (!columnState) return;

    const current = columnState();
    columnState.set({
      ...current,
      items: current.items.filter((item: WorkItem) => item.id !== workItemId),
      totalItems: Math.max(0, current.totalItems - 1),
    });
  }

  private addWorkItemToColumn(
    workItem: WorkItem,
    swimlaneId: string,
    columnId: string
  ): void {
    const columnState = this.getColumnState(swimlaneId, columnId);
    if (!columnState) return;
    const current = columnState();
    columnState.set({
      ...current,
      items: [workItem, ...current.items],
      totalItems: current.totalItems + 1,
    });
  }

  private updateWorkItemInColumn(
    workItem: WorkItem,
    swimlaneId: string,
    columnId: string
  ): void {
    const columnState = this.getColumnState(swimlaneId, columnId);
    if (!columnState) return;

    const current = columnState();
    const updatedItems = current.items.map((item: WorkItem) =>
      item.id === workItem.id ? workItem : item
    );

    columnState.set({ ...current, items: updatedItems });
  }

  private getColumnState(
    swimlaneId: string,
    columnId: string
  ): WritableSignal<WorkItemsColumnState> | undefined {
    const swimlane = this.swimlaneStates.get(swimlaneId);
    return swimlane?.get(columnId);
  }

  private removeWorkItemFromOldLocations(
    workItemId: string,
    oldLocations: WorkItemLocation[],
    newSwimlaneIds: string[],
    newColumnId: string
  ): void {
    oldLocations.forEach(({ swimlaneId, columnId }) => {
      const shouldRemove =
        !newSwimlaneIds.includes(swimlaneId) || columnId !== newColumnId;
      if (shouldRemove) {
        this.removeWorkItemFromSwimlaneColumn(workItemId, swimlaneId, columnId);
      }
    });
  }

  private addOrUpdateWorkItemInNewLocations(
    workItem: WorkItem,
    swimlaneIds: string[],
    columnId: string
  ): void {
    swimlaneIds.forEach((swimlaneId) => {
      const columnState = this.getColumnState(swimlaneId, columnId);
      if (!columnState) return;
      const current = columnState();
      const existingIndex = current.items.findIndex(
        (item) => item.id === workItem.id
      );
      if (existingIndex >= 0) {
        this.updateWorkItemInColumn(workItem, swimlaneId, columnId);
      } else {
        this.addWorkItemToColumn(workItem, swimlaneId, columnId);
      }
    });
  }
}
