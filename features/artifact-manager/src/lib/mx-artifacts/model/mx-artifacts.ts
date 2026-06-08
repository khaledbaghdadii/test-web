export interface MxArtifactsPage {
  content: MxArtifact[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FetchMxArtifactsFilter {
  pageSize: number;
  pageIndex: number;
  typeFilter: string;
  versionFilter: string;
  buildIdFilter: string;
  osFilter: string;
  revisionFilter: string;
  searchKey: string;
  projectIds?: string[];
  fetchGlobal?: boolean;
}

interface MxArtifact {
  id: string;
  type: string;
  projectId?: string;
  mxBuild: MxBuild;
  asset: Asset;
  createdOn: Date;
}

interface MxBuild {
  version: string;
  buildId: string;
  os: string;
  revision: string;
}

interface Asset {
  locations: AssetLocation[];
}

interface AssetLocation {
  storage: Storage;
  relativePath: string;
  fullPath: string;
}

interface Storage {
  name: string;
}
