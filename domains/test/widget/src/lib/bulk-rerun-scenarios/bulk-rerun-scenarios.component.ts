import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { APP_CONFIG } from "@mxflow/config";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { MultiSelectScenarioRunTableComponent } from "../multi-select-scenario-run-table/multi-select-scenario-run-table.component";
import { RerunDialogComponent } from "../rerun-dialog/rerun-dialog.component";
import type { ScenarioRunsPanelViewModel } from "../scenario-runs/scenario-runs-panel-facade.service";

@Component({
  selector: "mxevolve-bulk-rerun-scenarios",
  imports: [
    Button,
    Dialog,
    PrimeTemplate,
    MultiSelectScenarioRunTableComponent,
    RerunDialogComponent,
  ],
  providers: [
    ScenarioRunService,
    {
      provide: GATEWAY_CONFIG,
      useFactory: () => ({ gatewayUrl: inject(APP_CONFIG).gatewayUrl }),
    },
    FactoryProductApiService,
  ],
  templateUrl: "./bulk-rerun-scenarios.component.html",
})
export class BulkRerunScenariosComponent {
  readonly projectId = input.required<string>();
  readonly panels = input.required<ScenarioRunsPanelViewModel[]>();

  readonly rerunCompleted = output<void>();

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showSelectionDialog = signal(false);
  readonly showRerunDialog = signal(false);
  readonly selectedScenarioRunIds = signal<string[]>([]);
  readonly bulkRerunLoading = signal(false);

  readonly repushableHeadIds = computed(() =>
    this.panels()
      .filter((p) => p.head.repushable ?? false)
      .map((p) => p.head.id)
  );
  readonly isBulkRerunDisabled = computed(
    () => this.repushableHeadIds().length === 0
  );
  readonly preFilledFactoryProductId = computed(() => {
    const selected = this.selectedScenarioRunIds();
    if (selected.length === 0) return undefined;
    const panelMap = new Map(this.panels().map((p) => [p.head.id, p.head]));
    const fpIds = selected
      .map((id) => panelMap.get(id)?.factoryProductId)
      .filter(Boolean);
    const unique = new Set(fpIds);
    return unique.size === 1 ? fpIds[0] : undefined;
  });

  openSelectionDialog(): void {
    this.selectedScenarioRunIds.set([]);
    this.showSelectionDialog.set(true);
  }

  onSelectionRerunClicked(): void {
    this.showSelectionDialog.set(false);
    this.showRerunDialog.set(true);
  }

  onBulkRerunRequested(event: {
    factoryProductId: string;
    commitId?: string;
  }): void {
    this.bulkRerunLoading.set(true);
    this.scenarioRunService
      .bulkRerun(this.projectId(), {
        factoryProductId: event.factoryProductId,
        commitId: event.commitId,
        scenariosToBeRepushed: this.selectedScenarioRunIds(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.bulkRerunLoading.set(false);
          this.showRerunDialog.set(false);
          const failedCount = response.failedRepushes.length;
          if (failedCount > 0) {
            this.toastMessageService.showSuccess(
              `Bulk rerun successfully submitted. ${failedCount} failed.`
            );
          } else {
            this.toastMessageService.showSuccess(
              "Bulk rerun successfully submitted."
            );
          }
          this.rerunCompleted.emit();
        },
        error: () => {
          this.bulkRerunLoading.set(false);
          this.toastMessageService.showError("Failed to submit bulk rerun.");
        },
      });
  }
}
