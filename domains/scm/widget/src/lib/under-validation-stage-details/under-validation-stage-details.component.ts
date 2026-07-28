import { Component, computed, input, output } from "@angular/core";
import { Message } from "primeng/message";
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
    Message,
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

  /** Emitted after the merge priority is updated so the parent can refresh. */
  readonly priorityUpdated = output<void>();

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

  private readonly sortedScenarioBuilds = computed(() =>
    [...(this.data().builds ?? [])]
      .filter((b) => b.scenarioExecutionId)
      .sort(
        (a, b) =>
          new Date(a.createdOn ?? 0).getTime() -
          new Date(b.createdOn ?? 0).getTime()
      )
  );

  readonly sequentialScenarioRunIds = computed(() =>
    this.sortedScenarioBuilds()
      .filter((b) => !b.bulkMode)
      .map((b) => b.scenarioExecutionId!)
  );

  readonly bulkScenarioRunIds = computed(() =>
    this.sortedScenarioBuilds()
      .filter((b) => b.bulkMode)
      .map((b) => b.scenarioExecutionId!)
  );

  readonly hasScenarioRuns = computed(
    () =>
      this.sequentialScenarioRunIds().length > 0 ||
      this.bulkScenarioRunIds().length > 0
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

  readonly validationFailureReasonMessage = computed(() => {
    const reason = this.data().failureReason as FailureReason | undefined;
    if (!reason) return "-";
    switch (reason) {
      case FailureReason.PR_UNAPPROVED:
        return "Validation failed due to unapproved merge request";
      case FailureReason.PR_DECLINED:
        return "Validation failed due to declined merge request";
      case FailureReason.PR_DELETED:
      case FailureReason.MERGE_REQUEST_NOT_FOUND:
        return "Validation failed due to deleted merge request";
      case FailureReason.TECHNICAL_FAILURE:
        return "Validation failed due to a technical failure";
      case FailureReason.CQG_FAILURE:
        return "Validation failed due to a CQG failure";
      case FailureReason.PR_NOT_MERGEABLE:
        return "Validation failed due to unmergeable merge request";
      case FailureReason.SCENARIO_EXECUTION_TIMEOUT:
        return "Validation failed due to scenario execution timeout";
      default:
        return reason;
    }
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
