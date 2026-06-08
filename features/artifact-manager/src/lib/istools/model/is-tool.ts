import { Asset } from "../../asset/model/asset";
import { MavenBuild } from "../../version/maven-build/model/maven-build";

export interface IsToolsPage {
  content: IsTool[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
export interface IsTool {
  id: string;
  name: string;
  mavenBuild: MavenBuild;
  type: string;
  mxDeployPackage: MxDeployPackageResponse;
  asset: Asset;
  archived: boolean;
  createdOn: Date;
  createdBy?: string;
}

export interface FetchIsToolsFilter {
  pageSize: number;
  pageIndex: number;
  type?: string;
  searchKey?: string;
}

export interface MxDeployPackageResponse {
  id: string;
  type: string;
  asset: Asset;
}
