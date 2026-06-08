import { CreateAssetLocationRequest } from "./create-asset-location-request";

export interface CreatePathBasedAssetLocationRequest
  extends CreateAssetLocationRequest {
  relativePath: string;
}
