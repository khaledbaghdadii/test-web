export interface FetchUpgradeImpactsQuery {
  page: number;
  size: number;
  sort?: string;
  titlePhrases?: string[];
  descriptionPhrase?: string;
  externalIssueIdPhrases?: string[];
  introducedInArchivalPhrases?: string[];
  introducedInReleaseVersionPhrases?: string[];
  defectIdPhrases?: string[];
  bpcFfTopicPhrases?: string[];
  impactedInstrumentsScopePhrases?: string[];
  impactedOutputsPhrases?: string[];
  currentVersion?: string;
  referenceVersion?: string;
  returnUpgradeImpactsNotLinkedToAnyDefect?: boolean;
}
