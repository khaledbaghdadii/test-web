import { WorkItem } from "../../../model/work-item";

export interface WorkItemsColumnState {
  items: WorkItem[];
  currentPage: number;
  isLastPage: boolean;
  totalItems: number;
}
