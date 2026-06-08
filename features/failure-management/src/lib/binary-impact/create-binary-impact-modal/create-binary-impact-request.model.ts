export class CreateBinaryImpactRequest {
  title: string;
  description: string;
  mxVersion: string;
  upgradeImpactId?: string;
  incidentId?: string;
  correlationId: string;
  attachmentIds: string[];
  cbpmL1L2L3: string[];
  cbpmL2Scope: string[];
  stream: string;
  region: string;
  sourceType: string;
  resolutionType: string;
  impactedOutputs?: string;
  cbpmL3L4?: string[];
  identificationPattern?: string;
  propagationPattern?: string;
  propagationQuery?: string;
  configurationDesign?: string;
  magnitude?: string;
}
