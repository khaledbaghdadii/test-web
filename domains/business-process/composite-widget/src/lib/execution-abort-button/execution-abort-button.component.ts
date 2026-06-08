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
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import {
  ToastMessageService,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import { ExecutionAbortService } from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionStatus,
  ExecutionFamily,
} from "@mxevolve/domains/business-process/util";
import {
  DeleteDevelopmentCheckboxComponent,
  DeleteDevelopmentValue,
} from "@mxevolve/domains/business-process/widget";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Component({
  selector: "mxevolve-execution-abort-button",
  imports: [
    Button,
    Tooltip,
    ConfirmDialog,
    MxevolveIconComponent,
    DeleteDevelopmentCheckboxComponent,
    ReactiveFormsModule,
  ],
  providers: [ExecutionAbortService],
  templateUrl: "./execution-abort-button.component.html",
})
export class ExecutionAbortButtonComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly status = input.required<ExecutionStatus>();
  readonly familyId = input.required<ExecutionFamily>();

  readonly aborted = output<void>();

  private readonly abortService = inject(ExecutionAbortService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly analyticsTracker = inject(AnalyticsTrackerService);

  readonly deleteDevelopmentControl =
    new FormControl<DeleteDevelopmentValue | null>(null);

  private readonly isAborting = signal(false);

  readonly isLoading = computed(() => this.isAborting());

  readonly executionNotAbortable = computed(() => {
    const currentStatus = this.status();
    return (
      currentStatus !== ExecutionStatus.RUNNING &&
      currentStatus !== ExecutionStatus.PENDING_INPUT
    );
  });

  readonly confirmDialogKey = computed(
    () => `${this.processId()}-abort-bp-dialog`
  );

  openAbortDialog(event: Event): void {
    this.deleteDevelopmentControl.reset();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      key: this.confirmDialogKey(),
      header: "Abort Business Process Execution",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Abort",
        severity: "danger",
      },
      accept: () => this.abortBusinessProcess(),
    });
  }

  abortBusinessProcess(): void {
    this.isAborting.set(true);
    this.abortService
      .abort({
        projectId: this.projectId(),
        processId: this.processId(),
        shouldCleanDevelopment:
          this.deleteDevelopmentControl.value?.shouldDelete ?? false,
        developmentId: this.deleteDevelopmentControl.value?.developmentId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            "Business process execution successfully aborted"
          );
          this.analyticsTracker.trackEvent(
            EventCategory.BUTTON,
            EventAction.CLICK_BUTTON,
            `Abort Business Process - ${this.familyId()}`
          );
          this.aborted.emit();
          this.isAborting.set(false);
        },
        error: (error: { message: string }) => {
          this.toastService.showError(error.message);
          this.isAborting.set(false);
        },
      });
  }
}
