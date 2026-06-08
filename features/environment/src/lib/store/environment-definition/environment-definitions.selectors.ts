import { createFeatureSelector, createSelector } from "@ngrx/store";
import { EnvironmentDefinitionsState } from "./environment-definitions.state";

const selectEnvironmentDefinitionsState =
  createFeatureSelector<EnvironmentDefinitionsState>("environmentDefinitions");

export const selectEnvironmentDefinitions = (props: { projectId: string }) =>
  createSelector(selectEnvironmentDefinitionsState, (state) => {
    const environmentDefinitions = state[props.projectId];
    if (environmentDefinitions) {
      if (environmentDefinitions?.data) {
        return environmentDefinitions.data;
      } else if (environmentDefinitions?.error) {
        throw new Error(environmentDefinitions.error);
      }
    }
    return undefined;
  });
