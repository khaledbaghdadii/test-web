export interface MXClientDetails {
  environmentId: string;
  host: string;
  port: number;
  clientJar: ArtifactLocation;
  clientPackage: ArtifactLocation;
}

export interface ArtifactLocation {
  type: string;
  name: string;
  uri: string;
}
