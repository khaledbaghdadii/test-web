import { EnvironmentDefinitionStatus } from "./environment-definition-status";

export interface EnvironmentDefinition {
  id: string;
  name: string;
  status: EnvironmentDefinitionStatus;
}
