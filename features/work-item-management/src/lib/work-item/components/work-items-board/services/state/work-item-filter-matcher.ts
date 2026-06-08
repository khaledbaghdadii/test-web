import { WorkItem } from "../../../../model/work-item";
import { WorkItemBoardFilter } from "../../model/work-item-board-filter.model";

export function workItemMatchesFilter(
  workItem: WorkItem,
  filter: WorkItemBoardFilter
): boolean {
  if (filter.search && !matchesSearch(workItem, filter.search)) {
    return false;
  }

  if (
    filter.projectIds?.length &&
    !filter.projectIds.includes(workItem.projectId)
  ) {
    return false;
  }

  if (
    filter.workItemPriority &&
    workItem.workItemPriority !== filter.workItemPriority
  ) {
    return false;
  }

  if (
    filter.workItemCategories?.length &&
    !filter.workItemCategories.includes(workItem.workItemCategory)
  ) {
    return false;
  }

  if (filter.assignees?.length) {
    if (!workItem.assignee || !filter.assignees.includes(workItem.assignee)) {
      return false;
    }
  }

  if (filter.objectIds?.length) {
    if (!workItem.objectId || !filter.objectIds.includes(workItem.objectId)) {
      return false;
    }
  }

  if (!matchesDateRange(workItem, filter.dueDateFrom, filter.dueDateTo)) {
    return false;
  }

  return true;
}

function matchesSearch(workItem: WorkItem, search: string): boolean {
  const lowerSearch = search.toLowerCase();
  return Boolean(
    workItem.name?.toLowerCase().includes(lowerSearch) ||
      workItem.objectId?.toLowerCase().includes(lowerSearch)
  );
}

function matchesDateRange(
  workItem: WorkItem,
  dueDateFrom?: string,
  dueDateTo?: string
): boolean {
  if (!dueDateFrom && !dueDateTo) {
    return true;
  }

  const dueDate = workItem.dueDate
    ? new Date(workItem.dueDate).getTime()
    : null;

  if (dueDate === null) {
    return false;
  }

  if (dueDateFrom && dueDate < new Date(dueDateFrom).getTime()) {
    return false;
  }

  if (dueDateTo && dueDate > new Date(dueDateTo).getTime()) {
    return false;
  }

  return true;
}
