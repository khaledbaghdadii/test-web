import { WorkItemPriority } from "../../../model/work-item";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface WorkItemBoardFilters {
  searchKey: string;
  showMyTasksOnly: boolean;
  selectedProjects: string[];
  selectedPriority: WorkItemPriority | null;
  selectedAssignees: string[];
  selectedCategories: string[];
  selectedDateRange: DateRange | null;
  selectedObjectIds: string[];
  sortBy: string | null;
}

export type WorkItemBoardUrlFilters = Omit<
  WorkItemBoardFilters,
  "showMyTasksOnly"
>;
