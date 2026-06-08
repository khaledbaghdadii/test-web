import { Component, inject, Input, OnInit } from "@angular/core";
import { ToastMessageService, WarningAlertModule } from "@mxflow/ui/alert";
import { Button } from "primeng/button";
import { ScmService } from "@mxflow/features/scm";
import { CommitsCherryPickedRequest } from "../../../../../service/model/commits-cherry-picked-request";
import { Confirmation, ConfirmationService } from "primeng/api";
import { CiProcessExecutionService } from "../../../../../service/ci-process-execution.service";
import { Backport } from "@mxflow/features/business-process";
import { CiProcessExecutionStateUpdaterService } from "../../../../../ci-process-execution-details/ci-process-state-updater.service";

@Component({
  selector: "mxevolve-backport-manual-cherry-pick",
  imports: [WarningAlertModule, Button],
  templateUrl: "backport-manual-cherry-pick.component.html",
})
export class BackportManualCherryPickComponent implements OnInit {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryId: string;
  @Input({ required: true }) ciProcessExecutionId: string;
  @Input({ required: true }) backport: Backport;

  scmService: ScmService = inject(ScmService);
  messageService = inject(ToastMessageService);
  confirmationService = inject(ConfirmationService);
  ciProcessExecutionService = inject(CiProcessExecutionService);
  processExecutionUpdater = inject(CiProcessExecutionStateUpdaterService);

  cherryPickDoneDisabled = true;

  ngOnInit(): void {
    this.scmService
      .getCommitDifferences(this.getCommitDifferenceRequest())
      .subscribe({
        next: (commitDetails) => {
          this.cherryPickDoneDisabled = commitDetails.length === 0;
        },
        error: (error) => {
          this.messageService.showError(error);
        },
      });
  }

  confirmCommitsCherryPicked(event: Event) {
    this.confirmationService.confirm({
      target: event.target ? event.target : undefined,
      message: "Are you sure you want to proceed?",
      icon: "pi pi-exclamation-triangle",
      accept: () => this.commitsCherryPicked(),
    } as Confirmation);
  }

  commitsCherryPicked() {
    this.ciProcessExecutionService
      .commitsCherryPicked(this.getCommitsCherryPickedRequest())
      .subscribe({
        next: () => this.updateState(),
        error: (error: string) => this.messageService.showError(error),
      });
  }

  private updateState() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId,
      1000
    );
  }

  private getCommitDifferenceRequest() {
    return {
      projectId: this.projectId,
      repositoryId: this.repositoryId,
      sourceBranch:
        this.backport.initializeDevelopmentState.cherryPickBranchName,
      destinationBranch:
        this.backport.initializeDevelopmentState.destinationBranchName,
    };
  }

  private getCommitsCherryPickedRequest() {
    return {
      projectId: this.projectId,
      processExecutionId: this.ciProcessExecutionId,
      mergeConfigurationId: this.backport.mergeConfigurationId,
    } as CommitsCherryPickedRequest;
  }
}
