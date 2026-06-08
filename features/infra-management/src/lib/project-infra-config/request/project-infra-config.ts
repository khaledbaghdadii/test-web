export interface EditProjectInfraConfigRequest {
  defaultGroupId?: string | null;
  defaultInfraPlugin?: string | null;
  defaultAllocationRetryDelay?: number;
  groupAllocationNearCapacityThreshold: number;
  defaultErpAllocationId?: string | null;
}
