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
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import {
  MergeRequestDetailsFormComponent,
  MergeRequestDetailsValue,
} from "../merge-request-details-form/merge-request-details-form.component";
import {
  SendChangesForReviewService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "mxevolve-retry-merge-request",
  templateUrl: "./retry-merge-request.component.html",
  imports: [
    Button,
    Dialog,
    ReactiveFormsModule,
    MergeRequestDetailsFormComponent,
  ],
  providers: [SendChangesForReviewService, UpgradeProcessStateUpdaterService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetryMergeRequestComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();
  readonly developmentId = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();

  private readonly sendChangesForReviewService = inject(
    SendChangesForReviewService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly upgradeProcessStateUpdater = inject(
    UpgradeProcessStateUpdaterService
  );

  readonly dialogVisible = model(false);
  readonly buttonDisplayed = computed(
    () => this.stageStatus() == StageStatus.PENDING_INPUT
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
    this.sendChangesForReviewService
      .sendChangesForReview({
        projectId: this.projectId(),
        processId: this.processId(),
        mergeJobTitle: mrValue.mergeRequestTitle,
        mergeConfigurationId: mrValue.destinationBranch!.id,
        mergeJobReviewers: mrValue.reviewers.map((r) => r.name),
        shouldCleanDevelopment: mrValue.deleteBranch?.shouldDelete ?? false,
        developmentId: mrValue.deleteBranch?.developmentId ?? undefined,
        supportsResourceManagement: this.supportsResourceManagement(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogVisible.set(false);
          this.toastMessageService.showSuccess("Changes sent for review.");
          this.upgradeProcessStateUpdater.reloadProcessDetails(
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
