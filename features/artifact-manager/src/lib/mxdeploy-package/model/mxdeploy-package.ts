import { Asset } from "../../asset/model/asset";
import { Version } from "../../version/version";

export interface MxDeployPackagesPage {
  content: MxDeployPackage[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface MxDeployPackage {
  id: string;
  type: string;
  version: Version;
  asset: Asset;
  projectId?: string;
  createdOn: Date;
  createdBy?: string;
}

export interface FetchMxDeployPackagesFilter {
  pageSize: number;
  pageIndex: number;
  os?: string;
  type?: string;
  searchKey?: string;
  projectIds?: string[];
  fetchGlobal?: boolean;
}
