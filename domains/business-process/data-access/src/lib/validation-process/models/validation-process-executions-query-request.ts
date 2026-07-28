export interface ValidationProcessExecutionsQueryRequest
  extends Record<string, unknown> {
  page: number;
  pageSize: number;
  namePhrase?: string;
  officiality?: string[];
  businessProcessQualityLevel?: string[];
  ownerPhrase?: string;
  statuses?: string[];
  definitionIds?: string[];
  startDateRangeStart?: string;
  startDateRangeEnd?: string;
  endDateRangeStart?: string;
  endDateRangeEnd?: string;
  expiryDateRangeStart?: string;
  expiryDateRangeEnd?: string;
  sort?: string;
  hidden?: boolean;
  parentBranch?: string;
  rtpCommitPhrase?: string;
}
