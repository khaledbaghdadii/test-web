import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ExecutionGroupsState } from "./execution-group.state";

const selectExecutionGroupsState =
  createFeatureSelector<ExecutionGroupsState>("executionGroups");

export const selectExecutionGroup = (props: {
  projectId: string;
  executionGroupId: string;
}) =>
  createSelector(selectExecutionGroupsState, (state) => {
    const executionGroup = state[props.executionGroupId];
    if (executionGroup) {
      if (executionGroup?.data) {
        return executionGroup.data;
      } else if (executionGroup?.error) {
        throw new Error(executionGroup.error);
      }
    }
    return undefined;
  });
