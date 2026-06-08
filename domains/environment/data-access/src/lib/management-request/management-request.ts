export interface ManagementRequest {
  id: string;
  type: string;
  status: string;
  createdOn: string;
  startedOn?: string;
  endedOn?: string;
  resultMessage?: string;
}
