export interface VersionApiModel {
  id: string;
  name: string;
  active: boolean;
  type: VersionType;
}

export enum VersionType {
  ARCHIVAL = "ARCHIVAL",
  RELEASE_EFFECTIVE = "RELEASE_EFFECTIVE",
  RELEASE_FORECAST = "RELEASE_FORECAST",
}
