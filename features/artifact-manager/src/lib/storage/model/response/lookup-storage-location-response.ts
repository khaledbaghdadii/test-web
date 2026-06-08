import { AssetLocationType } from "../../../location/model/asset-location-type";

export interface LookupStorageLocationResponse {
  exists: boolean;
  isDirectory?: boolean;
  storage: LookupStorageLocationStorageResponse;
  relativePath: string;
  type: AssetLocationType;
}

export interface LookupStorageLocationStorageResponse {
  id: string;
  storageType: string;
}
