import { WorkItemStatus } from "../../../model/work-item";

export interface WorkItemBoardColumnConfig {
  readonly id: string;
  readonly title: string;
  readonly status: WorkItemStatus;
}
