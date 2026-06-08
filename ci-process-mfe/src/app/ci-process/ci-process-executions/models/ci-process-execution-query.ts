export interface CiProcessExecutionsQuery extends Record<string, any> {
  page?: number;
  pageSize?: number;
  ids?: string[];
  statuses?: string[];
  namePhrase?: string;
  ownerPhrase?: string;
  userStoryIds?: string[];
  definitionIds?: string[];
  configurationBranchNamePhrase?: string;
  startDateRangeStart?: string;
  startDateRangeEnd?: string;
  endDateRangeStart?: string;
  endDateRangeEnd?: string;
  expiryDateRangeStart?: string;
  expiryDateRangeEnd?: string;
  sort?: string;
  hidden?: boolean;
}
