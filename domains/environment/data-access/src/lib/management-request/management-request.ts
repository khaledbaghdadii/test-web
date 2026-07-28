export interface ManagementRequest {
  id: string;
  type: string;
  status: string;
  createdOn: string;
  startedOn?: string;
  endedOn?: string;
  correlationId?: string;
  statusMessage?: string;
  resultStatus?: string;
  resultMessage?: string;
  abortedBy?: string;
  hasMetrics?: boolean;
  artifacts?: string[];
}
