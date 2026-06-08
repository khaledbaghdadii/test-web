import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import { PaginatedCommitsDifferenceComponent } from "../paginated-commits-difference/paginated-commits-difference.component";
import { MergeRequestPrioritySelectorComponent } from "../merge-request-priority-selector/merge-request-priority-selector.component";
import {
  FailureReason,
  MergeRequestBuild,
  MergeRequestPriority,
} from "@mxevolve/domains/scm/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import {
  MxevolveIconComponent,
  MxevolveIllustrationComponent,
} from "@mxevolve/shared/ui/primitive";

export interface UnderValidationStageData {
  mergeRequestState: string;
  failureReason?: string;
  queuePosition?: number;
  queuedDate?: string;
  isLastBuildInBulkMode?: boolean;
  mergeRequestPriority?: string;
  developmentName: string;
  destinationBranch: string;
  projectId: string;
  mergeRequestId: string;
  repositoryId: string;
  sourceBranch: string;
  builds?: MergeRequestBuild[];
}

@Component({
  selector: "mxevolve-under-validation-stage-details",
  standalone: true,
  imports: [
    Tag,
    ScenarioRunsComponent,
    PaginatedCommitsDifferenceComponent,
    MergeRequestPrioritySelectorComponent,
    ShowElementIfAuthorizedDirective,
    MxevolveIllustrationComponent,
    MxevolveIconComponent,
  ],
  templateUrl: "./under-validation-stage-details.component.html",
})
export class UnderValidationStageDetailsComponent {
  readonly data = input.required<UnderValidationStageData>();

  readonly isQueued = computed(
    () => this.data().mergeRequestState === "QUEUED"
  );

  readonly isUnderValidation = computed(
    () =>
      this.data().mergeRequestState === "UNDER_VALIDATION" ||
      this.data().mergeRequestState === "MERGED" ||
      this.data().mergeRequestState === "MERGE_FAILED"
  );

  readonly isRebaseFailed = computed(
    () =>
      this.data().mergeRequestState === "UNDER_VALIDATION_FAILED" &&
      this.data().failureReason === FailureReason.REBASE_CONFLICT
  );

  readonly isValidationFailed = computed(
    () =>
      this.data().mergeRequestState === "UNDER_VALIDATION_FAILED" &&
      this.data().failureReason !== FailureReason.REBASE_CONFLICT
  );

  readonly scenarioRunIds = computed(
    () =>
      this.data()
        .builds?.filter((b) => b.scenarioExecutionId)
        .map((b) => b.scenarioExecutionId!) ?? []
  );

  readonly mergeMode = computed(() => {
    const bulk = this.data().isLastBuildInBulkMode;
    if (bulk == null) return "N/A";
    return bulk ? "Bulk" : "Sequential";
  });

  readonly prioritySelectorModel = computed(() => {
    const d = this.data();
    return {
      id: d.mergeRequestId,
      projectId: d.projectId,
      mergeRequestPriority:
        (d.mergeRequestPriority as MergeRequestPriority) ??
        MergeRequestPriority.MEDIUM,
    };
  });

  readonly rebaseStatusSeverity = computed(() => {
    if (this.isRebaseFailed()) return "danger";
    return "success";
  });

  readonly rebaseStatusLabel = computed(() => {
    if (this.isRebaseFailed()) return "Failed";
    return "Successful";
  });

  readonly rebaseFailureReason = computed(() => {
    if (!this.isRebaseFailed()) return "-";
    const reason = this.data().failureReason as FailureReason | undefined;
    if (reason === FailureReason.REBASE_CONFLICT) {
      return "Lorem ipsum Lorem ipsum";
    }
    return "-";
  });

  readonly mergeRequestPriority = computed(() => {
    const priority = this.data().mergeRequestPriority as
      | MergeRequestPriority
      | undefined;
    switch (priority) {
      case MergeRequestPriority.CRITICAL:
        return "Critical";
      case MergeRequestPriority.HIGH:
        return "High";
      case MergeRequestPriority.MEDIUM:
        return "Medium";
      case MergeRequestPriority.LOW:
        return "Low";
      default:
        return "Medium";
    }
  });
}
