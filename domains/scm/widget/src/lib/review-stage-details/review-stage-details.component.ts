import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { Divider } from "primeng/divider";
import {
  MxevolveIllustrationComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { MergeRequestPrioritySelectorComponent } from "../merge-request-priority-selector/merge-request-priority-selector.component";
import { MergeRequestPriority } from "@mxevolve/domains/scm/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";

export interface ReviewStageData {
  mergeRequestId: string;
  /** MergeRequestState enum value (e.g. IN_REVIEW, DECLINED, MERGED). Typed as string to avoid a cross-layer import. */
  mergeRequestState: string;
  destinationBranch: string;
  pullRequestUrl: string;
  /** Internal merge request ID (not pullRequestId). Required for priority selector. */
  id?: string;
  projectId?: string;
  mergeRequestPriority?: string;
}

@Component({
  selector: "mxevolve-review-stage-details",
  standalone: true,
  imports: [
    Tag,
    Divider,
    MxevolveIllustrationComponent,
    MxevolveIconComponent,
    MergeRequestPrioritySelectorComponent,
    ShowElementIfAuthorizedDirective,
  ],
  templateUrl: "./review-stage-details.component.html",
})
export class ReviewStageDetailsComponent {
  readonly data = input.required<ReviewStageData>();

  readonly reviewStatusLabel = computed(() => {
    switch (this.data().mergeRequestState) {
      case "IN_REVIEW":
        return "Under Review";
      case "IN_REVIEW_NOT_MERGEABLE":
        return "Not Mergeable";
      case "REVIEW_FAILED":
        return "Failed";
      case "DECLINED":
        return "Declined";
      case "DELETED":
        return "Deleted";
      default:
        return "Approved";
    }
  });

  readonly reviewStatusSeverity = computed(() => {
    switch (this.data().mergeRequestState) {
      case "IN_REVIEW":
        return "warn";
      case "IN_REVIEW_NOT_MERGEABLE":
      case "REVIEW_FAILED":
      case "DECLINED":
      case "DELETED":
        return "danger";
      default:
        return "success";
    }
  });

  readonly prioritySelectorModel = computed(() => {
    const d = this.data();
    return {
      id: d.id ?? "",
      projectId: d.projectId ?? "",
      mergeRequestPriority:
        (d.mergeRequestPriority as MergeRequestPriority) ??
        MergeRequestPriority.MEDIUM,
    };
  });
}
