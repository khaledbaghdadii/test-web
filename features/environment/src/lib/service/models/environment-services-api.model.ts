export interface EnvironmentServicesApiModel {
  services: EnvironmentServiceApiModel[];
  environmentId: string;
}

export interface EnvironmentServiceApiModel {
  name?: string;
  nickname?: string;
  installationCode?: string;
  description?: string;
  status?: string;
}
