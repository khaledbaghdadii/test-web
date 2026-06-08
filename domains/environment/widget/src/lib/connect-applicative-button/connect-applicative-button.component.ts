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
import { finalize } from "rxjs";
import { MenuItem } from "primeng/api";
import { NgTemplateOutlet } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { TieredMenu } from "primeng/tieredmenu";
import { TooltipModule } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  ApplicationConnectionService,
  Applicative,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { PuttyConfigurationDialogComponent } from "./putty-configuration-dialog.component";

@Component({
  selector: "mxevolve-connect-applicative-button",
  standalone: true,
  imports: [
    ButtonModule,
    TieredMenu,
    TooltipModule,
    NgTemplateOutlet,
    MxevolveIconComponent,
    PuttyConfigurationDialogComponent,
  ],
  providers: [ApplicationConnectionService],
  templateUrl: "./connect-applicative-button.component.html",
})
export class ConnectApplicativeButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly status = input.required<EnvironmentStatus>();
  readonly primaryApplicative = input<Applicative | undefined>();
  readonly secondaryApplicatives = input<Applicative[]>([]);
  readonly iconOnly = input(false);

  readonly connectionError = output<Error>();

  private readonly applicationConnectionService = inject(
    ApplicationConnectionService
  );
  private readonly destroyRef = inject(DestroyRef);

  readonly puttyConfigurationDialogVisible = signal(false);
  readonly loading = signal(false);

  readonly disabled = computed(
    () =>
      this.status() !== EnvironmentStatus.READY &&
      this.status() !== EnvironmentStatus.BROKEN
  );

  readonly hasApplicatives = computed(() => !!this.primaryApplicative());

  readonly menuItems = computed<MenuItem[]>(() => {
    const primary = this.primaryApplicative();
    const secondaries = this.secondaryApplicatives();
    const isDisabled = this.disabled();

    if (!primary) return [];

    const allApplicatives = [primary, ...secondaries];
    return allApplicatives.map((applicative, index) => ({
      label:
        applicative.allocation.machine?.name ??
        (index === 0 ? "Primary" : `Secondary ${index}`),
      disabled: isDisabled,
      items: this.buildConnectionMenuItems(
        applicative.allocation.machine?.id,
        isDisabled
      ),
    }));
  });

  handleSshConnection(machineId?: string): void {
    this.loading.set(true);
    this.applicationConnectionService
      .fetchSshConnectionUrl(this.projectId(), this.environmentId(), machineId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (connection) => window.open(connection.connectionUrl, "_blank"),
        error: (error) => this.connectionError.emit(error),
      });
  }

  handleScpConnection(machineId?: string): void {
    this.loading.set(true);
    this.applicationConnectionService
      .fetchScpConnectionUrl(this.projectId(), this.environmentId(), machineId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (connection) => window.open(connection.connectionUrl, "_blank"),
        error: (error) => this.connectionError.emit(error),
      });
  }

  private buildConnectionMenuItems(
    machineId: string | undefined,
    isDisabled: boolean
  ): MenuItem[] {
    return [
      {
        label: "Connect SSH",
        id: "connect-ssh",
        disabled: isDisabled,
        showSettings: true,
        command: () => this.handleSshConnection(machineId),
      },
      {
        label: "Connect WinSCP",
        id: "connect-winscp",
        disabled: isDisabled,
        command: () => this.handleScpConnection(machineId),
      },
    ];
  }
}
