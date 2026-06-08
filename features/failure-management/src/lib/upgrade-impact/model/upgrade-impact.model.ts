export interface UpgradeImpact {
  id: string;
  title: string;
  impactType?: string;
  bpcFFTopic?: string[];
  defects?: Defect[];
  impactedOutputs?: string;
  fullDescription: string;
  introducedInArchival?: string[];
  externalIssue: ExternalIssue;
  impactDocumentationTrigger?: string;
  introducedInReleaseVersion?: string[];
  impactedInstrumentsScope?: string[];
  attachments?: UpgradeImpactAttachment[];
}

interface Defect {
  defectId: string;
  defectLink: string;
}

interface ExternalIssue {
  id: string;
  link: string;
  origin: string;
}
export interface UpgradeImpactAttachment {
  attachmentId: string;
  upgradeImpactId: string;
  name: string;
  type: string;
  downloadLink: string;
  externalAttachment: ExternalAttachment;
}

interface ExternalAttachment {
  id: string;
  origin: string;
}
