export interface FetchBinaryImpactsQueryApiRequest {
  ids?: string[];
  titlePhrase?: string;
  ownerPhrase?: string;
  mxVersionPhrases?: string[];
  upgradeImpactExternalIssuePhrase?: string;
  currentVersion?: string;
  referenceVersion?: string;
  returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact?: boolean;
}
