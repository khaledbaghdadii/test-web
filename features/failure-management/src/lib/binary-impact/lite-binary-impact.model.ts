import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface LiteBinaryImpact extends AnalysisObject {
  owner: string;
  title: string;
  projectId: string;
  mxVersion: string;
  upgradeImpact?: UpgradeImpactSummary;
}

export interface UpgradeImpactSummary {
  id: string;
  externalIssue: ExternalIssueSummary;
}

export interface ExternalIssueSummary {
  id: string;
  link: string;
}
