import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CiProcessState } from "./ci-process.state";

const getCiProcessState = createFeatureSelector<CiProcessState>("ciProcess");

export const getErrorMessage = createSelector(
  getCiProcessState,
  (state) => state.errorMessage
);
