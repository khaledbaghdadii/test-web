import { createReducer, on } from "@ngrx/store";
import { CiProcessState, initialState } from "./ci-process.state";
import { CiProcessActions } from "./index";

export const ciProcessReducer = createReducer<CiProcessState>(
  initialState,
  on(CiProcessActions.clearErrorMessage, (state): CiProcessState => {
    return {
      ...state,
      errorMessage: "",
    };
  }),
  on(CiProcessActions.updateErrorMessage, (state, action): CiProcessState => {
    return {
      ...state,
      errorMessage: action.message,
    };
  })
);
