import {MergeConfigurationApiResponse} from "./merge-configuration-api-response";

export interface MergeConfigurationApiPage {
  content: MergeConfigurationApiResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
