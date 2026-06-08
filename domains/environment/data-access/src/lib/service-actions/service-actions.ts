export interface StartEnvironmentResponse {
  startRequestId: string;
}

export interface StopEnvironmentResponse {
  stopRequestId: string;
}

export interface EnvironmentServiceItem {
  name?: string;
  nickname?: string;
  installationCode?: string;
  description?: string;
  status?: string;
}
