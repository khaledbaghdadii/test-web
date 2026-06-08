import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FinalProductDetailsComponent } from "@mxevolve/domains/artifact/widget";
import {
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessStage,
  ExecutionStatus,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  DevelopmentService,
  MergeConfigurationService,
  MergeRequestService,
} from "@mxevolve/domains/scm/data-access";
import { DevelopmentDetailsComponent } from "@mxevolve/domains/scm/composite-widget";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { PanelModule } from "primeng/panel";
import { Skeleton } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { catchError, forkJoin, map, of } from "rxjs";
import { BuildAndTestBackportExecutionsSummaryComponent } from "./build-and-test-backport-executions-summary.component";
import { BuildAndTestSendForReviewComponent } from "./build-and-test-send-for-review.component";
import { BuildAndTestLegacyBackportChangesComponent } from "./legacy/build-and-test-legacy-backport-changes.component";

@Component({
  selector: "mxevolve-build-and-test-merge-stage",
  imports: [
    BuildAndTestBackportExecutionsSummaryComponent,
    BuildAndTestLegacyBackportChangesComponent,
    BuildAndTestSendForReviewComponent,
    BusinessProcessContentContainerComponent,
    Button,
    DevelopmentDetailsComponent,
    FinalProductDetailsComponent,
    MergeRequestStepperComponent,
    Message,
    MxevolveIconComponent,
    NgTemplateOutlet,
    PanelModule,
    Skeleton,
    StageContainerComponent,
    TabsModule,
  ],
  providers: [
    BuildAndTestProcessStateUpdaterService,
    BuildAndTestUserInputService,
    DevelopmentService,
    MergeConfigurationService,
    MergeRequestService,
  ],
  templateUrl: "./build-and-test-merge-stage.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestMergeStageComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly developmentService = inject(DevelopmentService);
  private readonly mergeConfigurationService = inject(MergeConfigurationService);
  private readonly mergeRequestService = inject(MergeRequestService);
  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly userInputService = inject(BuildAndTestUserInputService);

  readonly sendForReviewVisible = signal(false);
  readonly actionLoading = signal(false);

  readonly stage = computed<BuildAndTestProcessStage>(
    () => this.execution().integrateChangesStage
  );

  readonly latestMergeJobId = computed(() => this.stage().latestMergeJobId);
  readonly backports = computed(() => this.stage().backports ?? []);
  readonly backportStarted = computed(() => this.backports().length > 0);
  readonly backportRequested = computed(
    () => this.stage().backportRequested ?? false
  );
  readonly hasV2Backports = computed(
    () => this.execution().ciVersion === 2 && this.backportRequested()
  );
  readonly hasV1Backports = computed(
    () => this.execution().ciVersion !== 2 && this.backportRequested()
  );

  readonly actionsDisabled = computed(
    () =>
      this.stage().status !== StageStatus.PENDING_INPUT ||
      this.backportStarted() ||
      this.actionLoading()
  );

  readonly showDecision = computed(
    () =>
      this.stage().status === StageStatus.STOPPED && !this.backportStarted()
  );

  readonly mergeRequestResource = rxResource({
    params: () => {
      const mergeRequestId = this.latestMergeJobId();
      if (!mergeRequestId) return undefined;
      return { projectId: this.execution().projectId, mergeRequestId };
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

  readonly developmentResource = rxResource({
    params: () => {
      const developmentId = this.execution().createBranchStage.developmentId;
      if (!developmentId) return undefined;
      return { projectId: this.execution().projectId, developmentId };
    },
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId
      ),
  });

  readonly backportDestinationBranchesResource = rxResource({
    params: () => {
      const ids = this.stage().backportMergeConfigurationIds ?? [];
      if (ids.length === 0) return undefined;
      return {
        projectId: this.execution().projectId,
        repositoryId: this.execution().input.repositoryId,
        ids,
      };
    },
    stream: ({ params }) =>
      forkJoin(
        params.ids.map((id) =>
          this.mergeConfigurationService
            .getFilteredMergeConfigurations(
              params.projectId,
              params.repositoryId,
              id,
              0,
              1
            )
            .pipe(
              map((page) => page.content[0]?.branchName),
              catchError(() => of(undefined))
            )
        )
      ),
  });

  readonly backportDestinationBranches = computed(() =>
    (this.backportDestinationBranchesResource.value() ?? []).filter(
      (branch): branch is string => !!branch
    )
  );

  readonly integrateDestinationBranch = computed(
    () =>
      this.mergeRequestResource.value()?.destinationBranch ??
      this.mergeRequestResource.value()?.mergeConfiguration?.branchName ??
      this.execution().input.configurationParentBranch
  );

  readonly canReopenMergeRequest = computed(
    () => this.mergeRequestResource.value()?.isReOpenable === true
  );

  readonly shouldShowFinalProduct = computed(
    () =>
      this.stage().willPublishFinalProduct === true &&
      !!this.stage().finalProductPublishing
  );

  readonly shouldShowV1BackportInfo = computed(
    () =>
      !this.backportStarted() &&
      this.backportRequested() &&
      !!this.integrateDestinationBranch() &&
      this.execution().ciVersion === 1
  );

  openSendForReview(): void {
    this.sendForReviewVisible.set(true);
  }

  reopenMergeRequest(): void {
    this.actionLoading.set(true);
    this.userInputService
      .reopenMergeRequest({
        projectId: this.execution().projectId,
        processId: this.execution().id,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.reload(),
        error: (error) => this.handleActionError(error.message),
      });
  }

  fixIssues(): void {
    this.actionLoading.set(true);
    this.userInputService
      .fixIntegrationIssues(this.execution().projectId, this.execution().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.reload(),
        error: (error) => this.handleActionError(error.message),
      });
  }

  handleMergeRequestCreated(): void {
    this.reload();
  }

  handleFinalProductError(message: string): void {
    this.toastMessageService.showError(message);
  }

  private reload(): void {
    this.actionLoading.set(false);
    this.stateUpdater.reloadProcessDetails(
      this.execution().id,
      this.execution().projectId
    );
  }

  private handleActionError(message: string): void {
    this.actionLoading.set(false);
    this.toastMessageService.showError(message);
  }

  protected readonly ExecutionStatus = ExecutionStatus;
}
