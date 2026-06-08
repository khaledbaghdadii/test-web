import { Component, inject, Input } from "@angular/core";
import { Button } from "primeng/button";
import {
  ScenarioExecutionService,
  ScenarioExecutionStatus,
} from "@mxflow/test-management";
import { Tooltip } from "primeng/tooltip";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService } from "primeng/api";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { Toast } from "primeng/toast";
import { DisableAbortPipe } from "./disable-abort.pipe";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-abort-scenario-execution-button",
  templateUrl: "./abort-scenario-execution-button.component.html",
  imports: [Button, Tooltip, ConfirmPopupModule, Toast, DisableAbortPipe],
  providers: [ToastMessageService, ConfirmationService],
})
export class AbortScenarioExecutionButtonComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) scenarioExecutionStatus: ScenarioExecutionStatus;
  scenarioExecutionService: ScenarioExecutionService = inject(
    ScenarioExecutionService
  );
  toastMessageService: ToastMessageService = inject(ToastMessageService);
  confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );
  loading = false;
  protected readonly ScenarioExecutionStatus = ScenarioExecutionStatus;

  handleAbortClicked($event: Event) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message: "Are you sure you want to abort this scenario execution?",
      icon: "pi pi-info-circle",
      acceptButtonStyleClass: "p-button-danger p-button-sm",
      accept: () => this.abortScenario(),
    });
  }

  private abortScenario() {
    this.analyticsTrackerService.trackAbortExecution();
    this.loading = true;
    this.scenarioExecutionService
      .abortScenarioExecution(this.projectId, this.scenarioExecutionId)
      .subscribe({
        next: (message) => {
          this.toastMessageService.showSuccess(message);
          this.loading = false;
        },
        error: (error) => {
          this.toastMessageService.showError(error);
          this.loading = false;
        },
      });
  }
}
