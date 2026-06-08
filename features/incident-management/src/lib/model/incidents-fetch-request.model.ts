export interface IncidentsFetchRequest {
  queryParams?: IncidentsQueryParams;
  filters?: IncidentsApiRequest;
}

export interface IncidentsQueryParams {
  page: number;
  size: number;
}

export interface IncidentsApiRequest {
  titlePhrase?: string;
  statuses?: string[];
  ids?: string[];
  externalIssueIdPhrase?: string;
  reporterPhrase?: string;
  assigneePhrase?: string;
}
