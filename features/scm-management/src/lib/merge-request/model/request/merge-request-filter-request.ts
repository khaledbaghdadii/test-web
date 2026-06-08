export interface MergeRequestFilterRequest {
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

export interface DateRange {
  fromDate: Date;
  toDate: Date;
}
