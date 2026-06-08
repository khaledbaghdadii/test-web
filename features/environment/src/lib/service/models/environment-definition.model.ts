import { EnvironmentDefinitionStatus } from "../../environment-definition-status";

export interface EnvironmentDefinitionApiModel {
  id: string;
  name: string;
  status: EnvironmentDefinitionStatus;
}
