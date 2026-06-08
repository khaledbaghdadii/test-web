export interface OracleSnapshotConfig {
  maxTempSize: number;
  defaultUndoSize?: number;
  maxUndoSize: number;
}

export interface SybaseSnapshotConfig {
  defaultTempSize?: number;
  maxTempSize: number;
}

export interface DatabaseSnapshotConfiguration {
  oracle: OracleSnapshotConfig;
  sybase: SybaseSnapshotConfig;
}
