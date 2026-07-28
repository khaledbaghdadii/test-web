export interface VerticalTimelineStage {
  name: string;
  status: VerticalTimelineStageStatus;
}

export enum VerticalTimelineStageStatus {
  RUNNING = "RUNNING",
  PASSED = "PASSED",
  FAILED = "FAILED",
}
