import { AssetLocationType } from "@mxflow/features/artifact-manager";

export interface CreateAssetLocationRequest {
  storageId: string;
  type: AssetLocationType;
}
