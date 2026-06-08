import {
  Component,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from "@angular/core";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-archive-scenario-definition-button",
  templateUrl: "./archive-scenario-definition-button.component.html",
  imports: [Button, ConfirmDialogModule, Tooltip, MxevolveIconComponent],
  providers: [ConfirmationService],
})
export class ArchiveScenarioDefinitionButtonComponent {
  projectId = input.required<string>();
  scenarioDefinitionId = input.required<string>();
  scenarioDefinitionName = input.required<string>();

  loading = signal(false);
  @Output() archived = new EventEmitter<void>();

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);

  handleArchiveClicked(): void {
    this.confirmationService.confirm({
      header: "Confirmation",
      message: this.getArchiveScenarioDefinitionConfirmationMessage(),
      icon: "pi pi-exclamation-triangle",
    });
  }

  confirmArchive(): void {
    this.confirmationService.close();
    this.archiveScenarioDefinition();
  }

  rejectArchive(): void {
    this.confirmationService.close();
  }

  private archiveScenarioDefinition(): void {
    this.loading.set(true);
    this.scenarioDefinitionService
      .archiveScenarioDefinition(this.projectId(), this.scenarioDefinitionId())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            this.getMessageForSuccessfulArchive()
          );
          this.archived.emit();
        },
        error: () => {
          this.loading.set(false);
          this.toastMessageService.showError(this.getArchiveFailureMessage());
        },
      });
  }

  private getArchiveFailureMessage() {
    return `Failed to archive scenario definition ${this.scenarioDefinitionName()}.`;
  }

  private getArchiveScenarioDefinitionConfirmationMessage() {
    return `Are you sure you want to archive scenario definition <b>${this.scenarioDefinitionName()}</b>?`;
  }

  private getMessageForSuccessfulArchive() {
    return `Scenario definition ${this.scenarioDefinitionName()} successfully archived.`;
  }
}
