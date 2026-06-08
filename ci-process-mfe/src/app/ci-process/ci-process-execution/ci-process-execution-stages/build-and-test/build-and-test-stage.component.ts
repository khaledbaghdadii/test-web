import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import {
  BuildAndTestProcessBuildAndTestStage,
  BuildAndTestProcessPrepareBuildStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";
import {
  MergeRequest,
  MergeRequestService,
} from "@mxflow/features/scm-management";

@Component({
  selector: "mxflow-build-and-test-stage",
  templateUrl: "build-and-test-stage.component.html",
  standalone: false,
})
export class BuildAndTestStageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private readonly store = inject(Store);
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );
  private readonly ciProcessStateUpdater: CiProcessExecutionStateUpdaterService =
    inject(CiProcessExecutionStateUpdaterService);
  private readonly mergeRequestService = inject(MergeRequestService);

  ciProcessExecutionId: string;
  buildAndTestStage: BuildAndTestProcessBuildAndTestStage;
  configurationBranchName: string;
  errorMessage?: string;
  showEnvironmentDetails: boolean;
  showTechnicalReseedDetails: boolean;
  technicalReseedExecutionGroupId: string;
  infraGroup: string;
  projectId: string;
  prepareBuildStage: BuildAndTestProcessPrepareBuildStage;
  developmentId: string;
  isUserInterventionDisabled = false;
  readyForBuildAndTest: boolean = false;
  definitionId: string;
  mergeRequestDetails: MergeRequest | null | undefined = undefined;

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.store
      .pipe(getCiProcessExecution)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (process) => {
          this.developmentId = process.createBranchStage.developmentId;
          this.prepareBuildStage = process.prepareBuildStage;
          this.buildAndTestStage = process.buildAndTestStage;
          this.ciProcessExecutionId = process.id;
          this.errorMessage = process.buildAndTestStage.errorMessage;
          this.configurationBranchName = process.input.configurationBranchName;
          this.showEnvironmentDetails =
            !process.input.buildEnvironment.skipEnvironmentDeployment;
          this.technicalReseedExecutionGroupId =
            process.buildAndTestStage.technicalReseedExecutionGroupId ?? "";
          this.showTechnicalReseedDetails =
            !!this.technicalReseedExecutionGroupId;
          this.infraGroup = process.input.buildAndTestInfraGroup;
          this.isUserInterventionDisabled =
            process.buildAndTestStage.status !==
              BuildAndTestProcessStageStatus.PENDING_INPUT &&
            process.buildAndTestStage.status !==
              BuildAndTestProcessStageStatus.RUNNING;
          this.readyForBuildAndTest =
            process.buildAndTestStage.readyForBuildAndTest;
          this.definitionId = process.definitionId;
          const latestMergeJobId =
            process.integrateChangesStage?.latestMergeJobId;
          if (latestMergeJobId) {
            this.fetchMergeRequestDetails(this.projectId, latestMergeJobId);
          } else {
            this.mergeRequestDetails = null;
          }
        },
        error: (error) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: error })
          );
        },
      });
  }

  refreshPage() {
    this.ciProcessStateUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId
    );
  }

  private fetchMergeRequestDetails(
    projectId: string,
    mergeJobId: string
  ): void {
    this.mergeRequestService
      .getMergeRequest(projectId, mergeJobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mergeRequest) => {
          this.mergeRequestDetails = mergeRequest;
        },
        error: () => {
          this.mergeRequestDetails = null;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
