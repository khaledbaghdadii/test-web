export interface EnvironmentDefinition {
  id: string;
  name: string;
  status: EnvironmentDefinitionStatus;
}

export enum EnvironmentDefinitionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
