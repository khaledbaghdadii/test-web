import { Asset } from "../../asset/model/asset";

export interface DumpsPage {
  content: Dump[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface Dump {
  id: string;
  description?: string;
  size?: number;
  asset: Asset;
  mxDeployPackage: DumpMxDeployPackageResponse;
  serverVersion: string;
  mxDbTypes: string[];
  serverType: string;
  version?: string;
  projectId: string;
  stripes: DumpStripe[];
  compressed: boolean;
  schema?: string;
  purged: boolean;
  archived: boolean;
  createdOn: Date;
  createdBy?: string;
}

export interface DumpMxDeployPackageResponse {
  id: string;
  type: string;
  asset: Asset;
}

export interface DumpStripe {
  id: string;
  name: string;
}

export interface FetchDumpsFilter {
  pageSize: number;
  pageIndex: number;
  projectIds?: string[];
  searchKey: string;
  archived?: boolean;
  purged?: boolean;
}
