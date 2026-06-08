import { Component, Input } from "@angular/core";
import { CiProcessExecutionService } from "../../../../service/ci-process-execution.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { RepushBackportMergeRequest } from "../../../../service/model/repush-backport-merge-request";
import { CardContainerModule } from "@mxflow/ui/container";
import { Button } from "primeng/button";
import { BusinessProcessExecutionStatus } from "@mxflow/features/business-process";

@Component({
  selector: "mxevolve-backport-actions-component",
  templateUrl: "backport-actions.component.html",
  imports: [CardContainerModule, Button],
})
export class BackportActionsComponent {
  @Input() projectId: string;
  @Input() ciProcessExecutionId: string;
  @Input() mergeConfigurationId: string;
  @Input() canRepushBackport: boolean;
  @Input() ciProcessStatus: BusinessProcessExecutionStatus;

  constructor(
    private readonly ciProcessExecutionService: CiProcessExecutionService,
    private readonly messageService: ToastMessageService,
    private readonly processExecutionUpdater: CiProcessExecutionStateUpdaterService
  ) {}

  repushBackportMergeRequest() {
    this.ciProcessExecutionService
      .repushBackportMergeRequest(this.getRepushBackportMergeRequest())
      .subscribe({
        next: () => this.updateState(),
        error: (error) => this.messageService.showError(error),
      });
  }

  private updateState() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId,
      1000
    );
  }

  private getRepushBackportMergeRequest() {
    return {
      projectId: this.projectId,
      processExecutionId: this.ciProcessExecutionId,
      mergeConfigurationId: this.mergeConfigurationId,
    } as RepushBackportMergeRequest;
  }

  protected readonly BusinessProcessExecutionStatus =
    BusinessProcessExecutionStatus;
}
