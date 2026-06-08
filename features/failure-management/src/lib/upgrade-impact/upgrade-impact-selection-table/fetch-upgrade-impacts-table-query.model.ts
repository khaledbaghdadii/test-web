export interface FetchUpgradeImpactsTableQuery extends Record<string, unknown>{
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
}