import { AsyncPipe, DatePipe } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  BusinessProcessNamePipe,
  BusinessProcessUriFactoryPipeModule,
} from "@mxflow/features/business-process";
import { MessageModule } from "primeng/message";
import { BuildAndTestExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { BuildAndTestExecutionsService } from "@mxevolve/domains/business-process/data-access";
import { BuildAndTestMergeStageComponent } from "../merge-stage/build-and-test-merge-stage.component";
import { BuildAndTestStepComponent } from "../build-and-test-step/build-and-test-step.component";
import { PrepareBuildStageComponent } from "../prepare-build-stage/prepare-build-stage.component";
import {
  BuildAndTestSourceType,
  ExecutionStatus,
  type Stage,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";
import { Skeleton } from "primeng/skeleton";

@Component({
  selector: "mxevolve-build-and-test-execution-view",
  templateUrl: "./build-and-test-execution-view.component.html",
  providers: [BuildAndTestExecutionsService, DatePipe],
  imports: [
    AsyncPipe,
    RouterLink,
    MessageModule,
    BusinessProcessNamePipe,
    BusinessProcessUriFactoryPipeModule,
    BuildAndTestExecutionRunHeaderComponent,
    MxevolveIllustrationComponent,
    StepperComponent,
    StepComponent,
    ExecutionAlertDisplayComponent,
    BuildAndTestMergeStageComponent,
    BuildAndTestStepComponent,
    PrepareBuildStageComponent,
    Skeleton,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestExecutionViewComponent {
  readonly projectId = input.required<string>();
  readonly executionId = input.required<string>();

  private readonly executionFetcher = inject(BuildAndTestExecutionsService);
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
    // Fall back to the latest reached step, ignoring skipped/inactive steps so a
    // skipped Prepare Setup never becomes the default selection.
    const reachedSteps = steps.filter(
      (s) =>
        s.status === "completed" ||
        s.status === "on-hold" ||
        s.status === "failed"
    );
    if (reachedSteps.length > 0) {
      this.selectedStepId.set(reachedSteps[reachedSteps.length - 1].id);
      return;
    }
    // Nothing reached yet (e.g. only a skipped Prepare Setup): open the first
    // non-skipped step so we never land on a skipped step.
    const firstSelectableStep = steps.find((s) => s.status !== "skipped");
    if (firstSelectableStep) {
      this.selectedStepId.set(firstSelectableStep.id);
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
      // The Create Branch stage is folded into Prepare Setup in the UI: its
      // timing is still tracked in the backend (createBranchStage) and surfaced
      // through the Prepare Setup tooltip's start date.
      this.toStep(
        "prepare-build",
        "Prepare Setup",
        execution.prepareBuildStage,
        skipPrepareBuild,
        execution.createBranchStage
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
    stage: Stage,
    skipped = false,
    startStage?: Stage
  ): StepDefinition {
    const status = skipped
      ? "skipped"
      : this.mapStageStatusToStepStatus(stage.status);
    return {
      id,
      title,
      status,
      tooltip: this.computeStepTooltip(stage, status, startStage ?? stage),
    };
  }

  private computeStepTooltip(
    stage: Stage,
    status: StepStatus,
    startStage: Stage = stage
  ): string | undefined {
    if (status === "inactive") return undefined;

    const start = startStage.startDate;
    if (!start) return undefined;

    const formattedStart = this.formatDate(start);
    if (
      stage.endDate &&
      (status === "completed" ||
        status === "on-hold" ||
        status === "failed" ||
        status === "skipped")
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
      case StageStatus.CANCELED:
      case StageStatus.ABORTING:
      case StageStatus.ABORTED:
        return "inactive";
      case StageStatus.RUNNING:
      case StageStatus.PENDING_INPUT:
        return "active";
      case StageStatus.PASSED:
        return "completed";
      case StageStatus.ON_HOLD:
        return "on-hold";
      case StageStatus.FAILED:
        return "failed";
      default:
        return "inactive";
    }
  }

  protected readonly ExecutionStatus = ExecutionStatus;
  protected readonly BuildAndTestSourceType = BuildAndTestSourceType;
}
