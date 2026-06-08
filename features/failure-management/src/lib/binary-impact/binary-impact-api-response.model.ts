export interface BinaryImpactApiResponse {
  id: string;
  title: string;
  owner: string;
  mxVersion: string;
  projectId: string;
  description: string;
  correlationId: string;
  upgradeImpactId?: string;
  creationDate: Date;
  attachments: BinaryImpactAttachmentApiModel[];
  resolutionType: ClientImpactNoteFieldApiModel;
  stream: ClientImpactNoteFieldApiModel;
  region: ClientImpactNoteFieldApiModel;
  sourceType: ClientImpactNoteFieldApiModel;
  cbpmL1L2L3: ClientImpactNoteFieldApiModel[];
  cbpmL2Scope: ClientImpactNoteFieldApiModel[];
  cbpmL3L4: ClientImpactNoteFieldApiModel[];
  impactedOutputs?: ClientImpactNoteFieldApiModel;
  propagationPattern?: string;
  configurationDesign?: string;
  magnitude?: string;
  identificationPattern?: string;
  propagationQuery?: string;
}

export interface BinaryImpactAttachmentApiModel {
  attachmentId: string;
  name: string;
  type: string;
  downloadLink: string;
}

export interface ClientImpactNoteFieldApiModel {
  id: string;
  name: string;
}
