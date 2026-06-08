import { GroupMetrics } from "./group-metrics";

export interface GroupMetricsPage {
  content: GroupMetrics[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
