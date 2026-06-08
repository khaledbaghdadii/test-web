export interface FetchBinaryRegressionsRequest {
  fixPhrase?: string;
  ownerPhrase?: string;
  ids?: string[];
  titlePhrases?: string[];
  defectIdPhrases?: string[];
  mxVersionPhrases?: string[];
  currentVersion?: string;
  referenceVersion?: string;
  returnBinaryRegressionsNotLinkedToAnyDefect?: boolean;
}

export interface Pageable {
  page: number;
  size: number;
}
