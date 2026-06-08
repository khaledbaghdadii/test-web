export interface EnvironmentManagementRequestApiModel {
  id: string;
  type: string;
  result: {
    message: string;
    status: string;
  };
  status: string;
  correlationId: string;
  configurationIdentifier: {
    branch: string;
    revision: string;
  };
  environmentId: string;
}
