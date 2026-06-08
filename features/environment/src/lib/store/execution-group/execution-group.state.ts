import { ExecutionGroup } from "../../technical-reseed/execution-group-models";

export interface ExecutionGroupsState {
  [executionGroupId: string]: ExecutionGroupState;
}

interface ExecutionGroupState {
  data?: ExecutionGroup;
  error?: string;
}

export const initialState: ExecutionGroupsState = {};
