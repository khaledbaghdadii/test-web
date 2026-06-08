export interface CiProcessExecutionsTableQuery extends Record<string, any> {
  page: number;
  pageSize: number;
  statuses?: string[];
  namePhrase?: string;
  ownerPhrase?: string;
  userStoryIds?: string[];
  definitionIds?: string[];
  processNames?: string[];
  configurationBranchNamePhrase?: string;
  startDateRange?: string[];
  endDateRange?: string[];
  expiryDateRange?: string[];
  sortByStartDate?: string;
  sortByExpiryDate?: string;
  sortByDaysExtended?: string;
}
