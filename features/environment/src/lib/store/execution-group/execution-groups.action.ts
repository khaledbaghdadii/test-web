import { createAction, props } from "@ngrx/store";
import { ExecutionGroup } from "../../technical-reseed/execution-group-models";

export const retrieveExecutionGroup = createAction(
  "Retrieve Execution Group",
  props<{ projectId: string; executionGroupId: string }>()
);

export const executionGroupRetrieved = createAction(
  "Execution Group Retrieved",
  props<{ executionGroup: ExecutionGroup }>()
);

export const failedToRetrieveExecutionGroup = createAction(
  "Failed to Retrieve Execution Group",
  props<{ executionGroupId: string; error: string }>()
);

export const dropExecutionGroupDetails = createAction(
  "Drop Execution Group Details",
  props<{ executionGroupId: string }>()
);
