import { Injectable } from "@angular/core";
import {
  DateRange,
  WorkItemBoardUrlFilters,
} from "../../model/work-item-board-filters.model";

interface PersistedFilters {
  searchKey?: string;
  selectedProjects?: string[];
  selectedPriority?: string | null;
  selectedAssignees?: string[];
  selectedCategories?: string[];
  selectedDateRange?: {
    startDate: string | null;
    endDate: string | null;
  } | null;
  selectedObjectIds?: string[];
  sortBy?: string | null;
}

@Injectable()
export class WorkItemBoardFilterPersistenceService {
  private static readonly STORAGE_KEY_PREFIX = "work-item-board-filters";

  saveFilters(filters: WorkItemBoardUrlFilters, username: string): void {
    const persisted: PersistedFilters = {
      searchKey: filters.searchKey || undefined,
      selectedProjects: filters.selectedProjects?.length
        ? filters.selectedProjects
        : undefined,
      selectedPriority: filters.selectedPriority ?? undefined,
      selectedAssignees: filters.selectedAssignees?.length
        ? filters.selectedAssignees
        : undefined,
      selectedCategories: filters.selectedCategories?.length
        ? filters.selectedCategories
        : undefined,
      selectedDateRange: filters.selectedDateRange
        ? {
            startDate:
              filters.selectedDateRange.startDate?.toISOString() ?? null,
            endDate: filters.selectedDateRange.endDate?.toISOString() ?? null,
          }
        : undefined,
      selectedObjectIds: filters.selectedObjectIds?.length
        ? filters.selectedObjectIds
        : undefined,
      sortBy: filters.sortBy ?? undefined,
    };
    localStorage.setItem(
      this.getStorageKey(username),
      JSON.stringify(persisted)
    );
  }

  loadFilters(username: string): Partial<WorkItemBoardUrlFilters> | null {
    try {
      const raw = localStorage.getItem(this.getStorageKey(username));
      if (!raw) return null;

      const persisted: PersistedFilters = JSON.parse(raw);
      return this.deserializeFilters(persisted);
    } catch {
      return null;
    }
  }

  clearFilters(username: string): void {
    localStorage.removeItem(this.getStorageKey(username));
  }

  private getStorageKey(username: string): string {
    return `${WorkItemBoardFilterPersistenceService.STORAGE_KEY_PREFIX}:${username}`;
  }

  private deserializeFilters(
    persisted: PersistedFilters
  ): Partial<WorkItemBoardUrlFilters> {
    const filters: Partial<WorkItemBoardUrlFilters> = {};

    if (persisted.searchKey) filters.searchKey = persisted.searchKey;
    if (persisted.selectedProjects?.length)
      filters.selectedProjects = persisted.selectedProjects;
    if (persisted.selectedPriority)
      filters.selectedPriority = persisted.selectedPriority as never;
    if (persisted.selectedAssignees?.length)
      filters.selectedAssignees = persisted.selectedAssignees;
    if (persisted.selectedCategories?.length)
      filters.selectedCategories = persisted.selectedCategories;
    if (persisted.selectedObjectIds?.length)
      filters.selectedObjectIds = persisted.selectedObjectIds;
    if (persisted.sortBy) filters.sortBy = persisted.sortBy;

    const dateRange = this.deserializeDateRange(persisted.selectedDateRange);
    if (dateRange) filters.selectedDateRange = dateRange;

    return filters;
  }

  private deserializeDateRange(
    range: PersistedFilters["selectedDateRange"]
  ): DateRange | null {
    if (!range) return null;
    const startDate = range.startDate ? new Date(range.startDate) : null;
    const endDate = range.endDate ? new Date(range.endDate) : null;
    if (!startDate && !endDate) return null;
    if (startDate && isNaN(startDate.getTime())) return null;
    if (endDate && isNaN(endDate.getTime())) return null;
    return { startDate, endDate };
  }
}
