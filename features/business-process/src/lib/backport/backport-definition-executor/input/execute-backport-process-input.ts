import { Reviewer } from "@mxflow/features/scm";

export interface ExecuteBackportProcessInput {
  name: string;
  pullRequestId: string;
  userStoryIds: string[];
  pullRequestTitle: string;
  pullRequestReviewers: Reviewer[];
  notificationsRecipients?: string[];
}
