import { LiteBinaryImpactApiResponse } from "./lite-binary-impact-api-response.model";

export interface FetchBinaryImpactsApiResponse {
  binaryImpacts: BinaryImpactPageApiModel;
  warningMessage?: string;
}

export interface BinaryImpactPageApiModel {
  content: LiteBinaryImpactApiResponse[];
  totalElements: number;
}
