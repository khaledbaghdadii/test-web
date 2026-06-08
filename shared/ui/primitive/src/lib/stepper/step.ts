export type StepStatus =
  | "active"
  | "inactive"
  | "completed"
  | "failed"
  | "skipped";

export interface StepDefinition {
  id: string;
  title: string;
  status: StepStatus;
  tooltip?: string;
}
