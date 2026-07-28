export interface IncidentsTableQuery extends Record<string, unknown> {
  page: number;
  pageSize: number;
  sort?: string;
  titlePhrase?: string;
  statuses?: string[];
  externalIssueIdPhrase?: string;
  reporterPhrase?: string;
  assigneePhrase?: string;
}
