export interface ReferenceScenarioApiModel {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  envInfo: {
    environmentId: string;
  };
  commitId?: string;
  mxVersion?: string;
  mxBuildId?: string;
}
