import { DateRange } from "./merge-request-filter-request";

export interface MergeRequestApiFilterRequest {
  searchKey?: string;
  repositoryId?: string;
  destinationBranches?: string[];
  mergeRequestStates?: string[];
  mergeRequestStatuses?: string[];
  createdOnDateRange?: DateRange;
  endDateDateRange?: DateRange;
  developmentId?: string;
  contextId?: string;
}
