import { AssetLocation } from "./asset-location";

export interface MavenBasedAssetLocation extends AssetLocation {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
  packagingType: string;
}
