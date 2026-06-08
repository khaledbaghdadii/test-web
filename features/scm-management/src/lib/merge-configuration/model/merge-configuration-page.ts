import {MergeConfiguration} from "./merge-configuration";

export interface MergeConfigurationPage {
  content: MergeConfiguration[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
