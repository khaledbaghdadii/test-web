export interface FetchBinaryRegressionsTableQuery
  extends Record<string, unknown> {
  fixPhrase?: string;
  ownerPhrase?: string;
  ids?: string[];
  titlePhrases?: string[];
  defectIdPhrases?: string[];
  mxVersionPhrases?: string[];
}
