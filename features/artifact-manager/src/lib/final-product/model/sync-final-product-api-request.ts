export interface SyncFinalProductApiRequest {
  infraGroupId: string;
  environmentDefinitionIds: string[];
  lightPackage: boolean;
  destinationMetadata: SyncFinalProductDestinationMetadataApiRequest;
}

export type SyncFinalProductDestinationMetadataApiRequest =
  | SyncFinalProductNfsDestinationMetadataApiRequest
  | SyncFinalProductNexusDestinationMetadataApiRequest;

export interface SyncFinalProductNfsDestinationMetadataApiRequest {
  storageType: "nfs";
  packageName?: string;
  directoryName?: string;
}

export interface SyncFinalProductNexusDestinationMetadataApiRequest {
  storageType: "nexus3";
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
}
