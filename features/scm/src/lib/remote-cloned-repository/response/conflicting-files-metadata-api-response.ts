import { GitFileStatusCode } from "../model";

export interface ConflictingFileMetadataApiResponse {
  filePath: string;
  newFilePath?: string;
  workspaceFileByteSize: number;
  baseFileByteSize: number;
  localFileByteSize: number;
  remoteFileByteSize: number;
  gitFileStatusCode: GitFileStatusCode;
}
