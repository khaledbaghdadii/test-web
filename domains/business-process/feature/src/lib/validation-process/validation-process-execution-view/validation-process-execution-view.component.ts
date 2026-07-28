import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { ValidationProcessExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import {
  ValidationProcessExecutionFetcherService,
  ValidationProcessExecutionMapperService,
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import { ValidationProcessExecuteQualityGatesStageComponent } from "../execute-quality-gates-stage/execute-quality-gates-stage.component";
import { ValidationProcessTagArchivalStageComponent } from "../tag-archival-stage/tag-archival-stage.component";
import { ValidationProcessIntegrateFixesStageComponent } from "../integrate-fixes-stage/integrate-fixes-stage.component";

@Component({
  selector: "mxevolve-validation-process-execution-view",
  templateUrl: "./validation-process-execution-view.component.html",
  providers: [
    ValidationProcessExecutionFetcherService,
    ValidationProcessExecutionMapperService,
    ValidationProcessStateUpdaterService,
    DatePipe,
  ],
  imports: [
    ValidationProcessExecutionRunHeaderComponent,
    MxevolveIllustrationComponent,
    StepperComponent,
    StepComponent,
    ValidationProcessExecuteQualityGatesStageComponent,
    ValidationProcessTagArchivalStageComponent,
    ValidationProcessIntegrateFixesStageComponent,
    ExecutionAlertDisplayComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class ValidationProcessExecutionViewComponent {
  readonly projectId = input.required<string>();
  readonly executionId = input.required<string>();

  private readonly executionFetcher = inject(
    ValidationProcessExecutionFetcherService
  );
  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly datePipe = inject(DatePipe);

  constructor() {
    // Finding 3: soft-reload in-place when a state-changing action completes
    this.stateUpdater.reloadTrigger$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.executionDetails.reload());
  }

  // BC 1.4: initialize from ?step= URL query param
  readonly selectedStepId = signal<string | undefined>(
    this.route.snapshot.queryParams["step"]
  );

  // Sync selectedStepId → ?step= query param (BC 1.4 / upgrade mirror)
  private readonly syncStepToUrl = effect(() => {
    const stepId = this.selectedStepId();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: stepId ?? null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });

  // BC 1.4: default step selection — port of MasterValidationExecutionStageSelectorService logic:
  // URL stage (handled above via selectedStepId init) → first FAILED/RUNNING/STOPPED/PENDING_INPUT → first stage.
  // MV legacy: first FAILED/RUNNING/STOPPED/PENDING_INPUT, else first stage.
  private readonly setDefaultStep = effect(() => {
    const steps = this.steps();
    if (steps.length === 0 || this.selectedStepId() !== undefined) return;

    // Use raw stage statuses so STOPPED (which maps to 'inactive' visually) is still targeted.
    const execution = this.executionDetails.value();
    if (!execution) return;

    const stageIds: Array<{
      id: string;
      status: ValidationProcessStageStatus;
    }> = [
      {
        id: "run-quality-gate",
        status: execution.executeQualityGatesStage.status,
      },
      { id: "tag", status: execution.tagArchivalBranchStage.status },
      { id: "merge", status: execution.integrateFixesStage.status },
    ];

    const targetStage = stageIds.find(
      ({ status }) =>
        status === ValidationProcessStageStatus.FAILED ||
        status === ValidationProcessStageStatus.RUNNING ||
        status === ValidationProcessStageStatus.STOPPED ||
        status === ValidationProcessStageStatus.PENDING_INPUT
    );

    if (targetStage) {
      this.selectedStepId.set(targetStage.id);
      return;
    }

    // Fallback: first stage (execute-quality-gates)
    this.selectedStepId.set(steps[0].id);
  });

  readonly executionDetails = rxResource({
    params: () => ({
      projectId: this.projectId(),
      executionId: this.executionId(),
    }),
    stream: ({ params }) =>
      this.executionFetcher.fetchExecution(
        params.projectId,
        params.executionId
      ),
  });

  // BC 4.8: loading state
  readonly loading = computed(() => this.executionDetails.isLoading());

  // BC 4.5: executionReadyForDisplay — createBranchStage status ≠ NOT_STARTED
  readonly executionReadyForDisplay = computed(
    () =>
      this.executionDetails.hasValue() &&
      this.executionDetails.value().createBranchStage.status !==
        ValidationProcessStageStatus.NOT_STARTED
  );

  // BC 4.4/4.5: failedInBranchCreation — createBranchStage status === FAILED
  readonly failedInBranchCreation = computed(
    () =>
      this.executionDetails.hasValue() &&
      this.executionDetails.value().createBranchStage.status ===
        ValidationProcessStageStatus.FAILED
  );

  // BC 1.5: page title effect
  private readonly updatePageTitle = effect(() => {
    if (!this.executionDetails.hasValue()) return;
    const execution = this.executionDetails.value();
    this.titleService.setTitle(
      `BP Execution - ${execution.name} - ${execution.projectName}`
    );
  });

  // DC-3: MV stage order: execute-quality-gates → tag-archival → integrate-fixes
  // Branch creation is surfaced in the run header (Branch Details tab), not as a stepper stage.
  readonly steps = computed(() => {
    if (!this.executionDetails.hasValue()) return [];

    const execution = this.executionDetails.value();
    return [
      {
        id: "run-quality-gate",
        title: "Run Quality Gate",
        status: this.mapStageStatusToStepStatus(
          execution.executeQualityGatesStage.status
        ),
        tooltip: this.buildStageTooltip(
          execution.executeQualityGatesStage.startDate,
          execution.executeQualityGatesStage.endDate
        ),
      },
      {
        id: "tag",
        title: "Tag",
        status: this.mapStageStatusToStepStatus(
          execution.tagArchivalBranchStage.status
        ),
        tooltip: this.buildStageTooltip(
          execution.tagArchivalBranchStage.startDate,
          execution.tagArchivalBranchStage.endDate
        ),
      },
      {
        id: "merge",
        title: "Merge",
        status: this.mapStageStatusToStepStatus(
          execution.integrateFixesStage.status
        ),
        tooltip: this.buildStageTooltip(
          execution.integrateFixesStage.startDate,
          execution.integrateFixesStage.endDate
        ),
      },
    ] as StepDefinition[];
  });

  private buildStageTooltip(startDate: string, endDate: string): string {
    const start = startDate
      ? this.datePipe.transform(startDate, "medium") ?? "-"
      : "-";
    const end = endDate
      ? this.datePipe.transform(endDate, "medium") ?? "-"
      : "-";
    return `Start: ${start} | End: ${end}`;
  }

  private mapStageStatusToStepStatus(
    status: ValidationProcessStageStatus
  ): StepStatus {
    switch (status) {
      case ValidationProcessStageStatus.SKIPPED:
        return "skipped";
      case ValidationProcessStageStatus.NOT_STARTED:
      case ValidationProcessStageStatus.STOPPED:
      case ValidationProcessStageStatus.NA:
        return "inactive";
      case ValidationProcessStageStatus.RUNNING:
      case ValidationProcessStageStatus.PENDING_INPUT:
        return "active";
      case ValidationProcessStageStatus.PASSED:
        return "completed";
      case ValidationProcessStageStatus.FAILED:
        return "failed";
      default:
        return "inactive";
    }
  }

  protected readonly ExecutionStatus = ExecutionStatus;
}
