export interface BundlesPage {
  content: Bundles[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface Bundles {
  id: string;
  type: string;
  mxBuild: MxBuild;
  mxArtifacts: MxArtifact[];
  mxDeployPackage?: SimpleMxDeployPackage;
  purged: boolean;
  projectId?: string;
  createdOn: Date;
  createdBy?: string;
}

export interface FetchBundlesFilter {
  pageSize: number;
  pageIndex: number;
  type: string;
  version: string;
  buildId: string;
  revision: string;
  searchKey: string;
  projectIds?: string[];
  fetchGlobal?: boolean;
}

export interface FetchProjectSpecificBundlesFilter {
  bundleIds?: string[];
  projectId: string;
  pageIndex: number;
  pageSize: number;
}

export interface MxBuild {
  id: string;
  version: string;
  buildId: string;
  revision: string;
}

export interface MxArtifact {
  id: string;
  projectId?: string;
  purged?: boolean;
  type: string;
  asset: SimpleAsset;
}

export interface SimpleAsset {
  id: string;
  locations: SimpleAssetLocation[];
}
export interface SimpleAssetLocation {
  fullPath: string;
}
export interface SimpleMxDeployPackage {
  id: string;
  projectId?: string;
  type: string;
  asset: SimpleAsset;
}
