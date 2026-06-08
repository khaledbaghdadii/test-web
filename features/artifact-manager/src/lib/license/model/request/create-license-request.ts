import { CreateAssetRequest } from "../../../asset/model/request/create-asset-request";

export interface CreateLicenseRequest {
  type: string;
  asset: CreateAssetRequest;
  version: string;
  revision?: string;
  expirationDate: Date;
}
