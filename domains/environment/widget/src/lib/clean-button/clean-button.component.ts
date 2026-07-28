import { Component, inject, input, output, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { Tooltip } from "primeng/tooltip";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { EnvironmentCleanService } from "@mxevolve/domains/environment/data-access";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";

@Component({
  selector: "mxevolve-environment-clean-button",
  standalone: true,
  imports: [
    ButtonModule,
    ConfirmDialog,
    Tooltip,
    MxevolveIconComponent,
    ShowElementIfAuthorizedDirective,
  ],
  providers: [ConfirmationService, EnvironmentCleanService],
  templateUrl: "./clean-button.component.html",
})
export class EnvironmentCleanButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly cleaned = output<void>();

  readonly loading = signal(false);

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
          this.cleaned.emit();
        },
        error: (error) => {
          this.loading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }
}
