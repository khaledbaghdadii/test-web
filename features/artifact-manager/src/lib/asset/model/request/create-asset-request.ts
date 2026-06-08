import { CreateAssetLocationRequest } from "../../../location/model/request/create-asset-location-request";

export interface CreateAssetRequest {
  nickname?: string;
  locations: CreateAssetLocationRequest[];
}
