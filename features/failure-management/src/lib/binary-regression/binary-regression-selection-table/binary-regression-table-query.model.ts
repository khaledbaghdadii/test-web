export interface BinaryRegressionTableQuery {
  page?: number;
  pageSize?: number;
  fixPhrase?: string;
  ownerPhrase?: string;
  titlePhrases?: string[];
  defectIdPhrases?: string[];
  mxVersionPhrases?: string[];
}
