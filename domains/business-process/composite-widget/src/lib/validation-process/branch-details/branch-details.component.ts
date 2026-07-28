import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { Message } from "primeng/message";
import {
  ValidationProcessExecution,
  ValidationProcessStageStatus,
} from "@mxevolve/domains/business-process/data-access";
import {
  BranchDetailsFacadeService,
  DevelopmentDetailsComponent,
} from "@mxevolve/domains/scm/composite-widget";
import {
  CommitsService,
  Development,
  DevelopmentService,
  MergeRequestOverview,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-validation-process-branch-details",
  standalone: true,
  imports: [Message, DevelopmentDetailsComponent, MxevolveIconComponent],
  providers: [
    DevelopmentService,
    BranchDetailsFacadeService,
    CommitsService,
    MergeRequestService,
  ],
  templateUrl: "./branch-details.component.html",
  host: { style: "display: contents;" },
})
export class ValidationProcessBranchDetailsComponent {
  readonly execution = input.required<ValidationProcessExecution>();

  private readonly developmentService = inject(DevelopmentService);
  private readonly branchDetailsFacade = inject(BranchDetailsFacadeService);

  readonly failureDetailsVisible = signal(false);

  readonly branchCreationDetails = computed(() => {
    const stage = this.execution().createBranchStage;
    if (stage.status === ValidationProcessStageStatus.FAILED) {
      return { failed: true as const, failureReason: stage.errorMessage };
    }
    if (stage.status === ValidationProcessStageStatus.PASSED) {
      return { failed: false as const, developmentId: stage.developmentId };
    }
    return undefined;
  });

  private readonly developmentResource = rxResource({
    params: () => {
      const details = this.branchCreationDetails();
      if (!details?.developmentId || details.failed) return undefined;
      return {
        projectId: this.execution().projectId,
        developmentId: details.developmentId,
      };
    },
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId,
        true
      ),
  });

  readonly development = computed<Development | undefined>(() =>
    this.developmentResource.hasValue()
      ? this.developmentResource.value()
      : undefined
  );

  private readonly mergeRequestResource = rxResource({
    params: () => {
      const details = this.branchCreationDetails();
      if (!details?.developmentId || details.failed) return undefined;
      return {
        projectId: this.execution().projectId,
        developmentId: details.developmentId,
        processId: this.execution().id,
      };
    },
    stream: ({ params }) =>
      this.branchDetailsFacade.getLatestMergeRequest(
        params.projectId,
        params.developmentId,
        params.processId
      ),
  });

  readonly latestMergeRequest = computed<MergeRequestOverview | undefined>(() =>
    this.mergeRequestResource.value()
  );

  toggleFailureDetails(): void {
    this.failureDetailsVisible.update((visible) => !visible);
  }
}
