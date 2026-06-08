export type WorkItem = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  requireAssignee?: boolean;
  assignee?: string;
  workItemCategory: string;
  domain: string;
  workItemType: WorkItemType;
  workItemStatus: WorkItemStatus;
  workItemPriority: WorkItemPriority;
  metadata: Record<string, unknown>;
  businessProcesses: BusinessProcess[];
  dueDate?: Date;
  dueDateEditable?: boolean;
  createdOn: Date;
  resolvedDate?: Date;
  objectId?: string;
  projectName: string;
};

export enum WorkItemType {
  AGGREGATE = "AGGREGATE",
  UNITARY = "UNITARY",
}

export enum WorkItemStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  UNDERWAY = "UNDERWAY",
  PENDING = "PENDING",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export enum WorkItemPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export type BusinessProcess = {
  id: string;
  familyId?: string;
  name?: string;
  owner?: string;
  projectId?: string;
};
