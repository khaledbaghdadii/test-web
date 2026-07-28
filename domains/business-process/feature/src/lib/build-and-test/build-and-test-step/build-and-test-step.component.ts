import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestEnvironmentResolverService,
} from "@mxevolve/domains/business-process/data-access";
import {
  DevelopmentService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
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
import { BuildAndTestMergeRequestReopenComponent } from "../merge-request-reopen/build-and-test-merge-request-reopen.component";
import { catchError, EMPTY, of } from "rxjs";

@Component({
  selector: "mxevolve-build-and-test-step",
  templateUrl: "./build-and-test-step.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    Button,
    BuildAndTestSendForReviewComponent,
    BuildAndTestMergeRequestReopenComponent,
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
    ScenarioRunService,
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

  private readonly stateUpdater = inject(
    BuildAndTestProcessStateUpdaterService
  );
  private readonly environmentResolver = inject(
    BuildAndTestEnvironmentResolverService
  );
  private readonly developmentService = inject(DevelopmentService);
  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly stage = computed(() => this.execution().buildAndTestStage);
  readonly sendForReviewVisible = signal(false);

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

  private readonly developmentResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      developmentId: this.developmentId(),
    }),
    stream: ({ params }) =>
      params.developmentId
        ? this.developmentService
            .getDevelopment(params.projectId, params.developmentId, true)
            .pipe(
              catchError(() => {
                this.toastMessageService.showError(
                  "Unable to retrieve branch-related information due to a technical issue. As a result, launching scenarios is currently unavailable."
                );
                return EMPTY;
              })
            )
        : EMPTY,
  });

  readonly development = computed(() => this.developmentResource.value());

  readonly cherryPickFailedMessage = computed(
    () =>
      `Cherry-pick could not be completed automatically. Please manually cherry-pick your commits to the branch '${this.temporaryBranchName()}' and then click 'Merge' to open a merge request.`
  );

  /** Build Environment is hidden when the run skips environment deployment. */
  readonly prepareBuildStepIsNotSkipped = computed(
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
      this.stage().status !== StageStatus.PENDING_INPUT || !this.developmentId()
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

  /** When the stage passed, the process moved forward to the next step. */
  readonly decisionMessage = computed(() => {
    if (this.stage().status === StageStatus.PASSED) {
      return `The process was advanced by ${this.decisionRequester()}`;
    }
    return `${this.decisionResultLabel()} by ${this.decisionRequester()}`;
  });

  readonly decisionResultLabel = computed(() => {
    if (this.stage().status === StageStatus.PASSED) return "Passed";
    if (this.stage().status === StageStatus.STOPPED) return "Stopped";
    return this.stage().status;
  });

  readonly decisionMessageSeverity = computed<"info" | "secondary">(() =>
    this.stage().status === StageStatus.PASSED ? "info" : "secondary"
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
      this.environmentResolver
        .resolveEnvironment(params.projectId, params.scenarioExecutionId)
        .pipe(
          catchError((error) => {
            this.toastMessageService.showError(
              error instanceof Error ? error.message : String(error)
            );
            return of({ environmentId: undefined });
          })
        ),
  });

  readonly resolveEnvironmentId = computed(
    () => this.environmentResource.value()?.environmentId || undefined
  );

  readonly errorMessage = computed(() => this.stage().errorMessage);

  readonly showEnvironmentWaitingMessage = computed(
    () =>
      this.prepareBuildStepIsNotSkipped() &&
      this.environmentIdIsNotResolvedYet() &&
      this.didNotFaceAnyErrorsWhileResolvingEnvironment()
  );

  openSendForReview(): void {
    if (this.sendForReviewDisabled()) return;
    this.sendForReviewVisible.set(true);
  }

  reloadExecution(): void {
    this.stateUpdater.reloadProcessDetails(
      this.execution().id,
      this.execution().projectId
    );
  }

  private environmentIdIsNotResolvedYet() {
    return this.resolveEnvironmentId() == undefined;
  }

  private didNotFaceAnyErrorsWhileResolvingEnvironment() {
    return this.environmentResource.isLoading();
  }
}
