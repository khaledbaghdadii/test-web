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
