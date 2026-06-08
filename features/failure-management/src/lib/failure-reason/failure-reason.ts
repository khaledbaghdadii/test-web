import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface FailureReason extends AnalysisObject {
  title: string;
  description: string;
  isEnabled: boolean;
}
