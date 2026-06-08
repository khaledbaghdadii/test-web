import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface LiteConfigurationImpact extends AnalysisObject {
  projectId: string;
  title: string;
  guiltyChange: string;
  owner: string;
}
