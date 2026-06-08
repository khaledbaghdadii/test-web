import { createAction, props } from "@ngrx/store";
import { EnvironmentDefinition } from "@mxflow/features/environment";

export const retrieveEnvironmentDefinitions = createAction(
  "Retrieve Environment Definitions",
  props<{ projectId: string }>()
);

export const environmentDefinitionsRetrieved = createAction(
  "Environment Definitions Retrieved",
  props<{
    projectId: string;
    environmentDefinitions: EnvironmentDefinition[];
  }>()
);

export const failedToRetrieveEnvironmentDefinitions = createAction(
  "Failed to Retrieve Environment Definitions",
  props<{ projectId: string; error: string }>()
);

export const dropEnvironmentDefinitionsDetails = createAction(
  "Drop Environment Definitions Details",
  props<{ projectId: string }>()
);
