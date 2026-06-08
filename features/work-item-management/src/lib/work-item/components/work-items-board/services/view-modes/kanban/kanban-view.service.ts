import {
  Injectable,
  signal,
  computed,
  inject,
  type Signal,
} from "@angular/core";
import { Observable, finalize, tap, catchError, of, map } from "rxjs";
import { WorkItemStatus, WorkItem } from "../../../../../model/work-item";
import { WorkItemsColumnState } from "../../../model/work-items-column-state.model";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemBoardFilter } from "../../../model/work-item-board-filter.model";
import { WorkItemsPerStatusApiResponse } from "../../../../../services/work-item-api/response/work-items-per-status-api-response.model";
import { WorkItemBoardColumnConfig } from "../../../model/work-item-board-column-config.model";

@Injectable()
export class KanbanViewService {
  private static readonly DEFAULT_ITEMS_PER_PAGE = 10;
  private static readonly DEFAULT_LOAD_THRESHOLD = 0.8;

  private readonly workItemService = inject(WorkItemService);
  private readonly columnConfigs = new Map<string, WorkItemBoardColumnConfig>();
  private readonly columnStates = signal<Map<string, WorkItemsColumnState>>(
    new Map()
  );
  private readonly globalLoadingSignal = signal(false);

  readonly isLoading = computed(() => this.globalLoadingSignal());

  readonly allVisibleWorkItems = computed(() => {
    const allItems: WorkItem[] = [];
    for (const state of this.columnStates().values()) {
      allItems.push(...state.items);
    }
    return allItems;
  });

  getColumnState(columnId: string): Signal<WorkItemsColumnState> {
    return computed(() => {
      const state = this.columnStates().get(columnId);
      return state ?? this.createInitialState();
    });
  }

  initializeColumns(columns: readonly WorkItemBoardColumnConfig[]): void {
    const newMap = new Map<string, WorkItemsColumnState>();
    columns.forEach((col) => {
      newMap.set(col.id, this.createInitialState());
      this.columnConfigs.set(col.id, col);
    });
    this.columnStates.set(newMap);
  }

  loadData(
    columns: readonly WorkItemBoardColumnConfig[],
    filters: WorkItemBoardFilter,
    pageNumber: number = 0
  ): Observable<void> {
    const statusesToLoad = this.getStatusesToLoad(columns, pageNumber);
    if (statusesToLoad.length === 0 || this.globalLoadingSignal())
      return of(undefined);
    this.globalLoadingSignal.set(true);
    const filtersWithStatuses = {
      ...filters,
      workItemStatuses: statusesToLoad,
    };
    return this.workItemService
      .getWorkItemsPerStatus(
        filtersWithStatuses,
        pageNumber,
        KanbanViewService.DEFAULT_ITEMS_PER_PAGE
      )
      .pipe(
        tap((response) =>
          this.updateColumns(columns, response, pageNumber, statusesToLoad)
        ),
        catchError(() => of(undefined)),
        finalize(() => this.globalLoadingSignal.set(false)),
        map(() => undefined)
      );
  }

  reset(): void {
    const newMap = new Map<string, WorkItemsColumnState>();
    for (const key of this.columnStates().keys()) {
      newMap.set(key, this.createInitialState());
    }
    this.columnStates.set(newMap);
    this.globalLoadingSignal.set(false);
  }

  shouldLoadMore(scrollPosition: number, scrollHeight: number): boolean {
    return (
      scrollPosition >= scrollHeight * KanbanViewService.DEFAULT_LOAD_THRESHOLD
    );
  }

  getHighestPage(): number {
    let max = 0;
    for (const state of this.columnStates().values()) {
      if (state.currentPage > max) max = state.currentPage;
    }
    return max;
  }

  addWorkItem(workItem: WorkItem): void {
    const columnId = this.getColumnIdByStatus(workItem.workItemStatus);
    if (!columnId) return;
    this.addWorkItemToColumn(columnId, workItem);
  }

