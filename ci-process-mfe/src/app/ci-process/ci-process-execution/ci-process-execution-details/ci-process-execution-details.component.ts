import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { concatMap, Subject, takeUntil, tap } from "rxjs";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionMapperService,
  BuildAndTestProcessStageStatus,
  BusinessProcessExecutionStatus,
  BusinessProcessFamilies,
  BuildAndTestProcessStage,
  BuildAndTestSourceType,
} from "@mxflow/features/business-process";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { BuildAndTestExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import { BuildAndTestProcessExecution as DomainBuildAndTestProcessExecution } from "@mxevolve/domains/business-process/util";
import {
  StepDefinition,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import { CiProcessExecutionAction } from "../state";
import { getCiProcessExecution } from "../state/ci-process-execution.selector";
import { CiProcessStageSelectorService } from "../service/ci-process-stage-selector.service";
import { CiProcessActions } from "../../state";
import { Stage } from "@mxflow/ui/horizontal-timeline";
import {
  ProjectIdRouteParamsResolverService,
  ProjectService,
} from "@mxflow/features/project";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "ci-process-execution-details",
  templateUrl: "ci-process-execution-details.component.html",
  standalone: false,
  providers: [ProjectService, DatePipe],
})
export class CiProcessExecutionDetailsComponent implements OnInit, OnDestroy {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  store = inject(Store);
  buildAndTestProcessExecutionMapperService = inject(
    BuildAndTestProcessExecutionMapperService
  );
  stageSelector = inject(CiProcessStageSelectorService);
  projectIdResolver = inject(ProjectIdRouteParamsResolverService);
  projectService = inject(ProjectService);
  title = inject(Title);
  domainExecutionFetcher = inject(BuildAndTestExecutionFetcherService);
  private readonly datePipe = inject(DatePipe);

  ciProcessId: string;
  projectId: string;
  projectName: string;
  ciProcessExecution: BuildAndTestProcessExecution;
  domainExecution?: DomainBuildAndTestProcessExecution;
  ciProcessStages: BuildAndTestProcessStage[] = [];
  errorMessage: string | undefined;
  status: BusinessProcessExecutionStatus;
  executionStages: Stage[] = [];
  genericSelectedStage: Stage;
  steps: StepDefinition[] = [];
  selectedStepId?: string;
  loading = false;
  notStarted = false;
  private readonly destroy$ = new Subject();

  /** Stepper titles per stage index (Figma 9615-68110). */
  private static readonly STEP_TITLES = [
    "Create Branch",
    "Prepare Setup",
    "Build & Test",
    "Merge",
  ];

