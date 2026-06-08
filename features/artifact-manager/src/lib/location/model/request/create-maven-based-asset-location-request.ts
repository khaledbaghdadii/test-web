import { CreateAssetLocationRequest } from "./create-asset-location-request";

export interface CreateMavenBasedAssetLocationRequest
  extends CreateAssetLocationRequest {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
  packagingType: string;
}
