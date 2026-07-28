export interface ValidationProcessExecutionsTableQuery
  extends Record<string, unknown> {
  page: number;
  pageSize: number;
  namePhrase?: string;
  statuses?: string[];
  officiality?: string[];
  businessProcessQualityLevel?: string[];
  ownerPhrase?: string;
  definitionIds?: string[];
  processNames?: string[];
  startDateRange?: string[];
  endDateRange?: string[];
  expiryDateRange?: string[];
  sortByStartDate?: string;
  sortByExpiryDate?: string;
  sortByDaysExtended?: string;
}
