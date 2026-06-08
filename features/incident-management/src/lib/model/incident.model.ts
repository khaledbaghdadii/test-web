import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface Incident extends AnalysisObject {
  title: string;
  status: string;
  reporter?: string;
  assignee?: string;
  externalIssue: ExternalIssue;
}

export interface ExternalIssue {
  id: string;
  origin: string;
  link: string;
}
