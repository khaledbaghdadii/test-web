import { GitFileStatus } from "./git-file-status.enum";
export interface FileNodeData {
  filePath: string;
  isDirectory?: boolean;
  isLoading?: boolean;
  gitStatus?: GitFileStatus;
  sizeInBytes?: number;
  metadata?: Record<string, unknown>;
}
