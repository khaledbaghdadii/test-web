export interface BinaryImpact {
  id: string;
  owner: string;
  title: string;
  projectId: string;
  description: string;
  mxVersion: string;
  correlationId: string;
  upgradeImpactId?: string;
  creationDate: Date;
  attachments: BinaryImpactAttachment[];
  resolutionType: ClientImpactNoteField;
  stream: ClientImpactNoteField;
  region: ClientImpactNoteField;
  sourceType: ClientImpactNoteField;
  cbpmL1L2L3: ClientImpactNoteField[];
  cbpmL2Scope: ClientImpactNoteField[];
  cbpmL3L4: ClientImpactNoteField[];
  impactedOutputs?: ClientImpactNoteField;
  propagationPattern?: string;
  configurationDesign?: string;
  magnitude?: string;
  identificationPattern?: string;
  propagationQuery?: string;
  incidentId?: string;
}

export interface BinaryImpactAttachment {
  attachmentId: string;
  name: string;
  type: string;
  downloadLink: string;
}

export interface ClientImpactNoteField {
  id: string;
  name: string;
}
