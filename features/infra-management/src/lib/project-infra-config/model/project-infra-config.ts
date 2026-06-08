import { ErpAllocation } from "@mxflow/features/infra-management";

export interface ProjectInfraConfig {
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
  defaultErpAllocation?: ErpAllocation;
}

interface Group {
  id: string;
  name: string;
  projectId: string;
}
