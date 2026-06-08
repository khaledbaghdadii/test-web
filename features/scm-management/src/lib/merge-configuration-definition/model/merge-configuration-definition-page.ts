import { MergeConfigurationDefinition } from "./merge-configuration-definition";

export interface MergeConfigurationDefinitionPage {
  content: MergeConfigurationDefinition[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
