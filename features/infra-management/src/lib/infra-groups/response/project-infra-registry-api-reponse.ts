interface GroupApiResponse {
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

export interface DefaultGroup {
  id: string;
  name: string;
  projectId: string;
}
