export interface FetchUpgradeImpactsApiQueryResult {
  upgradeImpacts: UpgradeImpactPageApiModel;
  warningMessage?: string;
}

export interface LiteUpgradeImpactApiModel {
  id: string;
  title: string;
  impactType: string;
  bpcFFTopic: string[];
  defects: DefectApiModel[];
  impactedOutputs: string;
  textOnlyDescription: string;
  introducedInArchival: string[];
  externalIssue: ExternalIssueApiModel;
  impactDocumentationTrigger: string;
  introducedInReleaseVersion: string[];
  impactedInstrumentsScope: string[];
}

interface UpgradeImpactPageApiModel {
  content: LiteUpgradeImpactApiModel[];
  totalElements: number;
}

interface DefectApiModel {
  defectId: string;
  defectLink: string;
}

interface ExternalIssueApiModel {
  id: string;
  link: string;
  origin: string;
}
