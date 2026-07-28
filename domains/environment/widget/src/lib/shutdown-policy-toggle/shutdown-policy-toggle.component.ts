import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ShutdownPolicyService } from "@mxevolve/domains/environment/data-access";
import { ToggleTooltipPipe } from "./toggle-tooltip.pipe";

@Component({
  selector: "mxevolve-environment-shutdown-policy-toggle",
  standalone: true,
  imports: [FormsModule, ToggleSwitch, Tooltip, ToggleTooltipPipe],
  providers: [ShutdownPolicyService],
  templateUrl: "./shutdown-policy-toggle.component.html",
})
export class EnvironmentShutdownPolicyToggleComponent implements OnInit {
  readonly projectId = input.required<string>();
  readonly allocationId = input.required<string>();

  readonly exclude = signal<boolean | undefined>(undefined);
  readonly actionsAllowed = signal(false);

  private readonly shutdownPolicyService = inject(ShutdownPolicyService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.shutdownPolicyService
      .getEnvironmentShutdownPolicyState(this.projectId(), this.allocationId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          if (state.isIncludedInShutdown !== undefined) {
            this.exclude.set(!state.isIncludedInShutdown);
          }
          this.actionsAllowed.set(state.actionsAllowed);
        },
        error: (error) => {
          this.toastMessageService.showError(
            error.message,
            "Failed to check the WRP status of the environment."
          );
        },
      });
  }

  updateState(): void {
    if (this.exclude()) {
      this.excludeFromWrp();
    } else {
      this.includeInWrp();
    }
  }

  private excludeFromWrp(): void {
    this.shutdownPolicyService
      .excludeEnvironmentFromShutdownPolicy(
        this.projectId(),
        this.allocationId()
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "The environment is scheduled to be excluded from the WRP. This may take a few minutes to take effect."
          );
        },
        error: (error) => {
          this.toastMessageService.showError(
            error.message,
            "Failed to schedule the environment to be excluded from the WRP."
          );
          this.exclude.set(!this.exclude());
        },
      });
  }

  private includeInWrp(): void {
    this.shutdownPolicyService
      .includeEnvironmentInShutdownPolicy(this.projectId(), this.allocationId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "The environment is scheduled to be included in the WRP. This may take a few minutes to take effect."
          );
        },
        error: (error) => {
          this.toastMessageService.showError(
            error.message,
            "Failed to schedule the environment to be included in the WRP."
          );
          this.exclude.set(!this.exclude());
        },
      });
  }
}
