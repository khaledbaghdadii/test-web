import { DiffVersion } from "../model/diff-version.enum";

export interface GetConflictingDiffVersionsApiResponse {
  versionContents: Partial<Record<DiffVersion, string>>;
}
