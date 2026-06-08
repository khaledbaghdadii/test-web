export interface FetchDefectsQuery {
  page?: number;
  size?: number;
  sort?: string;
  idPhrase?: string;
  titlePhrase?: string;
  descriptionPhrase?: string;
  developerPhrase?: string;
  currentVersion?: string;
  referenceVersion?: string;
}
