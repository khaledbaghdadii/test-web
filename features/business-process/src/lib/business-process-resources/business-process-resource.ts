export interface BusinessProcessResource {
  resourceId: string;
  projectId: string;
  resourceType: ResourceType;
  usageTags: ResourceUsageTags[];
}

export enum ResourceType {
  SCENARIO = "SCENARIO",
  ENVIRONMENT = "ENVIRONMENT",
  MERGE_JOB = "MERGE_JOB",
  DEVELOPMENT = "DEVELOPMENT",
}

export enum ResourceUsageTags {
  BACKPORT = "BACKPORT",
  REFERENCE_ENVIRONMENT = "REFERENCE_ENVIRONMENT",
}
