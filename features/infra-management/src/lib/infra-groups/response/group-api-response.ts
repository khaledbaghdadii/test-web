export interface GroupAPIResponse {
  id: string;
  projectId: string;
  name: string;
  defaultSshCredentials: CredentialsLocation;
  defaultMssqlDbCredentials: CredentialsLocation;
  defaultOracleDbCredentials: CredentialsLocation;
  defaultPostgresDbCredentials: CredentialsLocation;
  defaultSybaseDbCredentials: CredentialsLocation;
  allocationNotificationThreshold?: AllocationNotificationThreshold;
  machines?: MachineAPIResponse[];
  infraFamily?: InfraFamilyAPIResponse;
}

interface InfraFamilyAPIResponse {
  id: string;
  name: string;
}

interface MachineAPIResponse {
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

interface AllocationNotificationThreshold {
  threshold: number;
  inherited: boolean;
}
