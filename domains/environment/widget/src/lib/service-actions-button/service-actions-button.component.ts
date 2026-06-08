import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ConfirmationService, MenuItem } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { TieredMenu } from "primeng/tieredmenu";
import { ToggleSwitch } from "primeng/toggleswitch";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { TooltipModule } from "primeng/tooltip";
import { ServiceActionsService } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ViewEnvironmentServicesDialogComponent } from "./view-environment-services-dialog.component";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

const TOGGLE_ENABLED_STATUSES: ReadonlySet<EnvironmentStatus> = new Set([
  EnvironmentStatus.PREPARING,
  EnvironmentStatus.READY,
  EnvironmentStatus.EXECUTING,
  EnvironmentStatus.BROKEN,
]);

const EXCLUDE_FROM_DAILY_SHUTDOWN_FEATURE =
  "exclude-envs-from-stop-services-shutdown";

@Component({
  selector: "mxevolve-service-actions-button",
  standalone: true,
  imports: [
    ButtonModule,
    TieredMenu,
    NgTemplateOutlet,
    ConfirmDialog,
    ToggleSwitch,
    FormsModule,
    MxevolveIconComponent,
    TooltipModule,
    ViewEnvironmentServicesDialogComponent,
  ],
  providers: [ConfirmationService, ServiceActionsService, FeatureFlagResolver],
  templateUrl: "./service-actions-button.component.html",
})
export class ServiceActionsButtonComponent implements OnInit {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly status = input.required<EnvironmentStatus>();
  readonly excludeFromShutdown = input<boolean>(false);
  readonly environmentActions = input<string[]>([]);
  readonly iconOnly = input(false);

  readonly environmentChanged = output<void>();

  private readonly confirmationService = inject(ConfirmationService);
  private readonly serviceActionsService = inject(ServiceActionsService);
  private readonly toastService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  readonly confirmKey = "service-actions-confirm";
  readonly viewServicesDialogVisible = signal(false);
  readonly loading = signal(false);
  readonly excludeFeatureEnabled = signal(false);

  readonly viewDisabled = computed(
    () =>
      this.status() !== EnvironmentStatus.READY ||
      !this.environmentActions().includes("MONITOR_SERVICES")
  );

  readonly viewTooltip = computed(() => {
    if (this.status() !== EnvironmentStatus.READY) {
      return "Environment is not in a ready state.";
    }
    if (!this.environmentActions().includes("MONITOR_SERVICES")) {
      return "Functionality available starting from v3.1.63.";
    }
    return undefined;
  });

  readonly toggleDisabled = computed(
    () => !TOGGLE_ENABLED_STATUSES.has(this.status())
  );

  readonly menuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        id: "start",
        label: "Start",
        disabled: this.status() !== EnvironmentStatus.READY,
        command: () => this.handleStart(),
      } as MenuItem,
      {
        id: "stop",
        label: "Stop",
        disabled: this.status() !== EnvironmentStatus.READY,
        command: () => this.handleStop(),
      } as MenuItem,
      {
        id: "view",
        label: "View",
        tooltip: this.viewTooltip(),
        tooltipOptions: this.viewTooltip()
          ? { tooltipPosition: "left" }
          : undefined,
        command: this.viewDisabled() ? undefined : () => this.handleView(),
      } as MenuItem,
    ];

    if (this.excludeFeatureEnabled()) {
      items.push({ separator: true }, {
        id: "toggle-shutdown",
        label: this.excludeFromShutdown()
          ? "Include in daily shutdown"
          : "Exclude from daily shutdown",
        type: "toggle",
      } as MenuItem & { type: string });
    }

    return items;
  });

  ngOnInit(): void {
    void this.loadExcludeFromShutdownFeatureFlag();
  }

  private async loadExcludeFromShutdownFeatureFlag(): Promise<void> {
    try {
      this.excludeFeatureEnabled.set(
        await this.featureFlagResolver.isFeatureEnabled(
          this.projectId(),
          EXCLUDE_FROM_DAILY_SHUTDOWN_FEATURE
        )
      );
    } catch {
      this.excludeFeatureEnabled.set(false);
    }
  }

  handleStart(): void {
    this.confirmationService.confirm({
      key: this.confirmKey,
      header: "Start Environment Services",
      message: "Are you sure you want to start the environment services?",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Start",
      },
      accept: () => {
        this.loading.set(true);
        this.serviceActionsService
          .startEnvironment(this.projectId(), this.environmentId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toastService.showSuccess(
                "Environment services start request submitted successfully"
              ),
            error: (error: Error) => {
              this.loading.set(false);
              this.toastService.showError(error.message);
            },
            complete: () => this.loading.set(false),
          });
      },
    });
  }

  handleStop(): void {
    this.confirmationService.confirm({
      key: this.confirmKey,
      header: "Stop Environment Services",
      message: "Are you sure you want to stop the environment services?",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Stop",
        severity: "danger",
      },
      accept: () => {
        this.loading.set(true);
        this.serviceActionsService
          .stopEnvironment(this.projectId(), this.environmentId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toastService.showSuccess(
                "Environment services stop request submitted successfully"
              ),
            error: (error: Error) => {
              this.loading.set(false);
              this.toastService.showError(error.message);
            },
            complete: () => this.loading.set(false),
          });
      },
    });
  }

  handleView(): void {
    this.viewServicesDialogVisible.set(true);
  }

  handleToggle(checked: boolean): void {
    this.serviceActionsService
      .excludeFromDailyShutdown(
        this.projectId(),
        this.environmentId(),
        !checked
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            checked
              ? "Environment included in daily shutdown"
              : "Environment excluded from daily shutdown"
          );
          this.environmentChanged.emit();
        },
        error: (error: Error) => this.toastService.showError(error.message),
      });
  }
}
