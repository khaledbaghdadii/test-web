import { MergeConfigurationDefinitionApiResponse } from "./merge-configuration-definition-api-response";

export interface MergeConfigurationDefinitionApiPage {
  content: MergeConfigurationDefinitionApiResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
