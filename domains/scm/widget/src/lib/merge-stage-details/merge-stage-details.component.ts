import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { Divider } from "primeng/divider";
import { FailureReason } from "@mxevolve/domains/scm/data-access";

export interface MergeStageData {
  mergeRequestState: string;
  failureReason?: string;
  developmentName: string;
  destinationBranch: string;
  endDate?: string;
}

@Component({
  selector: "mxevolve-merge-stage-details",
  standalone: true,
  imports: [Tag, Divider],
  templateUrl: "./merge-stage-details.component.html",
})
export class MergeStageDetailsComponent {
  readonly data = input.required<MergeStageData>();

  readonly isMerged = computed(
    () => this.data().mergeRequestState === "MERGED"
  );

  readonly isMergeFailed = computed(
    () => this.data().mergeRequestState === "MERGE_FAILED"
  );

  readonly mergeHeaderVerb = computed(() => {
    switch (this.data().mergeRequestState) {
      case "MERGED":
        return "Successful!";
      case "MERGE_FAILED":
        return "Failed!";
      default:
        return "In Progress";
    }
  });

  readonly mergeStatusSeverity = computed(() => {
    switch (this.data().mergeRequestState) {
      case "MERGED":
        return "success";
      case "MERGE_FAILED":
        return "danger";
      default:
        return "info";
    }
  });

  readonly mergeStatusLabel = computed(() => {
    switch (this.data().mergeRequestState) {
      case "MERGED":
        return "Successful";
      case "MERGE_FAILED":
        return "Failed";
      default:
        return "In Progress";
    }
  });

  readonly failureReasonMessage = computed(() => {
    const reason = this.data().failureReason as FailureReason | undefined;
    if (!reason) return "-";
    switch (reason) {
      case FailureReason.PR_UNAPPROVED:
      case FailureReason.PR_DECLINED:
        return "Merge failed due to declined pull request";
      case FailureReason.PR_DELETED:
      case FailureReason.MERGE_REQUEST_NOT_FOUND:
        return "Merge failed due to deleted merge request";
      case FailureReason.TECHNICAL_FAILURE:
        return "Merge failed due to a technical failure";
      case FailureReason.PR_NOT_MERGEABLE:
        return "Merge failed due to unmergeable merge request";
      default:
        return reason;
    }
  });
}
