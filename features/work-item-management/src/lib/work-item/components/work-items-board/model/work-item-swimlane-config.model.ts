import { WorkItemSwimlaneGroupBy } from "./work-item-swimlane-group-by.enum";

export interface WorkItemSwimlaneConfig {
  id: string;
  title: string;
  groupBy: WorkItemSwimlaneGroupBy;
  value: string;
  isCollapsed: boolean;
}
