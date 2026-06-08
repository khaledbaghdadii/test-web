import { NgClass } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import {
  Environment,
  EnvironmentAction,
  EnvironmentsState,
  EnvironmentStatus,
  retrieveEnvironment,
  selectEnvironment,
} from "@mxflow/features/environment";
import { Store } from "@ngrx/store";
import {
  ConfirmationService,
  MenuItem,
  MenuItemCommandEvent,
  MessageService,
} from "primeng/api";
import { ConfirmPopup } from "primeng/confirmpopup";
import { SplitButton } from "primeng/splitbutton";
import { TieredMenu } from "primeng/tieredmenu";
import { Toast } from "primeng/toast";
import { ToggleSwitch, ToggleSwitchChangeEvent } from "primeng/toggleswitch";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { EnvironmentActionsService } from "./environment-actions-service";
import { ViewEnvironmentServicesComponent } from "./view-environment-services.component";

@Component({
  selector: "mxevolve-service-actions-button",
  templateUrl: "./service-actions-button.component.html",
  standalone: true,
  imports: [
    ConfirmPopup,
    Toast,
    SplitButton,
    TieredMenu,
    ToggleSwitch,
    FormsModule,
    ViewEnvironmentServicesComponent,
    NgClass,
  ],
})
export class ServiceActionsButtonComponent implements OnChanges, OnDestroy {
  private readonly destroy$ = new Subject();
  items: MenuItem[];

  @Input() projectId!: string;
  @Input() environmentId!: string;

  @Output() startEnvironmentRequestedSuccessfully = new EventEmitter<void>();
  @Output() stopEnvironmentRequestedSuccessfully = new EventEmitter<void>();

  startEnvironmentPopupKey = "startEnvironmentPopupKey";
  disabled: boolean = true;

  viewTooltip: string | undefined;
  viewOpen = false;
  viewDisabled: boolean = true;

  EXCLUDE_FROM_DAILY_SHUTDOWN_FEATURE =
    "exclude-envs-from-stop-services-shutdown";
  excludeFeatureEnabled = false;
  excludeFromDailyShutdown = false;
  excludeDisabled = true;
  allowedStatusesForExclusion = [
    EnvironmentStatus.PREPARING,
    EnvironmentStatus.READY,
    EnvironmentStatus.EXECUTING,
    EnvironmentStatus.BROKEN,
  ];

  @ViewChild("tieredMenu") tieredMenu: TieredMenu;

  store = inject(Store<EnvironmentsState>);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  environmentActionsService = inject(EnvironmentActionsService);
  featureFlagResolver = inject(FeatureFlagResolver);

  onButtonClick(e: MouseEvent) {
    this.tieredMenu.toggle(e);
  }

