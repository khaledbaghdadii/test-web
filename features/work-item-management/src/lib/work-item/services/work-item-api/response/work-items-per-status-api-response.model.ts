import { WorkItemStatus } from "../../../model/work-item";
import { WorkItemPageApiResponse } from "./work-item-page-api-response.model";

export type WorkItemsPerStatusApiResponse = {
  [workItemStatus in WorkItemStatus]?: WorkItemPageApiResponse;
};
