import { Component, computed, inject, input, signal } from "@angular/core";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  ValidationProcessExecution,
  ValidationProcessIntegrateFixesStage,
  ValidationProcessStageStatus,
} from "@mxevolve/domains/business-process/data-access";
import {
  ValidationFixIssuesComponent,
  ValidationRetryMergeRequestComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { FinalProductFailure } from "@mxevolve/domains/business-process/util";
import { Message } from "primeng/message";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-validation-process-integrate-fixes-stage",
  templateUrl: "./integrate-fixes-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
    MergeRequestStepperComponent,
    ValidationRetryMergeRequestComponent,
    ValidationFixIssuesComponent,
    Message,
  ],
})
export class ValidationProcessIntegrateFixesStageComponent {
  /** Full execution provides integrateFixesStage + createBranchStage.developmentId + input (BC 2.2) */
  readonly execution = input.required<ValidationProcessExecution>();

  private readonly toastMessageService = inject(ToastMessageService);

  readonly stage = computed<ValidationProcessIntegrateFixesStage>(
    () => this.execution().integrateFixesStage
  );

  readonly isStageStoppedOrSkipped = computed(
    () =>
      this.stage().status === ValidationProcessStageStatus.STOPPED ||
      this.stage().status === ValidationProcessStageStatus.SKIPPED
  );

  readonly isReOpenable = signal(false);

  readonly finalProductPublishingFailed = computed(
    () =>
      this.stage().finalProductPublishing.finalProductFailure ===
      FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED
  );

  readonly shouldShowFinalProduct = computed(
    () =>
      !!this.stage().finalProductPublishing.id ||
      !!this.stage().finalProductPublishing.publishingStartDate ||
      this.finalProductPublishingFailed()
  );

  failedToFetchFinalProduct(errorMessage: string): void {
    this.toastMessageService.showError(errorMessage);
  }
}
