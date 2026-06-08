import { WorkItem } from "../../../model/work-item";

export enum WorkItemChangeAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export interface WorkItemChangeBase {
  action: WorkItemChangeAction;
}

export interface WorkItemCreateChange extends WorkItemChangeBase {
  action: WorkItemChangeAction.CREATE;
  workItem: WorkItem;
}

export interface WorkItemUpdateChange extends WorkItemChangeBase {
  action: WorkItemChangeAction.UPDATE;
  workItem: WorkItem;
}

export interface WorkItemDeleteChange extends WorkItemChangeBase {
  action: WorkItemChangeAction.DELETE;
  workItemId: string;
}

export type WorkItemChange =
  | WorkItemCreateChange
  | WorkItemUpdateChange
  | WorkItemDeleteChange;
