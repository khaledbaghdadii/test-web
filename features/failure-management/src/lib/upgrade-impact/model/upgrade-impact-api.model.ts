export interface UpgradeImpactApiModel {
  id: string;
  title: string;
  impactType: string;
  bpcFFTopic: string[];
  defects: DefectApiModel[];
  impactedOutputs: string;
  fullDescription: string;
  introducedInArchival: string[];
  externalIssue: ExternalIssueApiModel;
  impactDocumentationTrigger: string;
  introducedInReleaseVersion: string[];
  impactedInstrumentsScope: string[];
  attachments: UpgradeImpactAttachmentApiModel[];
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

interface UpgradeImpactAttachmentApiModel {
  attachmentId: string;
  upgradeImpactId: string;
  name: string;
  type: string;
  downloadLink: string;
  externalAttachment: ExternalAttachmentApiModel;
}

interface ExternalAttachmentApiModel {
  id: string;
  origin: string;
}
