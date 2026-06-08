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
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { SingleSelectScenarioRunTableComponent } from "@mxevolve/domains/test/widget";
import {
  PickReferenceExecutionService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "mxevolve-pick-reference-scenario",
  templateUrl: "./pick-reference-scenario.component.html",
  imports: [Button, Dialog, SingleSelectScenarioRunTableComponent],
  providers: [PickReferenceExecutionService, UpgradeProcessStateUpdaterService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PickReferenceScenarioComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();

  private readonly pickReferenceExecutionService = inject(
    PickReferenceExecutionService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly upgradeProcessStateUpdater = inject(
    UpgradeProcessStateUpdaterService
  );

  readonly dialogVisible = model(false);
  readonly buttonDisabled = computed(
    () => this.stageStatus() !== StageStatus.PENDING_INPUT
  );
  readonly loading = signal(false);
  readonly selectedScenarioRunId = signal<string | undefined>(undefined);
  readonly confirmDisabled = computed(
    () => this.selectedScenarioRunId() === undefined
  );

  openDialog(): void {
    this.selectedScenarioRunId.set(undefined);
    this.dialogVisible.set(true);
  }

  onScenarioRunSelected(id: string): void {
    this.selectedScenarioRunId.set(id);
  }

  submit(): void {
    this.loading.set(true);
    this.pickReferenceExecutionService
      .pickReferenceExecution(
        this.projectId(),
        this.processId(),
        this.selectedScenarioRunId()!
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogVisible.set(false);
          this.toastMessageService.showSuccess("Reference execution picked.");
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
