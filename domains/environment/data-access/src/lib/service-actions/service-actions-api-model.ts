export interface StartEnvironmentResponseApiModel {
  startRequestId: string;
}

export interface StopEnvironmentResponseApiModel {
  stopRequestId: string;
}

export interface EnvironmentServicesResponseApiModel {
  services: EnvironmentServiceItemApiModel[];
  environmentId: string;
}

export interface EnvironmentServiceItemApiModel {
  name?: string;
  nickname?: string;
  installationCode?: string;
  description?: string;
  status?: string;
}
