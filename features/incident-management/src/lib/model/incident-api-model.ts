export interface IncidentApiModel {
  id: string;
  title: string;
  status: string;
  reporter?: string;
  assignee?: string;
  externalIssue: ExternalIssueApiModel;
}

export interface ExternalIssueApiModel {
  id: string;
  origin: string;
  link: string;
}
