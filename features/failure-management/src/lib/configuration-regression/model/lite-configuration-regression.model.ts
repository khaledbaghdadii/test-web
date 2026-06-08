import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface LiteConfigurationRegression extends AnalysisObject {
  projectId: string;
  title: string;
  guiltyChange: string;
  fix: string;
  owner: string;
}
