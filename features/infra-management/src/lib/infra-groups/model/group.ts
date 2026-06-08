export interface Group {
  id: string;
  projectId: string;
  name: string;
  defaultSshCredentials: CredentialsLocation;
  defaultMssqlDbCredentials: CredentialsLocation;
  defaultOracleDbCredentials: CredentialsLocation;
  defaultPostgresDbCredentials: CredentialsLocation;
  defaultSybaseDbCredentials: CredentialsLocation;
  machines?: Machine[];
  erpAllocation?: ErpAllocation;
}

interface Machine {
  id: string;
  name: string;
  projectId: string;
  type: string;
  machineNameDuplicate: boolean;
}

interface CredentialsLocation {
  uri?: string;
  isInherited: boolean;
}

interface ErpAllocation {
  id: string;
  projectId: string;
  erpProjectId: string;
  allocationName: string;
  inherited: boolean;
}
