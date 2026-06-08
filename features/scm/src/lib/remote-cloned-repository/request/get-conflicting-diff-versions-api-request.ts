import { DiffVersion } from "../model/diff-version.enum";

export interface GetConflictingDiffVersionsApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  filePath: string;
  requestedDiffVersions: DiffVersion[];
}
