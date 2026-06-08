export interface EditBinaryImpactRequest {
  title?: string;
  description?: string;
  upgradeImpactId?: string;
  region: string;
  stream: string;
  magnitude?: string;
  sourceType: string;
  resolutionType: string;
  impactedOutputs?: string;
  propagationQuery?: string;
  propagationPattern?: string;
  configurationDesign?: string;
  identificationPattern?: string;
  cbpmL3L4?: string[];
  cbpmL1L2L3: string[];
  cbpmL2Scope: string[];
  incidentId?: string;
}
