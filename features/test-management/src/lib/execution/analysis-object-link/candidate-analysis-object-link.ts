import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

export interface CandidateAnalysisObjectLinkResponse {
  id: string;
}

export interface CreateCandidateAnalysisObjectLinksRequest {
  analysisObjectType: AnalysisObjectType;
  candidateLinks: CandidateAnalysisObjectLink[];
}

export interface CandidateAnalysisObjectLink {
  testCaseExecutionId?: string;
}
