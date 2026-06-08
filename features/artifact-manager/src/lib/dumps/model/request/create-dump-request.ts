import { CreateAssetRequest } from "../../../asset/model/request/create-asset-request";
import { DumpServerType } from "../dump-server-type";

export interface CreateDumpRequest {
  name?: string;
  description?: string;
  size?: number;
  asset: CreateAssetRequest;
  mxDeployPackageId: string;
  serverVersion: string;
  version?: string;
  mxDbTypes: string[];
  serverType: DumpServerType;
  stripes?: DumpStripeRequest[];
  compressed?: boolean;
  schema?: string;
}

export interface DumpStripeRequest {
  name: string;
}
