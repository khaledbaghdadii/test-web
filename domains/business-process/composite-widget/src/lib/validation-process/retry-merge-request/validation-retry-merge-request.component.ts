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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  MergeRequestDetailsFormComponent,
  MergeRequestDetailsValue,
} from "../../upgrade-process/merge-request-details-form/merge-request-details-form.component";

@Component({
  selector: "mxevolve-validation-retry-merge-request",
  templateUrl: "./validation-retry-merge-request.component.html",
  imports: [
    Button,
    Dialog,
    ReactiveFormsModule,
    MergeRequestDetailsFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationRetryMergeRequestComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<ValidationProcessStageStatus>();
  readonly developmentId = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();

  protected readonly ExecutionFamily = ExecutionFamily;

  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dialogVisible = model(false);
  readonly buttonDisplayed = computed(
    () => this.stageStatus() === ValidationProcessStageStatus.PENDING_INPUT
  );

  readonly loading = signal(false);

  readonly mergeRequestControl =
    new FormControl<MergeRequestDetailsValue | null>(null);

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  submit(): void {
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
        next: () => {
          this.loading.set(false);
          this.dialogVisible.set(false);
          this.toastMessageService.showSuccess("Changes sent for review.");
          this.stateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }
}
