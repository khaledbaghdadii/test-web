export interface DatabaseSnapshot {
  id: string;
  projectId: string;
  plugin: string;
  externalId?: string;
  databaseSnapshotType: string;
  databaseSnapshotState: string;
  databaseSnapshotSource: string;
  erpAllocation?: DatabaseSnapshotErpAllocation;
  dumps?: Dump[];
  databaseInstance?: DatabaseInstance;
  createdOn: Date;
  createdBy?: string;
}

export interface Dump {
  id: string;
}

export interface DatabaseInstance {
  id: string;
  instanceName: string;
}

export interface DatabaseSnapshotPage {
  content: DatabaseSnapshot[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FetchDatabaseSnapshotsFilter {
  pageSize: number;
  pageIndex: number;
  projectIds?: string[];
  searchKey?: string;
  databaseSnapshotSource?: string;
  databaseSnapshotTypes?: string[];
  databaseSnapshotStates?: string[];
  sourceDatabaseInstanceNameSearchKey?: string;
  pluginSearchKey?: string;
  externalIdSearchKey?: string;
  dumpIds?: string[];
}

export interface DatabaseSnapshotErpAllocation {
  erpProjectId: string;
  erpAllocationName: string;
}
