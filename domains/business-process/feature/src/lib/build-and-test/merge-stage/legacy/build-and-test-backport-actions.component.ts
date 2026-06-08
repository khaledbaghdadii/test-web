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
  BuildAndTestProcessStateUpdaterService,
  BuildAndTestUserInputService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { Button } from "primeng/button";

@Component({
  selector: "mxevolve-build-and-test-backport-actions",
  imports: [Button],
  providers: [
    BuildAndTestUserInputService,
    BuildAndTestProcessStateUpdaterService,
  ],
  templateUrl: "./build-and-test-backport-actions.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBackportActionsComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly mergeConfigurationId = input.required<string>();
  readonly canRepushBackport = input.required<boolean>();
  readonly processStatus = input.required<ExecutionStatus>();

  private readonly userInputService = inject(BuildAndTestUserInputService);
  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);

  readonly disabled = computed(
    () =>
      !this.canRepushBackport() ||
      this.processStatus() === ExecutionStatus.FAILED ||
      this.loading()
  );

  repushBackportMergeRequest(): void {
    this.loading.set(true);
    this.userInputService
      .repushBackportMergeRequest({
        projectId: this.projectId(),
        processId: this.processId(),
        mergeConfigurationId: this.mergeConfigurationId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
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
