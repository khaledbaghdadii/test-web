import { DatabaseSnapshotSource } from "../database-snapshot-source";

export interface CreateDatabaseSnapshotFromDumpsRequest
  extends CreateDatabaseSnapshotRequest {
  dumpIds: string[];
  serverVersion: string;
  erpAllocationId: string;
  engineSpecificDetail?: string;
  tempSize?: number | null;
  undoSize?: number | null;
}

export interface CreateDatabaseSnapshotRequest {
  databaseSnapshotSource: DatabaseSnapshotSource;
}
