import { VersionType } from "./version-api-model";

export interface FetchVersionsQuery {
  page: number;
  size: number;
  versionTypes?: VersionType[];
  active?: boolean;
  namePhrase?: string;
}
