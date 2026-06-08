import { LiteBinaryImpact } from "@mxflow/features/failure-management";

export interface FetchBinaryImpactsResponse {
  binaryImpacts: BinaryImpactPageModel;
  warningMessage?: string;
}

export interface BinaryImpactPageModel {
  content: LiteBinaryImpact[];
  totalElements: number;
}
