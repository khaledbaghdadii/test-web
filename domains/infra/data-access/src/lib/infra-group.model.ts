/**
 * Infra-group list/search + registry-config models. Consolidated from the
 * business-process new-arch migration
 * (`business-process/data-access/.../infra-groups/models/infra-group.model.ts`,
 * itself copied verbatim from the legacy
 * `web/libs/features/infra-management/src/lib/infra-groups`) into the infra
 * domain, alongside the pre-existing minimal `InfraGroupService.getGroup`.
 */
export interface SelectedGroup {
  id: string;
  projectId: string;
  name: string;
}

export interface CredentialsLocation {
  uri?: string;
  isInherited: boolean;
}

export interface Machine {
  id: string;
  name: string;
  projectId: string;
  type: string;
  machineNameDuplicate: boolean;
}

export interface ErpAllocation {
  id: string;
  projectId: string;
  erpProjectId: string;
  allocationName: string;
  inherited: boolean;
}

export interface Group {
  id: string;
  projectId: string;
  name: string;
  defaultSshCredentials?: CredentialsLocation;
  defaultMssqlDbCredentials?: CredentialsLocation;
  defaultOracleDbCredentials?: CredentialsLocation;
  defaultPostgresDbCredentials?: CredentialsLocation;
  defaultSybaseDbCredentials?: CredentialsLocation;
  machines?: Machine[];
  erpAllocation?: ErpAllocation;
}

export interface Groups {
  content: Group[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export type GroupsAPIResponse = Groups;

export type GroupAPIResponse = Group;

export interface GroupFilterRequest {
  searchKey: string;
  groupIds?: string[];
}

interface GroupApiResponse {
  id: string;
  name: string;
  projectId: string;
}

export interface DefaultGroup {
  id: string;
  name: string;
  projectId: string;
}

export interface ProjectInfraRegistryApiResponse {
  createdOn: string;
  lastModifiedOn: string;
  createdBy: string;
  lastModifiedBy: string;
  projectId: string;
  defaultInfraPlugin: string;
  defaultAllocationRetryDelay: number;
  defaultGroup: GroupApiResponse;
}

export interface InfraGroupsHttpErrorResponse {
  error: {
    status: number;
    message: string;
    timestamp?: string;
    errors?: Map<string, string>;
  };
}
