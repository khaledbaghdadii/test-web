import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestEnvironmentResolverService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import {
  Development,
  DevelopmentService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  MxevolveIllustrationComponent,
  ToastMessageService,
  type StepStatus,
} from "@mxevolve/shared/ui/primitive";
import {
  BuildAndTestProcessExecution,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import { BuildAndTestBuildSectionComponent } from "./build-and-test-build-section/build-and-test-build-section.component";
import { BuildAndTestTestSectionComponent } from "./build-and-test-test-section/build-and-test-test-section.component";
import { BuildAndTestTechnicalReseedSectionComponent } from "./build-and-test-technical-reseed-section/build-and-test-technical-reseed-section.component";
import { BuildAndTestSendForReviewComponent } from "../merge-stage/build-and-test-send-for-review.component";
import { catchError, of } from "rxjs";

/**
 * Build & Test step body.
 *
 * Mirrors the legacy `mxflow-build-and-test-stage` section order:
 *   error alert -> loading illustration -> cherry-pick alert ->
 *   Build panel -> Technical Reseed -> Test panel -> Merge action.
 *
 * Story A delivers the shell with placeholder panels; Build/Test/Reseed/Merge
 * content is implemented in Stories B and C.
 */
@Component({
  selector: "mxevolve-build-and-test-step",
  templateUrl: "./build-and-test-step.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    Button,
    BuildAndTestSendForReviewComponent,
    Message,
    MxevolveIllustrationComponent,
    Skeleton,
    StageContainerComponent,
    BuildAndTestBuildSectionComponent,
    BuildAndTestTestSectionComponent,
    BuildAndTestTechnicalReseedSectionComponent,
  ],
  providers: [
    BuildAndTestProcessStateUpdaterService,
    BuildAndTestEnvironmentResolverService,
    BuildAndTestUserInputService,
    DevelopmentService,
    MergeRequestService,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestStepComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();
  readonly stageStatus = input.required<StepStatus>();

  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly environmentResolver = inject(
    BuildAndTestEnvironmentResolverService
  );
  private readonly developmentService = inject(DevelopmentService);
  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly userInputService = inject(BuildAndTestUserInputService);
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly stage = computed(() => this.execution().buildAndTestStage);
  readonly sendForReviewVisible = signal(false);
  readonly actionLoading = signal(false);

  readonly projectId = computed(() => this.execution().projectId);
  readonly processId = computed(() => this.execution().id);

  readonly readyForBuildAndTest = computed(
    () => this.stage().readyForBuildAndTest ?? false
  );

  readonly cherryPickRunning = computed(
    () => this.stage().cherryPickRunning ?? false
  );

  readonly cherryPickFailed = computed(
    () => this.stage().cherryPickFailed ?? false
  );

  readonly temporaryBranchName = computed(
    () => this.execution().input.configurationBranchName
  );

  readonly developmentId = computed(
    () => this.execution().createBranchStage.developmentId
  );

  private readonly developmentResource = rxResource<
    Development,
    { projectId: string; developmentId: string }
  >({
    params: () => {
      const developmentId = this.developmentId();
      if (!developmentId) return undefined;
      return { projectId: this.projectId(), developmentId };
    },
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId,
        true
      ),
  });

  readonly development = computed(() => this.developmentResource.value());

  readonly branchName = computed(() => {
    const development = this.development();
    if (development) return development.name;
    return this.developmentId() ? undefined : this.temporaryBranchName();
  });

  readonly cherryPickFailedMessage = computed(
    () =>
      `Cherry-pick could not be completed automatically. Please manually cherry-pick your commits to the branch '${this.temporaryBranchName()}' and then click 'Proceed to the Next Step' to open a merge request.`
  );

  /** Build Environment is hidden when the run skips environment deployment. */
  readonly showEnvironmentDetails = computed(
    () => !this.execution().input.buildEnvironment.skipEnvironmentDeployment
  );

  /** Jira/user story ids the run is working on. */
  readonly storyIds = computed(() => this.execution().input.userStoryIds ?? []);

  readonly automerge = computed(
    () => this.execution().hasPredefinedMergeRequestInputs
  );

  readonly isUserInterventionDisabled = computed(
    () =>
      this.stage().status !== StageStatus.PENDING_INPUT &&
      this.stage().status !== StageStatus.RUNNING
  );

  readonly sendForReviewDisabled = computed(
    () =>
      this.stage().status !== StageStatus.PENDING_INPUT ||
      !this.developmentId() ||
      this.actionLoading()
  );

  readonly latestMergeJobId = computed(
    () => this.execution().integrateChangesStage.latestMergeJobId
  );

  readonly mergeRequestResource = rxResource({
    params: () => {
      const mergeRequestId = this.latestMergeJobId();
      if (!mergeRequestId) return undefined;
      return { projectId: this.projectId(), mergeRequestId };
    },
    stream: ({ params }) =>
      this.mergeRequestService
        .getMergeRequestById(params.projectId, params.mergeRequestId)
        .pipe(
          catchError((error) => {
            this.toastMessageService.showError(error.message);
            return of(undefined);
          })
        ),
  });

  readonly canReopenMergeRequest = computed(
    () => this.mergeRequestResource.value()?.isReOpenable === true
  );

  readonly decisionRequester = computed(() => this.stage().requester);

  readonly showDecisionResult = computed(() => !!this.decisionRequester());

  readonly decisionResultLabel = computed(() => {
    if (this.stage().status === StageStatus.PASSED) return "Passed";
    if (this.stage().status === StageStatus.STOPPED) return "Stopped";
    return this.stage().status;
  });

  readonly decisionMessageSeverity = computed<"success" | "secondary">(() =>
    this.stage().status === StageStatus.PASSED ? "success" : "secondary"
  );

  readonly scenarioExecutionGroup = computed(
    () => this.stage().scenarioExecutionGroup
  );

  readonly machineGroupId = computed(
    () => this.execution().input.buildAndTestInfraGroup
  );

  /** Technical Reseed section is conditional on a reseed execution group. */
  readonly showTechnicalReseed = computed(
    () => !!this.stage().technicalReseedExecutionGroupId
  );

  readonly technicalReseedExecutionGroupId = computed(
    () => this.stage().technicalReseedExecutionGroupId
  );

  /**
   * The build/test environment id is not on the CI model; it is resolved
   * indirectly from the latest deploy scenario of the prepare-build stage
   * (mirrors the legacy `getScenarioExecution(...).environmentId` lookup).
   * Absent when the run skips environment deployment (no deploy scenario).
   */
  readonly environmentScenarioId = computed(
    () => this.execution().prepareBuildStage.latestScenarioExecutionId
  );

  private readonly environmentResource = rxResource({
    params: () => {
      const scenarioExecutionId = this.environmentScenarioId();
      if (!scenarioExecutionId) return undefined;
      return { projectId: this.projectId(), scenarioExecutionId };
    },
    stream: ({ params }) =>
      this.environmentResolver.resolveEnvironment(
        params.projectId,
        params.scenarioExecutionId
      ),
  });

  readonly environmentResolutionError = computed(() => {
    const error = this.environmentResource.error();
    if (!error) return undefined;
    return error instanceof Error ? error.message : String(error);
  });

  readonly errorMessage = computed(
    () => this.stage().errorMessage ?? this.environmentResolutionError()
  );

  readonly environmentId = computed(
    () => this.environmentResource.value()?.environmentId || undefined
  );

  readonly showEnvironmentWaitingMessage = computed(
    () =>
      this.showEnvironmentDetails() &&
      !this.environmentId() &&
      !this.environmentResolutionError()
  );

  openSendForReview(): void {
    if (this.sendForReviewDisabled()) return;
    this.sendForReviewVisible.set(true);
  }

  reopenMergeRequest(): void {
    if (this.sendForReviewDisabled()) return;
    this.actionLoading.set(true);
    this.userInputService
      .reopenMergeRequest({
        projectId: this.projectId(),
        processId: this.processId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleActionSuccess(),
        error: (error) => this.handleActionError(error.message),
      });
  }

  reloadExecution(): void {
    this.stateUpdater.reloadProcessDetails(
      this.execution().id,
      this.execution().projectId
    );
  }

  private handleActionSuccess(): void {
    this.actionLoading.set(false);
    this.reloadExecution();
  }

  private handleActionError(message: string): void {
    this.actionLoading.set(false);
    this.toastMessageService.showError(message);
  }
}
