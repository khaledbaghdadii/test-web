export interface LiteBinaryImpactApiResponse {
  id: string;
  title: string;
  owner: string;
  mxVersion: string;
  projectId: string;
  upgradeImpact?: UpgradeImpactSummaryApiResponse;
}

export interface UpgradeImpactSummaryApiResponse {
  id: string;
  externalIssue: ExternalIssueSummaryApiResponse;
}

export interface ExternalIssueSummaryApiResponse {
  id: string;
  link: string;
}
