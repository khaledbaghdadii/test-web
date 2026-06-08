import { MergeRequestPriority } from "../../merge-request/model/merge-request";

export interface MergeRequestPrioritySelectorModel {
  id: string;
  projectId: string;
  mergeRequestPriority: MergeRequestPriority;
}
