import { createReducer, on } from "@ngrx/store";
import {
  CiProcessExecutionState,
  initialState,
} from "./ci-process-execution.state";
import { CiProcessExecutionAction } from "./index";

export const CiProcessExecutionReducer = createReducer<CiProcessExecutionState>(
  initialState,
  on(
    CiProcessExecutionAction.getCiProcessExecutionSuccessfully,
    (state, action): CiProcessExecutionState => {
      return {
        ...state,
        data: {
          ciProcessExecution: action.ciProcessExecution,
        },
      };
    }
  ),
  on(
    CiProcessExecutionAction.getCiProcessExecutionFailure,
    (state, action): CiProcessExecutionState => {
      return {
        data: {
          ...state.data,
          errorMessage: action.errorMessage,
        },
      };
    }
  )
);
