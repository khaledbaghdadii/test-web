export interface FinalProducts {
  content: FinalProduct[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FinalProduct {
  id: string;
  projectId: string;
  branch: string;
  repositoryId: string;
  tag?: string;
  factoryProduct?: FinalProductFactoryProduct;
  clientConfigurations: FinalProductClientConfiguration[];
  validationLevel?: string;
  environmentDefinitionId: string;
  version: string;
  configurationCommitId: string;
  state: FinalProductState | string;
  latestSyncState?: FinalProductLatestSyncState;
  mxBundles: FinalProductMxBundle[];
  rtpProduct?: FinalProductRtpProduct;
  isTools: FinalProductIsTool[];
  createdOn: string;
  expiryDate?: Date;
  syncRequests: FinalProductSyncRequest[];
  failureMessage?: string;
}

export interface FinalProductSyncRequest {
  id: string;
  state: FinalProductSyncState;
  failureMessage?: string;
  startDate: string;
  endDate?: string;
  environmentDefinitionIds: string[];
  asset: unknown;
  lightPackage: boolean;
}

export enum FinalProductSyncState {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
  UNSTABLE = "UNSTABLE",
}

export interface FinalProductFactoryProduct {
  id: string;
  type: string;
  softwareProduct: FinalProductSoftwareProduct;
}

export interface FinalProductSoftwareProduct {
  id: string;
  version: string;
  revision: string;
}

export interface FinalProductClientConfiguration {
  id: string;
  type: string;
  branch: string;
  commitId: string;
}

export interface FinalProductIsTool {
  id: string;
  name: string;
  type: string;
}

export interface FinalProductRtpProduct {
  id: string;
  rtpCommitId: string;
  tag: string;
}

export interface FinalProductMxBundle {
  id: string;
  type: string;
}

export interface FinalProductFilters {
  configurationCommitIdSearch?: string;
  configurationCommitIdFilter?: string;
  tag?: string;
  branchFilter?: string;
  fetchParent?: boolean;
  validationLevelFilter?: string[];
  commitIdSearchKey?: string;
  bundleTypeSearchKey?: string;
  projectIds?: string[];
  isToolTypeFilters?: string[];
  stateFilter?: FinalProductState[];
  latestSyncStateFilter?: FinalProductLatestSyncState;
  searchKey?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export enum FinalProductState {
  CREATING = "CREATING",
  AVAILABLE = "AVAILABLE",
  FAILED = "FAILED",
  PURGED = "PURGED",
  PURGE_FAILED = "PURGE_FAILED",
  PURGING = "PURGING",
}

export enum FinalProductLatestSyncState {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
  UNSTABLE = "UNSTABLE",
}
