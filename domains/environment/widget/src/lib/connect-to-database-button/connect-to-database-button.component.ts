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
import { MenuItem } from "primeng/api";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ButtonModule } from "primeng/button";
import { TieredMenu } from "primeng/tieredmenu";
import { TooltipModule } from "primeng/tooltip";
import {
  DatabaseEditorService,
  EnvironmentDatabase,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

@Component({
  selector: "mxevolve-connect-to-database-button",
  standalone: true,
  imports: [ButtonModule, TieredMenu, TooltipModule, MxevolveIconComponent],
  providers: [DatabaseEditorService],
  template: `
    <span
      [pTooltip]="disabledTooltip()"
      [tooltipDisabled]="!disabledTooltip()"
      tooltipPosition="top"
    >
      @if (iconOnly()) {
      <p-button
        [text]="true"
        [rounded]="true"
        severity="primary"
        [disabled]="disabled()"
        [loading]="loading()"
        ariaLabel="Connect to DB"
        pTooltip="Connect to DB"
        tooltipPosition="top"
        (onClick)="menu.toggle($event)"
        data-testid="connect-to-db-button"
      >
        <ng-template #icon let-class="class">
          <mxevolve-icon name="database" size="md" [class]="class" />
        </ng-template>
      </p-button>
      } @else {
      <p-button
        [text]="true"
        severity="primary"
        iconPos="right"
        [disabled]="disabled()"
        [loading]="loading()"
        (onClick)="menu.toggle($event)"
        data-testid="connect-to-db-button"
      >
        <span pButtonLabel>Connect to DB</span>
        <mxevolve-icon pButtonIcon name="keyboard_arrow_down" size="sm" />
      </p-button>
      }
    </span>
    <p-tieredmenu
      #menu
      [model]="databaseMenuItems()"
      [popup]="true"
      appendTo="body"
      data-testid="connect-to-db-menu"
    />
  `,
})
export class ConnectToDatabaseButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly databases = input.required<EnvironmentDatabase[]>();
  readonly status = input.required<EnvironmentStatus>();
  readonly iconOnly = input(false);

  readonly connectionError = output<string>();

  private readonly databaseEditorService = inject(DatabaseEditorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingDatabaseConnections = signal<string[]>([]);

  readonly loading = computed(
    () => this.pendingDatabaseConnections().length > 0
  );

  readonly noDatabases = computed(() => this.databases().length === 0);

  readonly disabled = computed(
    () => this.status() !== EnvironmentStatus.READY || this.noDatabases()
  );

  readonly disabledTooltip = computed(() => {
    if (this.noDatabases()) return "No databases available";
    if (this.status() !== EnvironmentStatus.READY)
      return "Environment not ready";
    return "";
  });

  readonly databaseMenuItems = computed<MenuItem[]>(() => {
    const pending = this.pendingDatabaseConnections();
    return this.databases().map((database) => ({
      label:
        database.mxDbTypes.length > 0
          ? database.mxDbTypes.join(" | ")
          : database.name,
      disabled: this.disabled() || pending.includes(database.name),
      command: () => this.connectToDatabase(database.name),
    }));
  });

  connectToDatabase(databaseName: string): void {
    this.pendingDatabaseConnections.update((pending) => [
      ...pending,
      databaseName,
    ]);
    this.databaseEditorService
      .fetchEditorUrl(this.projectId(), this.environmentId(), databaseName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (url) => {
          if (url) {
            window.open(url, "_blank");
          } else {
            this.connectionError.emit(
              `No editor URL returned for database "${databaseName}"`
            );
          }
        },
        complete: () => this.completePendingDatabaseConnection(databaseName),
        error: () => {
          this.completePendingDatabaseConnection(databaseName);
          this.connectionError.emit(
            `Failed to connect to database "${databaseName}"`
          );
        },
      });
  }

  private completePendingDatabaseConnection(databaseName: string): void {
    this.pendingDatabaseConnections.update((pending) =>
      pending.filter((name) => name !== databaseName)
    );
  }
}
