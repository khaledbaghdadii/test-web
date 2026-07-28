export interface EnvironmentShutdownPolicyState {
  isIncludedInShutdown?: boolean;
  actionsAllowed: boolean;
}

export type AllocationState =
  | "active"
  | "deallocated"
  | "allocating"
  | "failed"
  | "queued"
  | "idle"
  | "provisioning"
  | "deallocating"
  | "deallocation_failed";
