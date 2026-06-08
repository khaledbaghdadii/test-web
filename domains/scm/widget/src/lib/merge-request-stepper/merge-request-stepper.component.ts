import { Component, computed, inject, input } from "@angular/core";
import { DatePipe } from "@angular/common";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  StepDefinition,
  StepperComponent,
  StepComponent,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import {
  ReviewStageDetailsComponent,
  ReviewStageData,
} from "../review-stage-details/review-stage-details.component";
import {
  UnderValidationStageDetailsComponent,
  UnderValidationStageData,
} from "../under-validation-stage-details/under-validation-stage-details.component";
import {
  MergeStageDetailsComponent,
  MergeStageData,
} from "../merge-stage-details/merge-stage-details.component";
import {
  MergeRequestService,
  MergeRequestState,
  MergeRequestStateTransition,
} from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ProgressSpinner } from "primeng/progressspinner";
import { catchError, of } from "rxjs";

export interface MergeStepStatuses {
  underReview: StepStatus;
  underValidation: StepStatus;
  merge: StepStatus;
}

@Component({
  selector: "mxevolve-merge-request-stepper",
  standalone: true,
  imports: [
    StepperComponent,
    StepComponent,
    ReviewStageDetailsComponent,
    UnderValidationStageDetailsComponent,
    MergeStageDetailsComponent,
    ProgressSpinner,
  ],
  providers: [MergeRequestService, DatePipe],
  templateUrl: "./merge-request-stepper.component.html",
  host: {
    class: "block h-full",
  },
})
export class MergeRequestStepperComponent {
  readonly statuses = input<MergeStepStatuses>();
  readonly mergeRequestId = input<string>();
  readonly projectId = input<string>();

  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly datePipe = inject(DatePipe);

  readonly mergeRequestResource = rxResource({
    params: () => {
      const id = this.mergeRequestId();
      const project = this.projectId();
      if (!id || !project) return undefined;
      return { mergeRequestId: id, projectId: project };
    },
    stream: ({ params }) =>
      this.mergeRequestService
        .getMergeRequestById(params.projectId, params.mergeRequestId)
        .pipe(
          catchError(() => {
            this.toastMessageService.showError(
              "Failed to load merge request details"
            );
            return of(undefined);
          })
        ),
  });

  readonly isLoading = computed(() => {
    if (this.statuses()) return false;
    const id = this.mergeRequestId();
    const project = this.projectId();
    if (!id || !project) return false;
    return this.mergeRequestResource.isLoading();
  });

  readonly reviewStageData = computed<ReviewStageData | undefined>(() => {
    const mr = this.mergeRequestResource.value();
    if (!mr) return undefined;
    return {
      mergeRequestId: mr.pullRequestId,
      mergeRequestState: mr.mergeRequestState,
      destinationBranch: mr.destinationBranch ?? "",
      pullRequestUrl: mr.pullRequestUrl ?? "",
      id: mr.id,
      projectId: mr.projectId,
      mergeRequestPriority: mr.mergeRequestPriority,
    } satisfies ReviewStageData;
  });

  readonly underValidationStageData = computed<
    UnderValidationStageData | undefined
  >(() => {
    const mr = this.mergeRequestResource.value();
    if (!mr) return undefined;
    return {
      mergeRequestState: mr.mergeRequestState,
      failureReason: mr.failureReason,
      queuePosition: mr.queuePosition,
      queuedDate: mr.queuedDate,
      isLastBuildInBulkMode: mr.isLastBuildInBulkMode,
      mergeRequestPriority: mr.mergeRequestPriority,
      developmentName: mr.development?.name ?? "",
      destinationBranch:
        mr.destinationBranch ?? mr.mergeConfiguration?.branchName ?? "",
      projectId: mr.projectId ?? this.projectId() ?? "",
      mergeRequestId: mr.id ?? "",
      repositoryId: mr.development?.repository?.id ?? "",
      sourceBranch: mr.development?.name ?? "",
      builds: mr.builds,
    } satisfies UnderValidationStageData;
  });

  readonly mergeStageData = computed<MergeStageData | undefined>(() => {
    const mr = this.mergeRequestResource.value();
    if (!mr) return undefined;
    return {
      mergeRequestState: mr.mergeRequestState,
      failureReason: mr.failureReason,
      developmentName: mr.development?.name ?? "",
      destinationBranch:
        mr.destinationBranch ?? mr.mergeConfiguration?.branchName ?? "",
      endDate: mr.endDate,
    } satisfies MergeStageData;
  });

  private readonly resolvedStatuses = computed<MergeStepStatuses | undefined>(
    () => {
      const provided = this.statuses();
      if (provided) return provided;
      const mr = this.mergeRequestResource.value();
      if (!mr) return undefined;
      return this.computeStepStatuses(mr.mergeRequestState);
    }
  );