  shiftOverlay() {
    setTimeout(() => {
      const overlay = document.querySelector(
        ".p-tieredmenu-overlay"
      ) as HTMLElement;
      const dropdown = document.querySelector(
        ".p-splitbutton-dropdown"
      ) as HTMLElement;
      if (overlay && dropdown) {
        const left =
          overlay.offsetLeft - overlay.offsetWidth + dropdown.offsetWidth;
        overlay.style.left = `${left}px`;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.projectId && this.environmentId) {
      this.fetchEnvironment();
      this.featureFlagResolver
        .isFeatureEnabled(
          this.projectId,
          this.EXCLUDE_FROM_DAILY_SHUTDOWN_FEATURE
        )
        .then((excludeEnabled) => {
          if (excludeEnabled) {
            this.excludeFeatureEnabled = true;
          }
          this.refreshMenuItems();
        });
    }
  }

  private fetchEnvironment() {
    this.store
      .select(
        selectEnvironment({
          projectId: this.projectId,
          environmentId: this.environmentId,
        })
      )
      .pipe(
        skipWhile((env) => env === undefined),
        takeUntil(this.destroy$)
      )
      .subscribe((environment) => {
        this.excludeFromDailyShutdown = !!environment?.excludeFromShutdown;
        if (environment?.status === EnvironmentStatus.READY) {
          this.disabled = false;
        }

        if (environment?.status !== EnvironmentStatus.READY) {
          this.viewTooltip = "Environment is not in a ready state.";
        } else if (!this.isViewEnabled(environment)) {
          this.viewTooltip = "Functionality available starting from v3.1.63.";
        } else {
          this.viewDisabled = false;
        }

        if (
          environment?.status &&
          this.allowedStatusesForExclusion.includes(environment.status)
        ) {
          this.excludeDisabled = false;
        }
      });
  }

  private refreshMenuItems() {
    this.items = [
      {
        label: "Start",
        icon: "pi pi-play",
        disabled: this.disabled,
        command: (event: MenuItemCommandEvent) => {
          event.originalEvent?.stopPropagation();
          this.onStartClicked(event.originalEvent as MouseEvent);
        },
      },
      {
        label: "Stop",
        icon: "pi pi-stop-circle",
        disabled: this.disabled,
        command: (event: MenuItemCommandEvent) => {
          event.originalEvent?.stopPropagation();
          this.onStopClicked();
        },
      },
      {
        label: "View",
        icon: "pi pi-table",
        viewDisabled: this.viewDisabled,
        tooltip: this.viewTooltip,
        tooltipOptions: {
          tooltipLabel: this.viewTooltip,
        },
        command: this.viewDisabled ? undefined : () => this.onViewClicked(),
      },
      { separator: true, visible: this.excludeFeatureEnabled },
      {
        label: this.excludeFromDailyShutdown
          ? "Excluded from daily shutdown"
          : "Included in daily shutdown",
        type: "toggle",
        visible: this.excludeFeatureEnabled,
      },
    ];
  }

  onStartClicked = (event: MouseEvent) => {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      key: this.startEnvironmentPopupKey,
      message: "Are you sure you want to start the environment?",
      icon: "pi pi-info-circle",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        severity: "info",
      },
      accept: () => {
        this.startEnvironment();
      },
    });
  };

  startEnvironment() {
    this.environmentActionsService
      .startEnvironment(this.projectId, this.environmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleEnvironmentActionSuccess(
            "The request to start the environment was sent successfully"
          );
        },
        error: (err: Error) => {
          this.handleEnvironmentActionFailure(
            err.message,
            "The request to start the environment failed"
          );
        },
      });
  }

  onStopClicked = () => {
    this.environmentActionsService
      .stopEnvironment(this.projectId, this.environmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleEnvironmentActionSuccess(
            "The request to stop the environment was sent successfully"
          );
        },
        error: (err: Error) => {
          this.handleEnvironmentActionFailure(
            err.message,
            "The request to stop the environment failed"
          );
        },
      });
  };

  private isViewEnabled(environment: Environment) {
    return (
      environment.environmentActions?.includes(
        EnvironmentAction.MONITOR_SERVICES
      ) ?? false
    );
  }

  onViewClicked() {
    this.viewDisabled = true;
    this.viewOpen = true;
    this.refreshMenuItems();
  }

  servicesLoaded(event: { error?: string; summary?: string }) {
    if (event?.error && event?.summary) {
      this.handleEnvironmentActionFailure(event?.error, event?.summary);
    }
    this.viewDisabled = false;
    this.refreshMenuItems();
  }

  onViewClosed() {
    this.viewOpen = false;
    this.viewDisabled = false;
    this.refreshMenuItems();
  }

  onExcludeToggled(event: ToggleSwitchChangeEvent) {
    const isExcluded = !event.checked;
    this.environmentActionsService
      .excludeEnvironmentFromDailyShutdown(
        this.projectId,
        this.environmentId,
        isExcluded
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const message = isExcluded
            ? "The environment is now excluded from daily shutdown"
            : "The environment is now included in daily shutdown";
          this.handleEnvironmentActionSuccess(message);
          this.excludeFromDailyShutdown = isExcluded;
          this.store.dispatch(
            retrieveEnvironment({
              projectId: this.projectId,
              id: this.environmentId,
            })
          );
        },
        error: (err: Error) => {
          const summary = isExcluded
            ? "Excluding the environment from daily shutdown failed"
            : "Including the environment in daily shutdown failed";
          this.handleEnvironmentActionFailure(err.message, summary);
        },
        complete: () => {
          this.refreshMenuItems();
        },
      });
  }

  handleEnvironmentActionSuccess(detail: string) {
    this.messageService.add({
      severity: "success",
      summary: "Success",
      detail: detail,
    });
    this.startEnvironmentRequestedSuccessfully.emit();
  }

  handleEnvironmentActionFailure(errorMessage: string, summary: string) {
    this.messageService.add({
      severity: "error",
      summary: summary,
      detail: errorMessage,
    });
  }
}
