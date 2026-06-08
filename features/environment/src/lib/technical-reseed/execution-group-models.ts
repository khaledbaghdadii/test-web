import { TechnicalReseedOperation } from "./technical-reseed-models";

export interface ExecutionGroup {
  executionGroupId: string;
  status: ExecutionGroupStatus;
  launchesAllowed: boolean;
  reason?: string;
  technicalReseedOperations?: TechnicalReseedOperation[];
}

export enum ExecutionGroupStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
}
