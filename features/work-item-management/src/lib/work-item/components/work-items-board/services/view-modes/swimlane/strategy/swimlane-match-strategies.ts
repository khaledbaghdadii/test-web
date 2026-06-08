import {
  WorkItem,
  WorkItemPriority,
} from "libs/features/work-item-management/src/lib/work-item/model/work-item";
import { WorkItemBoardFilter } from "../../../../model/work-item-board-filter.model";
import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";
import { DueDateRangeCalculator } from "../calculator/due-date-range-calculator";

export interface SwimlaneMatchStrategy {
  matches(workItem: WorkItem, swimlaneValue: string): boolean;
  applyFilter(filters: WorkItemBoardFilter, swimlaneValue: string): void;
}

export class PrioritySwimlaneStrategy implements SwimlaneMatchStrategy {
  matches(workItem: WorkItem, swimlaneValue: string): boolean {
    return workItem.workItemPriority === swimlaneValue;
  }

  applyFilter(filters: WorkItemBoardFilter, swimlaneValue: string): void {
    filters.workItemPriority = swimlaneValue as WorkItemPriority;
  }
}

export class CategorySwimlaneStrategy implements SwimlaneMatchStrategy {
  matches(workItem: WorkItem, swimlaneValue: string): boolean {
    return workItem.workItemCategory === swimlaneValue;
  }

  applyFilter(filters: WorkItemBoardFilter, swimlaneValue: string): void {
    filters.workItemCategories = [swimlaneValue];
  }
}

export class DueDateSwimlaneStrategy implements SwimlaneMatchStrategy {
  constructor(
    private readonly getMostRestrictiveStartDate: (
      baseDate: string | undefined,
      swimlaneDate: string | undefined
    ) => string | undefined,
    private readonly getMostRestrictiveEndDate: (
      baseDate: string | undefined,
      swimlaneDate: string | undefined
    ) => string | undefined
  ) {}

  matches(workItem: WorkItem, swimlaneValue: string): boolean {
    if (!workItem.dueDate) return false;

    const dueDate = new Date(workItem.dueDate);
    const dateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
      swimlaneValue as WorkItemDueDateRange
    );

    const start = dateRangeFilter.from ? new Date(dateRangeFilter.from) : null;
    const end = dateRangeFilter.to ? new Date(dateRangeFilter.to) : null;

    if (start && dueDate < start) return false;
    if (end && dueDate > end) return false;

    return true;
  }

  applyFilter(filters: WorkItemBoardFilter, swimlaneValue: string): void {
    const swimlaneDateRange = DueDateRangeCalculator.getDateRangeFilter(
      swimlaneValue as WorkItemDueDateRange
    );
    filters.dueDateFrom = this.getMostRestrictiveStartDate(
      filters.dueDateFrom,
      swimlaneDateRange.from
    );
    filters.dueDateTo = this.getMostRestrictiveEndDate(
      filters.dueDateTo,
      swimlaneDateRange.to
    );
  }
}
