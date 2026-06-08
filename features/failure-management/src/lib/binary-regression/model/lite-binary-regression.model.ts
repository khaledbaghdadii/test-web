import { AnalysisObject } from "@mxflow/features/analysis-objects";

export interface LiteBinaryRegression extends AnalysisObject {
  projectId?: string;
  title: string;
  defect?: Defect;
  fix: string;
  mxVersion: string;
  owner?: string;
}

class Defect {
  id: string;
  link: string;
}

export interface FetchBinaryRegressionsResponse {
  binaryRegressions: BinaryRegressionPage;
  warningMessage?: string;
}

export interface BinaryRegressionPage {
  content: LiteBinaryRegression[];
  totalElements: number;
}
