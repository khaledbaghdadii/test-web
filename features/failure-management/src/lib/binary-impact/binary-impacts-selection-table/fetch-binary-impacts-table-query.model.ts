export interface FetchBinaryImpactsTableQuery extends Record<string, unknown> {
  page: number;
  pageSize: number;
  titlePhrase?: string;
  ownerPhrase?: string;
  mxVersionPhrases?: string[];
  upgradeImpactExternalIssuePhrase?: string;
}
