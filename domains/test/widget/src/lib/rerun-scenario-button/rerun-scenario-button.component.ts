import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { APP_CONFIG } from "@mxflow/config";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { RepushPermission } from "@mxevolve/domains/test/model";
import { RerunDialogComponent } from "../rerun-dialog/rerun-dialog.component";

@Component({
  selector: "mxevolve-rerun-scenario-button",
  imports: [Button, TooltipModule, MxevolveIconComponent, RerunDialogComponent],
  providers: [
    ScenarioRunService,
    {
      provide: GATEWAY_CONFIG,
      useFactory: () => ({ gatewayUrl: inject(APP_CONFIG).gatewayUrl }),
    },
    FactoryProductApiService,
  ],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      size="small"
      ariaLabel="Rerun scenario"
      [pTooltip]="rerunTooltip()"
      tooltipPosition="top"
      (click)="openModal(); $event.stopPropagation()"
      [loading]="loading"
      [disabled]="disabled()"
    >
      <mxevolve-icon name="refresh" />
    </p-button>
    <mxevolve-rerun-dialog
      [(visible)]="showModal"
      [projectId]="projectId()"
      [factoryProductId]="factoryProductId()"
      [warningMessage]="resolvedWarning()"
      [loading]="loading"
      (rerunRequested)="onRerunRequested($event)"
    />
  `,
})
export class RerunScenarioButtonComponent implements OnInit {
  projectId = input.required<string>();
  scenarioRunId = input.required<string>();
  factoryProductId = input<string>();
  executionGroupId = input<string>();
  warningMessage = input<string>();
  warningMessageMap = input<Record<string, string>>();
  repushable = input(true);
  repushAllowed = input(true);

  scenarioRerun = output<void>();

  private readonly repushPermission = signal<RepushPermission | undefined>(
    undefined
  );
  disabled = computed(
    () =>
      !this.repushable() ||
      !this.repushAllowed() ||
      (this.repushPermission() !== undefined &&
        !this.repushPermission()!.actionAllowed)
  );
  resolvedWarning = computed(() => {
    if (this.warningMessage()) return this.warningMessage();
    const warning = this.repushPermission()?.warnings?.[0];
    if (!warning) return undefined;
    return this.warningMessageMap()?.[warning] ?? warning;
  });
  rerunTooltip = computed(() => {
    const permission = this.repushPermission();
    if (
      permission &&
      !permission.actionAllowed &&
      permission.rejectionReasons?.length
    ) {
      return this.mapRejectionReasons(permission.rejectionReasons);
    }
    return "Rerun";
  });

  showModal = false;
  loading = false;

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly toastMessageService = inject(ToastMessageService);

  ngOnInit() {
    const executionGroupId = this.executionGroupId();
    if (executionGroupId) {
      this.scenarioRunService
        .isRepushAllowed(
          this.projectId(),
          executionGroupId,
          this.scenarioRunId()
        )
        .subscribe({
          next: (permission) => this.repushPermission.set(permission),
        });
    }
  }

  openModal() {
    this.showModal = true;
  }

  onRerunRequested(event: { factoryProductId: string; commitId?: string }) {
    this.loading = true;
    this.scenarioRunService
      .rerunScenarioFromFactoryProduct(this.projectId(), this.scenarioRunId(), {
        factoryProductId: event.factoryProductId,
        commitId: event.commitId,
        executionGroupId: this.executionGroupId(),
      })
      .subscribe({
        next: () => {
          this.showModal = false;
          this.loading = false;
          this.toastMessageService.showSuccess(
            "Scenario rerun requested successfully."
          );
          this.scenarioRerun.emit();
        },
        error: () => {
          this.loading = false;
          this.toastMessageService.showError("Failed to rerun scenario.");
        },
      });
  }

  private static readonly REJECTION_REASON_MESSAGES: Record<string, string> = {
    LIMIT_REACHED: "Concurrent scenario executions limit has been reached",
    OUTER_CONTEXT_DISALLOWED_ACTIONS: "",
    UNDERWAY_SCENARIO: "",
  };

  private mapRejectionReasons(reasons: string[]): string {
    const mapped = reasons
      .map(
        (r) => RerunScenarioButtonComponent.REJECTION_REASON_MESSAGES[r] ?? ""
      )
      .filter(Boolean)
      .join("; ");
    return mapped || "Rerun";
  }
}
