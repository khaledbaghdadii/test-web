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
import { ExecutionRunHeaderComponent } from "@mxevolve/domains/business-process/composite-widget";
import { ExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  MxevolveIllustrationComponent,
  StepComponent,
  StepDefinition,
  StepperComponent,
  StepStatus,
} from "@mxevolve/shared/ui/primitive";
import { ConvertBinaryStageComponent } from "../convert-binary-stage/convert-binary-stage.component";
import { RunQualityGateStageComponent } from "../run-quality-gate-stage/run-quality-gate-stage.component";
import { IntegrateChangesStageComponent } from "../integrate-changes-stage/integrate-changes-stage.component";
import { TagStageComponent } from "../tag-stage/tag-stage.component";
import { ExecutionAlertDisplayComponent } from "@mxevolve/domains/business-process/ui";

@Component({
  selector: "mxevolve-upgrade-process-execution-view",
  templateUrl: "./upgrade-process-execution-view.component.html",
  providers: [ExecutionFetcherService],
  imports: [
    ExecutionRunHeaderComponent,
    MxevolveIllustrationComponent,
    StepperComponent,
    StepComponent,
    ConvertBinaryStageComponent,
    RunQualityGateStageComponent,
    IntegrateChangesStageComponent,
    TagStageComponent,
    ExecutionAlertDisplayComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class UpgradeProcessExecutionViewComponent {
  readonly projectId = input.required<string>();
  readonly executionId = input.required<string>();

  private readonly executionFetcher = inject(ExecutionFetcherService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
      (s) => s.status === "completed" || s.status === "failed"
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
      this.executionDetails.value().binaryConversionStage.status !==
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
    return [
      {
        id: "convert-binary",
        title: "Convert Binary",
        status: this.mapStageStatusToStepStatus(
          execution.binaryConversionStage.status
        ),
      },
      {
        id: "run-quality-gate",
        title: "Run Quality Gate",
        status: this.mapStageStatusToStepStatus(
          execution.executeQualityGateStage.status
        ),
      },
      {
        id: "merge",
        title: "Merge",
        status: this.mapStageStatusToStepStatus(
          execution.integrateChangesStage.status
        ),
      },
      {
        id: "tag",
        title: "Tag",
        status: this.mapStageStatusToStepStatus(
          execution.tagUpgradeBranchStage.status
        ),
      },
    ] as StepDefinition[];
  });

  private mapStageStatusToStepStatus(status: StageStatus): StepStatus {
    switch (status) {
      case StageStatus.NOT_STARTED:
      case StageStatus.SKIPPED:
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
