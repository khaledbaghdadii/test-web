import { DatePipe } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { BuildAndTestExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { BuildAndTestExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import { BuildAndTestMergeStageComponent } from "../merge-stage/build-and-test-merge-stage.component";
import { BuildAndTestStepComponent } from "../build-and-test-step/build-and-test-step.component";
import { PrepareBuildStageComponent } from "../prepare-build-stage/prepare-build-stage.component";
import {
  ExecutionStatus,
  StageStatus,
  type BuildAndTestProcessStage,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";

@Component({
  selector: "mxevolve-build-and-test-execution-view",
  templateUrl: "./build-and-test-execution-view.component.html",
  providers: [BuildAndTestExecutionFetcherService, DatePipe],
  imports: [
    BuildAndTestExecutionRunHeaderComponent,
    MxevolveIllustrationComponent,
    StepperComponent,
    StepComponent,
    ExecutionAlertDisplayComponent,
    BuildAndTestMergeStageComponent,
    BuildAndTestStepComponent,
    PrepareBuildStageComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestExecutionViewComponent {
  readonly projectId = input.required<string>();
  readonly executionId = input.required<string>();

  private readonly executionFetcher = inject(BuildAndTestExecutionFetcherService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = inject(DatePipe);

  readonly selectedStepId = signal<string | undefined>(
    this.route.snapshot.queryParams["step"]
  );

  private readonly syncStepToUrl = effect(() => {
    const stepId = this.selectedStepId();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: stepId ?? null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  });

  private readonly setDefaultStep = effect(() => {
    const steps = this.steps();
    if (steps.length === 0 || this.selectedStepId() !== undefined) return;
    const activeStep = steps.find((s) => s.status === "active");
    if (activeStep) {
      this.selectedStepId.set(activeStep.id);
      return;
    }
    const fallbackSteps = steps.filter(
      (s) =>
        s.status === "completed" ||
        s.status === "failed" ||
        s.status === "skipped"
    );
    if (fallbackSteps.length > 0) {
      this.selectedStepId.set(fallbackSteps[fallbackSteps.length - 1].id);
    }
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

  readonly loading = computed(() => this.executionDetails.isLoading());

  readonly executionReadyForDisplay = computed(
    () =>
      this.executionDetails.hasValue() &&
      this.executionDetails.value().createBranchStage.status !==
        StageStatus.NOT_STARTED
  );

  readonly failedInBranchCreation = computed(
    () =>
      this.executionDetails.hasValue() &&
      this.executionDetails.value().createBranchStage.status ===
        StageStatus.FAILED
  );

  readonly steps = computed(() => {
    if (!this.executionDetails.hasValue()) return [];

    const execution = this.executionDetails.value();
    const skipPrepareBuild =
      execution.input.buildEnvironment.skipEnvironmentDeployment;

    return [
      this.toStep("create-branch", "Create Branch", execution.createBranchStage),
      this.toStep(
        "prepare-build",
        "Prepare Setup",
        execution.prepareBuildStage,
        skipPrepareBuild
      ),
      this.toStep(
        "build-and-test",
        "Build & Test",
        execution.buildAndTestStage
      ),
      this.toStep("merge", "Merge", execution.integrateChangesStage),
    ] as StepDefinition[];
  });

  private toStep(
    id: string,
    title: string,
    stage: BuildAndTestProcessStage,
    skipped = false
  ): StepDefinition {
    const status = skipped
      ? "skipped"
      : this.mapStageStatusToStepStatus(stage.status);
    return {
      id,
      title,
      status,
      tooltip: this.computeStepTooltip(stage, status),
    };
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

  protected mapStageStatusToStepStatus(status: StageStatus): StepStatus {
    switch (status) {
      case StageStatus.SKIPPED:
        return "skipped";
      case StageStatus.NOT_STARTED:
      case StageStatus.STOPPED:
      case StageStatus.NA:
        return "inactive";
      case StageStatus.RUNNING:
      case StageStatus.PENDING_INPUT:
        return "active";
      case StageStatus.PASSED:
        return "completed";
      case StageStatus.FAILED:
        return "failed";
      default:
        return "inactive";
    }
  }

  protected readonly ExecutionStatus = ExecutionStatus;
}
