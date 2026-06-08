import { EnvironmentsState, initialState } from "./environments.state";
import {
  dropEnvironmentDetails,
  failedToRetrieveEnvironment,
  environmentRetrieved,
} from "./environments.action";
import { createReducer, on } from "@ngrx/store";

export const environmentsReducer = createReducer<EnvironmentsState>(
  initialState,
  on(environmentRetrieved, (oldState, action): EnvironmentsState => {
    return {
      ...oldState,
      [action.environment.id]: {
        data: action.environment,
        error: null,
      },
    } as EnvironmentsState;
  }),
  on(failedToRetrieveEnvironment, (oldState, action): EnvironmentsState => {
    return {
      ...oldState,
      [action.id]: {
        data: null,
        error: action.error,
      },
    } as EnvironmentsState;
  }),
  on(dropEnvironmentDetails, (oldState, action): EnvironmentsState => {
    return {
      ...oldState,
      [action.id]: undefined,
    } as EnvironmentsState;
  })
);
