import { WorkItem } from "../../../../../../model/work-item";

export enum WorkItemAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

export interface WorkItemUpdateEvent {
  action: WorkItemAction;
}

export interface WorkItemCreatedEvent extends WorkItemUpdateEvent {
  action: WorkItemAction.CREATED;
  workItem: WorkItem;
}

export interface WorkItemUpdatedEvent extends WorkItemUpdateEvent {
  action: WorkItemAction.UPDATED;
  workItem: WorkItem;
}

export interface WorkItemDeletedEvent extends WorkItemUpdateEvent {
  action: WorkItemAction.DELETED;
  workItemId: string;
}

export type WorkItemWebSocketEvent =
  | WorkItemCreatedEvent
  | WorkItemUpdatedEvent
  | WorkItemDeletedEvent;