  protected readonly window = window;

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.loading = true;
    this.activatedRoute.params
      .pipe(
        concatMap((params) => {
          this.ciProcessId = params["executionId"];
          return this.projectService.getProjectById(params["projectId"]);
        }),
        tap((project) => {
          this.projectName = project.name;
        }),
        concatMap(() => {
          this.store.dispatch(
            CiProcessExecutionAction.getCiProcessExecution({
              id: this.ciProcessId,
              projectId: this.projectId,
            })
          );
          return this.store.pipe(getCiProcessExecution);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (ciProcessExecution) => {
          if (ciProcessExecution.id === this.ciProcessId) {
            this.ciProcessExecution = ciProcessExecution;
            this.errorMessage = ciProcessExecution.errorMessage;
            this.status = ciProcessExecution.status;
            this.notStarted = this.resolveNotStarted();
            this.executionStages = this.getExecutionStages();
            this.steps = this.buildSteps();
            this.navigateToWantedStage(ciProcessExecution);
            this.title.setTitle(
              `BP Execution - ${this.ciProcessExecution.name} - ${this.projectName}`
            );
            this.fetchDomainExecution();
            this.loading = false;
          }
        },
        error: (error) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: error })
          );
          this.loading = false;
        },
      });
  }

  selectStage(stageName: string) {
    const stageToSelect = this.ciProcessStages.find(
      (stage) => stage.name === stageName
    );
    this.activateStage(stageToSelect);
  }

  /** Stepper click handler — steps are keyed by stage route. */
  onStepSelected(stepId: string | undefined) {
    if (!stepId) return;
    const stageToSelect = this.ciProcessStages.find(
      (stage) => stage.route === stepId
    );
    this.activateStage(stageToSelect);
  }

  private activateStage(stageToSelect?: BuildAndTestProcessStage) {
    if (
      stageToSelect &&
      stageToSelect.status !== BuildAndTestProcessStageStatus.NOT_STARTED
    ) {
      this.router.navigate([stageToSelect.route], {
        relativeTo: this.activatedRoute,
        replaceUrl: true,
      });
      this.genericSelectedStage =
        this.buildAndTestProcessExecutionMapperService.toStage(stageToSelect);
      this.selectedStepId = stageToSelect.route;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private fetchDomainExecution(): void {
    this.domainExecutionFetcher
      .fetchExecution(this.projectId, this.ciProcessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((execution) => {
        this.domainExecution = execution;
      });
  }

  private getExecutionStages(): Stage[] {
    this.ciProcessStages = [
      this.ciProcessExecution!.createBranchStage,
      this.ciProcessExecution!.prepareBuildStage,
      this.ciProcessExecution!.buildAndTestStage,
      this.ciProcessExecution!.integrateChangesStage,
    ];
    return this.buildAndTestProcessExecutionMapperService.toExecutionStages(
      this.ciProcessStages
    );
  }

  private buildSteps(): StepDefinition[] {
    const skipPrepareBuild =
      this.ciProcessExecution.input.buildEnvironment.skipEnvironmentDeployment;

    return this.ciProcessStages.map((stage, index) => {
      const skipped = index === 1 && skipPrepareBuild;
      const status: StepStatus = skipped
        ? "skipped"
        : this.mapStageStatusToStepStatus(stage.status);
      return {
        id: stage.route,
        title:
          CiProcessExecutionDetailsComponent.STEP_TITLES[index] ?? stage.name,
        status,
        tooltip: this.computeStepTooltip(stage, status),
      };
    });
  }

  private mapStageStatusToStepStatus(
    status: BuildAndTestProcessStageStatus
  ): StepStatus {
    switch (status) {
      case BuildAndTestProcessStageStatus.SKIPPED:
        return "skipped";
      case BuildAndTestProcessStageStatus.NOT_STARTED:
      case BuildAndTestProcessStageStatus.STOPPED:
      case BuildAndTestProcessStageStatus.NA:
        return "inactive";
      case BuildAndTestProcessStageStatus.RUNNING:
      case BuildAndTestProcessStageStatus.PENDING_INPUT:
        return "active";
      case BuildAndTestProcessStageStatus.PASSED:
        return "completed";
      case BuildAndTestProcessStageStatus.FAILED:
        return "failed";
      default:
        return "inactive";
    }
  }

  private computeStepTooltip(
    stage: BuildAndTestProcessStage,
    status: StepStatus
  ): string | undefined {
    if (status === "inactive") return undefined;

    const start = stage.startDate;
    if (!start) return undefined;

    const formattedStart = this.formatDate(start);
    if (
      stage.endDate &&
      (status === "completed" || status === "failed" || status === "skipped")
    ) {
      return `Start: ${formattedStart}\nEnd: ${this.formatDate(stage.endDate)}`;
    }
    return `Start: ${formattedStart}`;
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    return this.datePipe.transform(dateStr, "MMM d, y, hh:mm a") ?? dateStr;
  }

  private navigateToWantedStage(
    ciProcessExecution: BuildAndTestProcessExecution
  ) {
    const wantedStage = this.stageSelector.getWantedStage(
      ciProcessExecution,
      location.href
    );
    this.selectStage(wantedStage);
  }

  refetchExecution() {
    this.store.dispatch(
      CiProcessExecutionAction.getCiProcessExecution({
        id: this.ciProcessId,
        projectId: this.projectId,
      })
    );
  }
  protected readonly BusinessProcessExecutionStatus =
    BusinessProcessExecutionStatus;
  protected readonly BusinessProcessFamilies = BusinessProcessFamilies;

  private resolveNotStarted() {
    return (
      !this.ciProcessExecution.createBranchStage.startDate &&
      !this.ciProcessExecution.prepareBuildStage.startDate &&
      !this.ciProcessExecution.buildAndTestStage.startDate &&
      !this.ciProcessExecution.integrateChangesStage.startDate
    );
  }

  protected readonly BuildAndTestSourceType = BuildAndTestSourceType;
}
