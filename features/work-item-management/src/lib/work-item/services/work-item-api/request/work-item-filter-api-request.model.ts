import {
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from "../../../model/work-item";

export interface WorkItemFilterApiRequest {
  search?: string;
  projectIds?: string[];
  workItemStatuses?: WorkItemStatus[];
  workItemPriority?: WorkItemPriority;
  workItemType?: WorkItemType;
  assignees?: string[];
  workItemCategoryContains?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  resolvedDateSince?: string;
  workItemCategories?: string[];
  objectIds?: string[];
}
