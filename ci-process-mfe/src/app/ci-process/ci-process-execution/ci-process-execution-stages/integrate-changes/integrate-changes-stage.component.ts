import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { concatMap, map, Subject, takeUntil } from "rxjs";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionInput,
  BuildAndTestProcessIntegrateChangesStage,
  BuildAndTestProcessStageStatus,
  BusinessProcessExecutionStatus,
  FinalProductPublishing,
} from "@mxflow/features/business-process";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";
import {
  MergeConfigurationPage,
  MergeConfigurationService,
  MergeRequest,
  MergeRequestService,
} from "@mxflow/features/scm-management";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Component({
  selector: "mxflow-integrate-fixes-stage",
  templateUrl: "integrate-changes-stage.component.html",
  standalone: false,
})
export class IntegrateChangesStageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  ciProcessExecutionId: string;
  integrateChangesStage: BuildAndTestProcessIntegrateChangesStage;
  inputs: BuildAndTestProcessExecutionInput;
  errorMessage?: string;
  projectId = "";
  showDecision = false;
  actionRequester: string;
  areActionsDisabled = true;
  mergeJobId: string;
  mergeRequest: MergeRequest | undefined = undefined;
  integrateDestinationBranch: string;
  backportStarted: boolean = false;
  finalProductPublishing: FinalProductPublishing;
  backportDecisionMaker?: string;
  repositoryId: string;
  developmentId: string;
  ciProcessStatus: BusinessProcessExecutionStatus;
  ciVersion = 2;
  backportDestinationBranches: string[] = [];

  private readonly store = inject(Store);
  private readonly ciProcessService = inject(CiProcessExecutionService);
  private readonly processExecutionUpdater = inject(
    CiProcessExecutionStateUpdaterService
  );
  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );
  private readonly mergeConfigurationService = inject(
    MergeConfigurationService
  );

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.store
      .pipe(getCiProcessExecution)
      .pipe(
        concatMap((process: BuildAndTestProcessExecution) => {
          this.ciVersion = process.ciVersion;
          this.backportStarted =
            process.integrateChangesStage.backports.length > 0;
          this.ciProcessStatus = process.status;
          this.areActionsDisabled = this.areActionDisabled(process);
          this.showDecision =
            this.isStageStopped(process.integrateChangesStage) &&
            !this.backportStarted;
          this.backportDecisionMaker =
            process.integrateChangesStage.backportStopRequester;
          this.actionRequester = this.getActionRequester(
            process.integrateChangesStage
          );
          this.integrateChangesStage = process.integrateChangesStage;
          this.ciProcessExecutionId = process.id;
          this.errorMessage = process.integrateChangesStage.errorMessage;
          this.mergeJobId = process.integrateChangesStage.latestMergeJobId;
          this.inputs = process.input;
          this.finalProductPublishing =
            process.integrateChangesStage.finalProductPublishing;
          this.repositoryId = process.input.repositoryId;
          this.developmentId = process.createBranchStage.developmentId;
          this.getBackportDestinationBranches(process);
          return this.mergeRequestService.getMergeRequest(
            this.projectId,
            this.mergeJobId
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (mergeRequest) => {
          this.mergeRequest = mergeRequest;
          this.integrateDestinationBranch =
            mergeRequest.mergeConfiguration.branchName;
        },
        error: (error) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: error })
          );
        },
      });
  }

  private getBackportDestinationBranches(
    process: BuildAndTestProcessExecution
  ) {
    process.integrateChangesStage.backportMergeConfigurationIds?.forEach(
      (backportMergeConfigurationId) => {
        this.mergeConfigurationService
          .getFilteredMergeConfigurations(this.projectId, {
            searchKey: backportMergeConfigurationId,
          })
          .pipe(
            map((r: MergeConfigurationPage) =>
              this.backportDestinationBranches.push(r.content[0]?.branchName)
            )
          )
          .subscribe();
      }
    );
  }

  private areActionDisabled(process: BuildAndTestProcessExecution) {
    return (
      !this.isStagePendingInput(process.integrateChangesStage) ||
      this.backportStarted
    );
  }

  fixIssues() {
    this.ciProcessService
      .fixIntegrationIssues(this.projectId, this.ciProcessExecutionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updateState();
        },
        error: (errorMessage) =>
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: errorMessage })
          ),
      });
  }

  isStagePendingInput(
    integrateChangesStage: BuildAndTestProcessIntegrateChangesStage
  ): boolean {
    return (
      integrateChangesStage.status ===
      BuildAndTestProcessStageStatus.PENDING_INPUT
    );
  }

  isStageStopped(
    integrateChangesStage: BuildAndTestProcessIntegrateChangesStage
  ): boolean {
    return (
      integrateChangesStage.status == BuildAndTestProcessStageStatus.STOPPED
    );
  }

  getActionRequester(
    integrateChangesStage: BuildAndTestProcessIntegrateChangesStage
  ): string {
    return integrateChangesStage.requester;
  }

  private updateState() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId,
      1000
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
