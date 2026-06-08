export interface Stage {
  name: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  errorMessage?: string;
}

export enum StageStatus {
  NOT_STARTED = "NOT_STARTED",
  RUNNING = "RUNNING",
  PASSED = "PASSED",
  FAILED = "FAILED",
  PENDING_INPUT = "PENDING_INPUT",
  SKIPPED = "SKIPPED",
  STOPPED = "STOPPED",
  NA = "NA",
}
