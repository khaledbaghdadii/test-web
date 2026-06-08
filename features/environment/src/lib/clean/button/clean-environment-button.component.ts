import { Component, inject, input, signal } from "@angular/core";
import { Button } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { EnvironmentCleanService } from "../environment-clean.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-clean-environment-button",
  templateUrl: "./clean-environment-button.component.html",
  imports: [Button, ConfirmDialog, Tooltip],
  providers: [ConfirmationService, EnvironmentCleanService],
})
export class CleanEnvironmentButtonComponent {
  projectId = input.required<string>();
  environmentId = input.required<string>();

  loading = signal(false);

  private readonly environmentCleanService = inject(EnvironmentCleanService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);

  handleCleanClicked(): void {
    this.confirmationService.confirm({
      header: "Confirmation",
      message: `Are you sure you want to clean environment <b>${this.environmentId()}</b>?`,
      icon: "pi pi-exclamation-triangle",
    });
  }

  confirmClean(): void {
    this.confirmationService.close();
    this.cleanEnvironment();
  }

  rejectClean(): void {
    this.confirmationService.close();
  }

  private cleanEnvironment(): void {
    this.loading.set(true);

    this.environmentCleanService
      .cleanEnvironment(this.projectId(), this.environmentId())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            `Environment ${this.environmentId()} clean requested successfully.`
          );
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }
}
