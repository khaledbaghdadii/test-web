export interface FetchUpgradeImpactsQueryResult {
  upgradeImpacts: UpgradeImpactPage;
  warningMessage?: string;
}

export interface LiteUpgradeImpact {
  id: string;
  title: string;
  impactType: string;
  bpcFFTopic: string[];
  defects: Defect[];
  impactedOutputs: string;
  textOnlyDescription: string;
  introducedInArchival: string[];
  externalIssue: ExternalIssue;
  impactDocumentationTrigger: string;
  introducedInReleaseVersion: string[];
  impactedInstrumentsScope: string[];
}

interface UpgradeImpactPage {
  content: LiteUpgradeImpact[];
  totalElements: number;
}

export interface Defect {
  defectId: string;
  defectLink: string;
}

interface ExternalIssue {
  id: string;
  link: string;
  origin: string;
}