  readonly steps = computed<StepDefinition[]>(() => {
    const s = this.resolvedStatuses();
    const mr = this.mergeRequestResource.value();
    const transitions = mr?.stateTransitions;
    const createdOn = mr?.createdOn;
    const endDate = mr?.endDate;

    const reviewStates = [
      MergeRequestState.IN_REVIEW,
      MergeRequestState.IN_REVIEW_NOT_MERGEABLE,
      MergeRequestState.REVIEW_FAILED,
      MergeRequestState.DECLINED,
      MergeRequestState.DELETED,
    ];
    const validationStates = [
      MergeRequestState.QUEUED,
      MergeRequestState.UNDER_VALIDATION,
      MergeRequestState.UNDER_VALIDATION_FAILED,
    ];
    const mergeStates = [
      MergeRequestState.MERGED,
      MergeRequestState.MERGE_FAILED,
    ];

    return [
      {
        id: "under-review",
        title: "Under Review",
        status: s?.underReview ?? "inactive",
        tooltip: this.computeStepTooltip(
          transitions,
          reviewStates,
          s?.underReview ?? "inactive",
          createdOn,
          endDate
        ),
      },
      {
        id: "under-validation",
        title: "Under Validation",
        status: s?.underValidation ?? "inactive",
        tooltip: this.computeStepTooltip(
          transitions,
          validationStates,
          s?.underValidation ?? "inactive",
          undefined,
          endDate
        ),
      },
      {
        id: "merge",
        title: "Merge",
        status: s?.merge ?? "inactive",
        tooltip: this.computeStepTooltip(
          transitions,
          mergeStates,
          s?.merge ?? "inactive",
          undefined,
          endDate
        ),
      },
    ];
  });

  private computeStepTooltip(
    transitions: MergeRequestStateTransition[] | undefined,
    stepStates: MergeRequestState[],
    status: StepStatus,
    createdOn?: string,
    endDate?: string
  ): string | undefined {
    if (status === "inactive") return undefined;

    let startDate: string | undefined;
    let entryIndex = -1;

    if (transitions?.length) {
      entryIndex = this.findLastIndex(
        transitions,
        (t) =>
          stepStates.includes(t.mergeRequestCurrentState) &&
          !stepStates.includes(t.mergeRequestPreviousState)
      );

      if (entryIndex >= 0) {
        startDate = transitions[entryIndex].transitionedOn;
      }
    }

    if (!startDate && createdOn) {
      startDate = createdOn;
    }

    if (!startDate) return undefined;

    const formattedStart = this.formatDate(startDate);

    const searchFrom = entryIndex >= 0 ? entryIndex + 1 : 0;
    const exitTransition = transitions
      ?.slice(searchFrom)
      .find(
        (t) =>
          stepStates.includes(t.mergeRequestPreviousState) &&
          !stepStates.includes(t.mergeRequestCurrentState)
      );

    if (exitTransition) {
      return `Start: ${formattedStart}\nEnd: ${this.formatDate(
        exitTransition.transitionedOn
      )}`;
    }

    if (endDate && (status === "completed" || status === "failed")) {
      return `Start: ${formattedStart}\nEnd: ${this.formatDate(endDate)}`;
    }

    return `Start: ${formattedStart}`;
  }

  private findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i])) return i;
    }
    return -1;
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    return this.datePipe.transform(dateStr, "MMM d, y, hh:mm a") ?? dateStr;
  }

  private computeStepStatuses(state: MergeRequestState): MergeStepStatuses {
    const reviewRunningStates: MergeRequestState[] = [
      MergeRequestState.IN_REVIEW,
      MergeRequestState.IN_REVIEW_NOT_MERGEABLE,
    ];
    const reviewFailedStates: MergeRequestState[] = [
      MergeRequestState.REVIEW_FAILED,
      MergeRequestState.DECLINED,
      MergeRequestState.DELETED,
    ];
    const validationRunningStates: MergeRequestState[] = [
      MergeRequestState.QUEUED,
      MergeRequestState.UNDER_VALIDATION,
    ];

    if (reviewRunningStates.includes(state)) {
      return {
        underReview: "active",
        underValidation: "inactive",
        merge: "inactive",
      };
    } else if (reviewFailedStates.includes(state)) {
      return {
        underReview: "failed",
        underValidation: "inactive",
        merge: "inactive",
      };
    } else if (validationRunningStates.includes(state)) {
      return {
        underReview: "completed",
        underValidation: "active",
        merge: "inactive",
      };
    } else if (state === MergeRequestState.UNDER_VALIDATION_FAILED) {
      return {
        underReview: "completed",
        underValidation: "failed",
        merge: "inactive",
      };
    } else if (state === MergeRequestState.MERGED) {
      return {
        underReview: "completed",
        underValidation: "completed",
        merge: "completed",
      };
    } else if (state === MergeRequestState.MERGE_FAILED) {
      return {
        underReview: "completed",
        underValidation: "completed",
        merge: "failed",
      };
    }
    return {
      underReview: "active",
      underValidation: "inactive",
      merge: "inactive",
    };
  }
}
