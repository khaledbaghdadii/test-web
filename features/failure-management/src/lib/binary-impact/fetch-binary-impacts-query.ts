export interface FetchBinaryImpactsQuery {
  page?: number;
  size?: number;
  ids?: string[];
  titlePhrase?: string;
  ownerPhrase?: string;
  mxVersionPhrases?: string[];
  upgradeImpactExternalIssuePhrase?: string;
  currentVersion?: string;
  referenceVersion?: string;
  returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact?: boolean;
}
