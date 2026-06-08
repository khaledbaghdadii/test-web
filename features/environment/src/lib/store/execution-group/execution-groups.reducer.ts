import { createReducer, on } from "@ngrx/store";
import { ExecutionGroupsState, initialState } from "./execution-group.state";
import {
  dropExecutionGroupDetails,
  executionGroupRetrieved,
  failedToRetrieveExecutionGroup,
} from "./execution-groups.action";

export const executionGroupsReducer = createReducer<ExecutionGroupsState>(
  initialState,
  on(executionGroupRetrieved, (oldState, action): ExecutionGroupsState => {
    return {
      ...oldState,
      [action.executionGroup.executionGroupId]: {
        data: action.executionGroup,
        error: null,
      },
    } as ExecutionGroupsState;
  }),
  on(
    failedToRetrieveExecutionGroup,
    (oldState, action): ExecutionGroupsState => {
      return {
        ...oldState,
        [action.executionGroupId]: {
          data: null,
          error: action.error,
        },
      } as ExecutionGroupsState;
    }
  ),
  on(dropExecutionGroupDetails, (oldState, action): ExecutionGroupsState => {
    return {
      ...oldState,
      [action.executionGroupId]: undefined,
    } as ExecutionGroupsState;
  })
);
