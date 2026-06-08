import { LookupStorageLocationResponse } from "./lookup-storage-location-response";

export interface LookupStorageMavenBasedLocationResponse
  extends LookupStorageLocationResponse {
  mavenBuild: MavenBuildMetadataResponse;
}

export interface MavenBuildMetadataResponse {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
  packagingType: string;
}
