export interface ProjectInfraConfigApiResponse {
  projectId: string;
  defaultInfraPlugin: string;
  defaultAllocationRetryDelay: number;
  groupAllocationNearCapacityThreshold: number;
  defaultGroup: Group;
  defaultSshCredentialsUri?: string;
  defaultMssqlDbCredentialsUri?: string;
  defaultOracleDbCredentialsUri?: string;
  defaultPostgresDbCredentialsUri?: string;
  defaultSybaseDbCredentialsUri?: string;
}

interface Group {
  id: string;
  name: string;
  projectId: string;
}
