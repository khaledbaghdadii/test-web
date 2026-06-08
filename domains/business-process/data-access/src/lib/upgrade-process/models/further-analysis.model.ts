export interface LinkedIncident {
  id: string;
  externalIssueId: string | null;
  externalIssueLink: string | null;
}

export interface FurtherAnalysisLinkedScenario {
  id: string;
  name: string;
  linkedIncidents: LinkedIncident[];
}

export interface FurtherAnalysisCandidate {
  id: string;
  tags: string[];
  linkedScenario: FurtherAnalysisLinkedScenario | null;
}

export interface FurtherAnalysisCandidatesResponse {
  candidates: FurtherAnalysisCandidate[];
}

export interface MarkResourcesForFurtherAnalysisRequest {
  scenarioIds: string[];
  environmentIds: string[];
}

export interface SelectedFurtherAnalysisResource {
  id: string;
  tags: string[];
  linkedScenario: FurtherAnalysisLinkedScenario | null;
}

export interface SelectedFurtherAnalysisResourcesResponse {
  resources: SelectedFurtherAnalysisResource[];
}
