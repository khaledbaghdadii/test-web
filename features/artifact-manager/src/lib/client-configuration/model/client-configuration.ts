export interface ClientConfigurationsPage {
  content: ClientConfiguration[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

interface ClientConfiguration {
  id: string;
  type: string;
  branch: string;
  commitId: string;
  projectId?: string;
  asset: Asset;
  mavenBuild: MavenBuild;
  createdOn: Date;
  createdBy?: string;
  purged?: boolean;
}

export interface FetchClientConfigurationFilter {
  pageSize: number;
  pageIndex: number;
  typeSearchKey: string;
  branchSearchKey: string;
  searchKey: string;
  projectIds?: string[];
  purged?: boolean;
}

interface MavenBuild {
  version: string;
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
