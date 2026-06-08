import { EnvironmentsState } from "./environments.state";
import { createFeatureSelector, createSelector } from "@ngrx/store";

const selectEnvironmentsState =
  createFeatureSelector<EnvironmentsState>("environments");

export const selectEnvironment = (props: {
  projectId: string;
  environmentId: string;
}) =>
  createSelector(selectEnvironmentsState, (state) => {
    const environment = state[props.environmentId];
    if (environment) {
      if (environment?.data) {
        return environment.data;
      } else if (environment?.error) {
        throw new Error(environment.error);
      }
    }

    return undefined;
  });
