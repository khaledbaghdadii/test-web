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
  FixIssuesService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";

@Component({
  selector: "mxevolve-fix-issues",
  templateUrl: "./fix-issues.component.html",
  imports: [Button],
  providers: [FixIssuesService, UpgradeProcessStateUpdaterService],
})
export class FixIssuesComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly upgradeProcessStateUpdater = inject(
    UpgradeProcessStateUpdaterService
  );
  private readonly fixIssuesService = inject(FixIssuesService);

  readonly buttonDisplayed = computed(
    () => this.stageStatus() == StageStatus.PENDING_INPUT
  );

  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.fixIssuesService
      .fixIssues(this.projectId(), this.processId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            "Successfully transitioned to fixing issues."
          );
          this.upgradeProcessStateUpdater.reloadProcessDetails(
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
