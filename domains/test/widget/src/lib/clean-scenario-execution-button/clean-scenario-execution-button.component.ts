import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import {
  ScenarioRunService,
  TestManagementAnalyticsTrackerService,
} from "@mxevolve/domains/test/data-access";
import {
  LiteScenarioExecution,
  ScenarioExecutionHousekeepingStatus,
} from "@mxevolve/domains/test/model";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-clean-scenario-execution-button",
  standalone: true,
  imports: [Button, ConfirmDialogModule, TooltipModule, MxevolveIconComponent],
  providers: [ScenarioRunService, ConfirmationService],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      size="small"
      severity="danger"
      ariaLabel="Clean scenario run"
      pTooltip="Clean"
      tooltipPosition="top"
      (onClick)="handleCleanClicked()"
      [loading]="loading()"
      [disabled]="disabled()"
    >
      <mxevolve-icon name="cleaning_services" size="sm" />
    </p-button>
    <p-confirmDialog
      appendTo="self"
      [style]="{ 'border-radius': '4px', 'max-width': '24rem' }"
    >
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          (onClick)="rejectClean()"
        />
        <p-button
          label="Confirm"
          severity="danger"
          (onClick)="confirmClean()"
        />
      </ng-template>
    </p-confirmDialog>
  `,
})
export class CleanScenarioExecutionButtonComponent {
  projectId = input.required<string>();
  scenarioExecution = input.required<LiteScenarioExecution>();

  scenarioCleaned = output<void>();

  loading = signal(false);
  disabled = computed(
    () =>
      !(
        this.scenarioExecution().isFinished &&
        (this.scenarioExecution().cleaningStatus ===
          ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED ||
          this.scenarioExecution().cleaningStatus ===
            ScenarioExecutionHousekeepingStatus.FAILED)
      )
  );

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );

  handleCleanClicked() {
    this.confirmationService.confirm({
      header: "Confirmation",
      message: `Are you sure you want to clean this run?`,
      icon: "pi pi-exclamation-triangle",
    });
  }

  confirmClean() {
    this.confirmationService.close();
    this.analyticsTrackerService.trackCleanScenarioExecution();
    this.cleanScenarioExecution();
  }

  rejectClean() {
    this.confirmationService.close();
  }

  private cleanScenarioExecution() {
    this.loading.set(true);
    this.scenarioRunService
      .housekeepScenarioExecution(this.projectId(), this.scenarioExecution().id)
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            `Scenario cleanup requested successfully.`
          );
          this.scenarioCleaned.emit();
        },
        error: () => {
          this.toastMessageService.showError(`Failed to clean scenario run.`);
        },
      })
      .add(() => {
        this.loading.set(false);
      });
  }
}
