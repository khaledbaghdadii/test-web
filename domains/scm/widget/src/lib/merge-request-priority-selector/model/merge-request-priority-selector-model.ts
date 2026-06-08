import { MergeRequestPriority } from "@mxevolve/domains/scm/data-access";

export interface MergeRequestPrioritySelectorModel {
  id: string;
  projectId: string;
  mergeRequestPriority: MergeRequestPriority;
}
