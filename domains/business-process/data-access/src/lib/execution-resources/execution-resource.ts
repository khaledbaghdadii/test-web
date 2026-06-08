export interface ExecutionResource {
  resourceId: string;
  projectId: string;
  resourceType: ExecutionResourceType;
  usageTags: ExecutionResourceUsageTag[];
}

export enum ExecutionResourceType {
  SCENARIO = "SCENARIO",
  ENVIRONMENT = "ENVIRONMENT",
  MERGE_JOB = "MERGE_JOB",
  DEVELOPMENT = "DEVELOPMENT",
}

export enum ExecutionResourceUsageTag {
  BACKPORT = "BACKPORT",
  REFERENCE_ENVIRONMENT = "REFERENCE_ENVIRONMENT",
}
