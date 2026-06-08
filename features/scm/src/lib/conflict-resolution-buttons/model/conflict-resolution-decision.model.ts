export enum ConflictResolutionDecisionType {
  KEEP_BASE = "KEEP_BASE",
  KEEP_LOCAL = "KEEP_LOCAL",
  KEEP_REMOTE = "KEEP_REMOTE",
  DELETE_FILE = "DELETE_FILE",
}

export interface ConflictResolutionDecision {
  decision: ConflictResolutionDecisionType;
  filePath: string;
}
