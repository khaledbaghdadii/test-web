export interface BinaryUpgradeExecutionsQueryRequest
  extends Record<string, any> {
  page: number;
  pageSize: number;
  definitionIds?: string[];
  statuses?: string[];
  parentMxArchivalBranchPhrase?: string;
  mxVersionPhrase?: string;
  mxBuildIdPhrase?: string;
  configurationBranchNamePhrase?: string;
  businessProcessQualityLevel?: string[];
  ownerPhrase?: string;
  startDateRangeStart?: string;
  startDateRangeEnd?: string;
  endDateRangeStart?: string;
  endDateRangeEnd?: string;
  expiryDateRangeStart?: string;
  expiryDateRangeEnd?: string;
  namePhrase?: string;
  sort?: string;
  officiality?: string[];
  hidden?: boolean;
}
