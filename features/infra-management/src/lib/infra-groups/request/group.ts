export interface AddGroupRequest {
  name: string;
  machineIds: string[];
  erpAllocationId?: string;
  allocationNotificationThreshold?: number;
}

export interface EditGroupRequest {
  name: string;
  erpAllocationId?: string;
  machineIds: string[];
  allocationNotificationThreshold?: number;
}

export interface GroupFilterRequest {
  searchKey: string;
  groupIds?: string[];
}
