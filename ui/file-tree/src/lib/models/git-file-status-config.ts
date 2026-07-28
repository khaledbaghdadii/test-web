import { GitFileStatus } from "./git-file-status.enum";

/**
 * Visual configuration for each {@link GitFileStatus}.
 *
 * Defines how a given status is rendered in the file tree:
 * its utility class, human-readable label, and short indicator letter.
 */
export interface GitFileStatusConfig {
  nodeClass: string;
  label: string;
  indicator: string;
  badgeSeverity:
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "secondary"
    | "contrast";
}

export const GIT_FILE_STATUS_CONFIG: Readonly<
  Record<GitFileStatus, GitFileStatusConfig>
> = {
  [GitFileStatus.Unmodified]: {
    nodeClass: "",
    label: "Unmodified",
    indicator: "",
    badgeSeverity: "secondary",
  },
  [GitFileStatus.Modified]: {
    nodeClass: "text-yellow-500",
    label: "Modified",
    indicator: "M",
    badgeSeverity: "warn",
  },
  [GitFileStatus.Staged]: {
    nodeClass: "text-green-500",
    label: "Staged",
    indicator: "S",
    badgeSeverity: "success",
  },
  [GitFileStatus.Untracked]: {
    nodeClass: "text-green-400",
    label: "Untracked",
    indicator: "U",
    badgeSeverity: "success",
  },
  [GitFileStatus.Conflicted]: {
    nodeClass: "text-red-500",
    label: "Conflicted",
    indicator: "!",
    badgeSeverity: "danger",
  },
  [GitFileStatus.Added]: {
    nodeClass: "text-green-600",
    label: "Newly Added",
    indicator: "N",
    badgeSeverity: "success",
  },
  [GitFileStatus.Deleted]: {
    nodeClass: "text-red-400",
    label: "Deleted",
    indicator: "D",
    badgeSeverity: "danger",
  },
  [GitFileStatus.Renamed]: {
    nodeClass: "text-cyan-500",
    label: "Renamed",
    indicator: "R",
    badgeSeverity: "info",
  },
  [GitFileStatus.Copied]: {
    nodeClass: "text-cyan-400",
    label: "Copied",
    indicator: "C",
    badgeSeverity: "info",
  },
  [GitFileStatus.Ignored]: {
    nodeClass: "text-gray-500",
    label: "Ignored",
    indicator: "I",
    badgeSeverity: "secondary",
  },
  [GitFileStatus.Unknown]: {
    nodeClass: "text-gray-500",
    label: "Unknown",
    indicator: "",
    badgeSeverity: "secondary",
  },
};
