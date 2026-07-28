import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  rxResource,
  takeUntilDestroyed,
  toSignal,
} from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  MergeRequestDetailsFormComponent,
  MergeRequestDetailsValue,
} from "../../upgrade-process/merge-request-details-form/merge-request-details-form.component";

@Component({
  selector: "mxevolve-validation-proceed-to-next-step",
  templateUrl: "./proceed-to-next-step.component.html",
  imports: [
    Button,
    Dialog,
    Message,
    ReactiveFormsModule,
    MergeRequestDetailsFormComponent,
    MxevolveIconComponent,
  ],
  providers: [CommitsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationProceedToNextStepComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<ValidationProcessStageStatus>();
  readonly developmentId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly originBranch = input.required<string>();
  readonly parentBranchName = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();

  protected readonly ExecutionFamily = ExecutionFamily;

  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);
  private readonly commitsService = inject(CommitsService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dialogVisible = model(false);
  readonly disabled = computed(
    () => this.stageStatus() !== ValidationProcessStageStatus.PENDING_INPUT
  );

  readonly loading = signal(false);

  readonly mergeRequestControl =
    new FormControl<MergeRequestDetailsValue | null>(null);

  private readonly mergeRequestValue = toSignal(
    this.mergeRequestControl.valueChanges,
    { initialValue: null }
  );

  readonly destinationBranchName = computed(
    () => this.mergeRequestValue()?.destinationBranch?.branchName ?? ""
  );

  readonly commitDifferences = rxResource({
    params: () => {
      const repositoryId = this.repositoryId();
      const sourceBranch = this.originBranch();
      const destinationBranch = this.destinationBranchName();
      if (!repositoryId || !sourceBranch || !destinationBranch) {
        return undefined;
      }
      return {
        projectId: this.projectId(),
        repositoryId,
        sourceBranch,
        destinationBranch,
      };
    },
    stream: ({ params }) => this.commitsService.getCommitDifferences(params),
  });

  readonly canSkipIntegration = computed(
    () =>
      this.commitDifferences.hasValue() &&
      this.commitDifferences.value().length === 0
  );

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  sendForReview(): void {
    this.loading.set(true);
    const mrValue = this.mergeRequestControl.value!;
    this.stateUpdater
      .sendChangesForReview({
        projectId: this.projectId(),
        processId: this.processId(),
        mergeJobTitle: mrValue.mergeRequestTitle,
        mergeConfigurationId: mrValue.destinationBranch!.id,
        mergeJobReviewers: mrValue.reviewers.map((r) => r.name),
        shouldCleanDevelopment: mrValue.deleteBranch?.shouldDelete ?? false,
        developmentId:
          mrValue.deleteBranch?.developmentId ?? this.developmentId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.onActionSuccess("Changes sent for review."),
        error: (error) => this.onActionError(error.message),
      });
  }

  skipIntegration(): void {
    this.loading.set(true);
    const mrValue = this.mergeRequestControl.value;
    this.stateUpdater
      .skipIntegrateChanges(this.projectId(), this.processId(), {
        destinationBranch: this.destinationBranchName(),
        shouldCleanDevelopment: mrValue?.deleteBranch?.shouldDelete ?? false,
        developmentId:
          mrValue?.deleteBranch?.developmentId ?? this.developmentId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.onActionSuccess("Integration step skipped."),
        error: (error) => this.onActionError(error.message),
      });
  }

  private onActionSuccess(message: string): void {
    this.loading.set(false);
    this.dialogVisible.set(false);
    this.toastMessageService.showSuccess(message);
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }

  private onActionError(message: string): void {
    this.loading.set(false);
    this.toastMessageService.showError(message);
  }
}
