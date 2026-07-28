export interface FetchBinaryImpactsQuery {
  page?: number;
  size?: number;
  ids?: string[];
  titlePhrase?: string;
  objectIdPhrase?: string;
  ownerPhrase?: string;
  mxVersionPhrases?: string[];
  upgradeImpactExternalIssuePhrase?: string;
  currentVersion?: string;
  referenceVersion?: string;
  returnBinaryImpactsNotLinkedToAnyDefectOrAnyUpgradeImpact?: boolean;
  testCaseExternalIds?: string[];
  scenarioDefinitionId?: string;
  projectIds?: string[];
}
