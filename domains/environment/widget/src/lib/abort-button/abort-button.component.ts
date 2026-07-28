import { Component, inject, input, output, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { Tooltip } from "primeng/tooltip";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { EnvironmentAbortService } from "@mxevolve/domains/environment/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";

@Component({
  selector: "mxevolve-environment-abort-button",
  standalone: true,
  imports: [
    ButtonModule,
    ConfirmDialog,
    Tooltip,
    MxevolveIconComponent,
    ShowElementIfAuthorizedDirective,
  ],
  providers: [ConfirmationService, EnvironmentAbortService],
  templateUrl: "./abort-button.component.html",
})
export class EnvironmentAbortButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly aborted = output<void>();

  readonly loading = signal(false);

  private readonly environmentAbortService = inject(EnvironmentAbortService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);

  handleAbortClicked(): void {
    this.confirmationService.confirm({
      header: "Confirmation",
      message: `Are you sure you want to abort environment <b>${this.environmentId()}</b>?`,
      icon: "pi pi-exclamation-triangle",
    });
  }

  confirmAbort(): void {
    this.confirmationService.close();
    this.abortEnvironment();
  }

  rejectAbort(): void {
    this.confirmationService.close();
  }

  private abortEnvironment(): void {
    this.loading.set(true);

    this.environmentAbortService
      .abortProjectEnvironments(this.projectId(), {
        environmentIds: [this.environmentId()],
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastMessageService.showSuccess(
            `Environment ${this.environmentId()} abort requested successfully.`
          );
          this.aborted.emit();
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }
}
