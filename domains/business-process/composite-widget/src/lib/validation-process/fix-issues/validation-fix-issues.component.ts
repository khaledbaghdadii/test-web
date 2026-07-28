import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ValidationProcessStageStatus,
  ValidationProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";

@Component({
  selector: "mxevolve-validation-fix-issues",
  templateUrl: "./validation-fix-issues.component.html",
  imports: [Button],
})
export class ValidationFixIssuesComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<ValidationProcessStageStatus>();

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateUpdater = inject(ValidationProcessStateUpdaterService);

  readonly buttonDisplayed = computed(
    () => this.stageStatus() === ValidationProcessStageStatus.PENDING_INPUT
  );

  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.stateUpdater
      .reopenMergeRequest(this.projectId(), this.processId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            "Successfully transitioned to fixing issues."
          );
          this.stateUpdater.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: () => {
          this.loading.set(false);
          this.toastMessageService.showError(
            "An error occurred while transitioning to fixing issues."
          );
        },
      });
  }
}
