import { createReducer, on } from "@ngrx/store";
import {
  dropEnvironmentDefinitionsDetails,
  environmentDefinitionsRetrieved,
  failedToRetrieveEnvironmentDefinitions,
} from "./environment-definitions.action";
import {
  EnvironmentDefinitionsState,
  initialState,
} from "./environment-definitions.state";

export const environmentDefinitionsReducer =
  createReducer<EnvironmentDefinitionsState>(
    initialState,
    on(
      environmentDefinitionsRetrieved,
      (oldState, action): EnvironmentDefinitionsState => {
        return {
          ...oldState,
          [action.projectId]: {
            data: action.environmentDefinitions,
            error: null,
          },
        } as EnvironmentDefinitionsState;
      }
    ),
    on(
      failedToRetrieveEnvironmentDefinitions,
      (oldState, action): EnvironmentDefinitionsState => {
        return {
          ...oldState,
          [action.projectId]: {
            data: null,
            error: action.error,
          },
        } as EnvironmentDefinitionsState;
      }
    ),
    on(
      dropEnvironmentDefinitionsDetails,
      (oldState, action): EnvironmentDefinitionsState => {
        return {
          ...oldState,
          [action.projectId]: undefined,
        } as EnvironmentDefinitionsState;
      }
    )
  );
