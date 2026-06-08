export interface ManagementRequestApiModel {
  id: string;
  correlationId: string;
  createdOn: string;
  startedOn?: string;
  endedOn?: string;
  environmentId: string;
  status: string;
  statusMessage?: string;
  result?: ManagementRequestResultApiModel;
  type: string;
  abortedBy?: string;
  abortedOn?: string;
}

export interface ManagementRequestResultApiModel {
  status?: string;
  message?: string;
}