  updateWorkItem(workItem: WorkItem): void {
    const oldColumnId = this.findColumnIdByWorkItemId(workItem.id);
    if (!oldColumnId) {
      return;
    }
    const newColumnId = this.getColumnIdByStatus(workItem.workItemStatus);
    if (!newColumnId) return;
    if (oldColumnId === newColumnId) {
      this.updateWorkItemInColumn(newColumnId, workItem);
      return;
    }
    this.removeWorkItemFromColumn(oldColumnId, workItem.id);
    this.addWorkItemToColumn(newColumnId, workItem);
  }

  removeWorkItem(workItemId: string): void {
    const columnId = this.findColumnIdByWorkItemId(workItemId);
    if (!columnId) return;
    this.removeWorkItemFromColumn(columnId, workItemId);
  }

  private getColumnIdByStatus(status: WorkItemStatus): string | undefined {
    for (const [columnId, config] of this.columnConfigs.entries()) {
      if (config.status === status) return columnId;
    }
    return undefined;
  }

  private findColumnIdByWorkItemId(workItemId: string): string | undefined {
    for (const [columnId, state] of this.columnStates()) {
      if (state.items.some((item) => item.id === workItemId)) return columnId;
    }
    return undefined;
  }

  private updateWorkItemInColumn(columnId: string, workItem: WorkItem): void {
    const currentMap = this.columnStates();
    const state = currentMap.get(columnId) ?? this.createInitialState();
    const updatedItems = state.items.map((item) =>
      item.id === workItem.id ? workItem : item
    );
    const newMap = new Map(currentMap);
    newMap.set(columnId, {
      ...state,
      items: updatedItems,
    });
    this.columnStates.set(newMap);
  }

  private removeWorkItemFromColumn(columnId: string, workItemId: string): void {
    const currentMap = this.columnStates();
    const state = currentMap.get(columnId) ?? this.createInitialState();
    const newMap = new Map(currentMap);
    newMap.set(columnId, {
      ...state,
      items: state.items.filter((item) => item.id !== workItemId),
      totalItems: Math.max(0, state.totalItems - 1),
    });
    this.columnStates.set(newMap);
  }

  private addWorkItemToColumn(columnId: string, workItem: WorkItem): void {
    const currentMap = this.columnStates();
    const state = currentMap.get(columnId) ?? this.createInitialState();
    const newMap = new Map(currentMap);
    newMap.set(columnId, {
      ...state,
      items: [workItem, ...state.items],
      totalItems: state.totalItems + 1,
    });
    this.columnStates.set(newMap);
  }

  private getStatusesToLoad(
    columns: readonly WorkItemBoardColumnConfig[],
    pageNumber: number
  ): WorkItemStatus[] {
    const statuses: WorkItemStatus[] = [];
    const currentMap = this.columnStates();
    columns.forEach((col) => {
      const state = currentMap.get(col.id);
      if (
        !state ||
        pageNumber === 0 ||
        (!state.isLastPage && state.currentPage < pageNumber)
      ) {
        statuses.push(col.status);
      }
    });
    return statuses;
  }

  private createInitialState(): WorkItemsColumnState {
    return { items: [], currentPage: 0, isLastPage: false, totalItems: 0 };
  }

  private updateColumns(
    columns: readonly WorkItemBoardColumnConfig[],
    response: WorkItemsPerStatusApiResponse,
    pageNumber: number,
    statuses: WorkItemStatus[]
  ): void {
    const statusToColumnId = new Map<WorkItemStatus, string>();
    columns.forEach((c) => {
      statusToColumnId.set(c.status, c.id);
      if (!this.columnConfigs.has(c.id)) {
        this.columnConfigs.set(c.id, c);
      }
    });

    const currentMap = this.columnStates();
    const newMap = new Map(currentMap);

    statuses.forEach((status) => {
      const columnId = statusToColumnId.get(status);
      if (!columnId) return;
      const state = currentMap.get(columnId) ?? this.createInitialState();
      const statusResponse = response[status];
      if (!statusResponse) return;
      const items =
        pageNumber === 0
          ? statusResponse.content
          : [...state.items, ...statusResponse.content];
      newMap.set(columnId, {
        items,
        currentPage: pageNumber,
        isLastPage: statusResponse.last,
        totalItems: statusResponse.totalElements,
      });
    });

    this.columnStates.set(newMap);
  }
}
