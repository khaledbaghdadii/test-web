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
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { AbortScenarioRunAnalyticsTrackerService } from "./abort-scenario-run-analytics-tracker.service";
@Component({
  selector: "mxevolve-abort-scenario-run-button",
  standalone: true,
  imports: [Button, ConfirmDialogModule, TooltipModule, MxevolveIconComponent],
  providers: [ScenarioRunService, ConfirmationService],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      size="small"
      severity="danger"
      ariaLabel="Abort scenario run"
      pTooltip="Abort"
      tooltipPosition="top"
      (onClick)="handleAbortClicked()"
      [loading]="loading()"
      [disabled]="disabled()"
    >
      <mxevolve-icon name="power_settings_new" />
    </p-button>
    <p-confirmDialog
      appendTo="self"
      [style]="{ 'border-radius': '4px', 'max-width': '24rem' }"
    >
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          (onClick)="rejectAbort()"
        />
        <p-button
          label="Confirm"
          severity="danger"
          (onClick)="confirmAbort()"
        />
      </ng-template>
    </p-confirmDialog>
  `,
})
export class AbortScenarioRunButtonComponent {
  projectId = input.required<string>();
  scenarioRunId = input.required<string>();
  scenarioRunName = input.required<string>();
  scenarioRunStatus = input.required<ScenarioRunStatus>();

  scenarioAborted = output<void>();

  loading = signal(false);
  disabled = computed(
    () => this.scenarioRunStatus() !== ScenarioRunStatus.UNDERWAY
  );

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);
private readonly analyticsTrackerService = inject(
  AbortScenarioRunAnalyticsTrackerService
);

  handleAbortClicked() {
    this.confirmationService.confirm({
      header: "Confirmation",
      message: `Are you sure you want to abort <b>${this.scenarioRunName()}</b>?`,
      icon: "pi pi-exclamation-triangle",
    });
  }

  confirmAbort() {
    this.confirmationService.close();
    this.abortScenarioRun();
  }

  rejectAbort() {
    this.confirmationService.close();
  }

  private abortScenarioRun() {
    this.analyticsTrackerService.trackAbortExecution();
    this.loading.set(true);
    this.scenarioRunService
      .abortScenarioRun(this.projectId(), this.scenarioRunId())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            `Scenario run ${this.scenarioRunName()} abort requested successfully.`
          );
          this.scenarioAborted.emit();
        },
        error: () => {
          this.loading.set(false);
          this.toastMessageService.showError(
            `Failed to abort scenario run ${this.scenarioRunName()}.`
          );
        },
      });
  }
}
