export interface BinaryUpgradeExecutionsTableQuery extends Record<string, any> {
  page: number;
  pageSize: number;
  definitionIds?: string[];
  processNames?: string[];
  statuses?: string[];
  parentMxArchivalBranchPhrase?: string;
  mxVersionPhrase?: string;
  mxBuildIdPhrase?: string;
  configurationBranchNamePhrase?: string;
  businessProcessQualityLevel?: string[];
  ownerPhrase?: string;
  startDateRange?: string[];
  endDateRange?: string[];
  expiryDateRange?: string[];
  namePhrase?: string;
  sortByStartDate?: string;
  sortByExpiryDate?: string;
  sortByDaysExtended?: string;
  officiality?: string[];
}
