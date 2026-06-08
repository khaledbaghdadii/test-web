export interface FetchConfigurationRegressionsRequest {
  page?: number;
  size?: number;
  ids?: string[];
  fixPhrase?: string;
  ownerPhrase?: string;
  titlePhrases?: string[];
  guiltyChangePhrases?: string[];
}

export interface FetchConfigurationRegressionsApiRequest {
  ids?: string[];
  fixPhrase?: string;
  ownerPhrase?: string;
  titlePhrases?: string[];
  guiltyChangePhrases?: string[];
}
