import { GitFileStatus } from "@mxflow/ui/file-tree";
import {
  GitFileStatusCode,
  mapGitFileStatusCodeToGitFileStatus,
} from "../../remote-cloned-repository/model";

export interface ChangedFile {
  filePath: string;
  statusCode: GitFileStatusCode;
}

export interface ChangedFileDisplay {
  filePath: string;
  fileName: string;
  directory: string;
  label: string;
  colorClass: string;
}

interface StatusDisplay {
  label: string;
  colorClass: string;
}

const STATUS_DISPLAY_BY_GIT_STATUS: Record<GitFileStatus, StatusDisplay> = {
  [GitFileStatus.Modified]: { label: "M", colorClass: "text-orange-400" },
  [GitFileStatus.Added]: { label: "A", colorClass: "text-green-400" },
  [GitFileStatus.Deleted]: { label: "D", colorClass: "text-red-400" },
  [GitFileStatus.Renamed]: { label: "R", colorClass: "text-blue-400" },
  [GitFileStatus.Copied]: { label: "C", colorClass: "text-blue-400" },
  [GitFileStatus.Untracked]: { label: "U", colorClass: "text-green-400" },
  [GitFileStatus.Conflicted]: { label: "!", colorClass: "text-red-500" },
  [GitFileStatus.Ignored]: { label: "I", colorClass: "text-gray-400" },
  [GitFileStatus.Staged]: { label: "S", colorClass: "text-green-500" },
  [GitFileStatus.Unmodified]: { label: " ", colorClass: "text-gray-400" },
  [GitFileStatus.Unknown]: { label: "?", colorClass: "text-gray-400" },
};

const NON_CHANGE_STATUSES = new Set<GitFileStatus>([
  GitFileStatus.Unknown,
  GitFileStatus.Unmodified,
]);

export function toChangedFileDisplay(file: ChangedFile): ChangedFileDisplay {
  const parts = file.filePath.split("/");
  const fileName = parts.pop() ?? file.filePath;
  const directory = parts.join("/");
  const gitStatus = mapGitFileStatusCodeToGitFileStatus(file.statusCode);
  const { label, colorClass } = STATUS_DISPLAY_BY_GIT_STATUS[gitStatus];

  return { filePath: file.filePath, fileName, directory, label, colorClass };
}

export function toChangedFileDisplays(
  files: ChangedFile[]
): ChangedFileDisplay[] {
  return files
    .filter(
      (file) =>
        !NON_CHANGE_STATUSES.has(
          mapGitFileStatusCodeToGitFileStatus(file.statusCode)
        )
    )
    .map(toChangedFileDisplay);
}
