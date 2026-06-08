import {
  DatabaseInstanceAllocationRequest,
  MachineResourceAllocationRequest,
} from "../../../allocations/model/allocation";

export interface GroupMetrics {
  group: SimpleGroup;
  lastSyncedOn: Date;
  groupInfraFamilyMetrics: GroupInfraFamilyMetric[];
}

export interface GroupInfraFamilyMetric {
  id: string;
  allocationFailureDetails?: GroupAllocationFailureDetails;
  remainingNumberOfAllocations?: number;
  allocationRequest: SimpleAllocationRequest;
}

export interface SimpleAllocationRequest {
  infraFamily?: SimpleInfraFamily;
}

export interface SimpleInfraFamily {
  id: string;
  name: string;
}

export interface SimpleGroup {
  id: string;
  name: string;
  projectId: string;
  allocationNotificationThreshold?: AllocationNotificationThreshold;
}

export interface AllocationNotificationThreshold {
  threshold: number;
  inherited: boolean;
}

export interface GroupAllocationFailureDetails {
  failedDatabaseInstanceAllocationRequest?: DatabaseInstanceAllocationRequest;
  failedMachineResourceAllocationRequest?: MachineResourceAllocationRequest;
}
