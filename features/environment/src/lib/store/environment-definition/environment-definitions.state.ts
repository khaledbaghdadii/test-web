import { EnvironmentDefinition } from "@mxflow/features/environment";

export interface EnvironmentDefinitionsState {
  [projectId: string]: EnvironmentDefinitionState;
}

interface EnvironmentDefinitionState {
  data?: EnvironmentDefinition[];
  error?: string;
}

export const initialState: EnvironmentDefinitionsState = {};
