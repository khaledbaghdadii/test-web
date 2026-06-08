export interface ConfigurationRegressionTableQuery {
  page?: number;
  pageSize?: number;
  fixPhrase?: string;
  ownerPhrase?: string;
  titlePhrases?: string[];
  guiltyChangePhrases?: string[];
}
