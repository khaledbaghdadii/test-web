export interface LiteBinaryRegressionApiResponse {
  id: string;
  title: string;
  defect: DefectApiResponse;
  fix: string;
  mxVersion: string;
  owner?: string;
}

class DefectApiResponse {
  id: string;
  link: string;
}

export interface FetchBinaryRegressionsApiResponse {
  binaryRegressions: BinaryRegressionApiPage;
  warningMessage?: string;
}

export interface BinaryRegressionApiPage {
  content: LiteBinaryRegressionApiResponse[];
  totalElements: number;
}
