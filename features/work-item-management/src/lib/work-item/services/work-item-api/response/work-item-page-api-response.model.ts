import { WorkItem } from "../../../model/work-item";

export interface WorkItemPageApiResponse {
  content: WorkItem[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}
