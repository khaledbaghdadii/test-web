import { createAction, props } from "@ngrx/store";
import { Environment } from "../../service/models/environment.model";

export const retrieveEnvironment = createAction(
  "Retrieve Environment",
  props<{ projectId: string; id: string }>()
);

export const environmentRetrieved = createAction(
  "Environment Retrieved",
  props<{ environment: Environment }>()
);

export const failedToRetrieveEnvironment = createAction(
  "Failed to Retrieve Environment",
  props<{ id: string; error: string }>()
);

export const dropEnvironmentDetails = createAction(
  "Drop Environment Details",
  props<{ id: string }>()
);
