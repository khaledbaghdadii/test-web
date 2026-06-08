import { createFeatureSelector, createSelector, select } from "@ngrx/store";
import { CiProcessExecutionState } from "./ci-process-execution.state";
import { pipe, skipWhile } from "rxjs";

const getCiProcessState =
  createFeatureSelector<CiProcessExecutionState>("ciProcessExecution");

const ciProcessExecutionSelector = createSelector(
  getCiProcessState,
  (state) => {
    if (state.data.errorMessage) {
      throw Error(state.data.errorMessage);
    }
    return state.data.ciProcessExecution;
  }
);

export const getCiProcessExecution = pipe(
  select(ciProcessExecutionSelector),
  skipWhile((ciProcessExecution) => ciProcessExecution.id === "")
);
