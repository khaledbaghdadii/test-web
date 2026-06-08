export interface MXClientDetailsApiModel {
  environmentId: string;
  host: string;
  port: number;
  clientJar: ArtifactLocation;
  clientPackage: ArtifactLocation;
}

export interface ArtifactLocation {
  name: string;
  uri: string;
}
