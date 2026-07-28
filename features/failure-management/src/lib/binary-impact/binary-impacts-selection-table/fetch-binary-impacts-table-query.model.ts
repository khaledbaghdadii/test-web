export interface FetchBinaryImpactsTableQuery extends Record<string, unknown> {
  page: number;
  pageSize: number;
  titlePhrase?: string;
  objectIdPhrase?: string;
  ownerPhrase?: string;
  mxVersionPhrases?: string[];
  upgradeImpactExternalIssuePhrase?: string;
}
