import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MenuItem } from "primeng/api";
import { SplitButtonModule } from "primeng/splitbutton";
import { TooltipModule } from "primeng/tooltip";
import { DialogModule } from "primeng/dialog";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { Subject, takeUntil } from "rxjs";
import {
  ConfigurationLintingExecutionResultStatus,
  EnvironmentConfigAuditService,
  RequestResultType,
  RequestStatus,
  SystematicConfigAuditOperationsResponse,
} from "@mxevolve/domains/environment/data-access";
import { ArtifactsMenuBuilder } from "@mxevolve/domains/environment/util";

type ButtonSeverity = "primary" | "success" | "warn" | "danger";

const STATUS_ICON_MAP: Record<ButtonSeverity, string> = {
  primary: "pi pi-clock",
  success: "pi pi-check-circle",
  warn: "pi pi-exclamation-triangle",
  danger: "pi pi-times-circle",
};

@Component({
  selector: "mxevolve-environment-config-audit-status-button",
  standalone: true,
  imports: [
    ButtonModule,
    SplitButtonModule,
    TooltipModule,
    DialogModule,
    MxevolveIconComponent,
  ],
  templateUrl: "./environment-config-audit-status-button.component.html",
  providers: [EnvironmentConfigAuditService],
})
export class EnvironmentConfigAuditStatusButtonComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) projectId?: string;
  @Input({ required: true }) environmentId?: string;

  private readonly environmentConfigAuditService = inject(
    EnvironmentConfigAuditService
  );

  loading = false;
  visible = false;
  buttonSeverity: ButtonSeverity = "primary";
  icon = STATUS_ICON_MAP.primary;
  tooltipMessage?: string;
  showDropdown = true;
  dropdownItems: MenuItem[] = [];
  detailsMessage?: string;
  dialogVisible = false;

  ngOnInit(): void {
    this.retrieveAuditStatus();
  }

  private retrieveAuditStatus(): void {
    this.loading = true;
    this.environmentConfigAuditService
      .retrieveSystematicConfigAudits(this.projectId!, this.environmentId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.applyButtonState(response),
        error: () => {
          this.visible = false;
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private applyButtonState(
    response: SystematicConfigAuditOperationsResponse | null
  ): void {
    this.tooltipMessage = undefined;
    this.buttonSeverity = "primary";
    this.icon = STATUS_ICON_MAP.primary;
    this.showDropdown = false;
    this.detailsMessage = undefined;

    if (!response) {
      this.visible = false;
      return;
    }

    this.visible = true;
    const requestStatus = response.requestStatus;

    if (
      requestStatus === RequestStatus.PENDING ||
      requestStatus === RequestStatus.STARTED
    ) {
      this.tooltipMessage = "This audit is in progress";
    } else if (requestStatus === RequestStatus.INVALID) {
      this.buttonSeverity = "danger";
      this.detailsMessage = response.requestStatusMessage || undefined;
    } else if (requestStatus === RequestStatus.ENDED) {
      if (response.requestResultStatus !== RequestResultType.SUCCESS) {
        this.buttonSeverity = "danger";
        this.detailsMessage = response.requestResultMessage || undefined;
      } else {
        this.applyLintingResultState(
          response.configurationLintingResult?.resultStatus
        );
        this.detailsMessage =
          response.configurationLintingResult?.resultMessage || undefined;
      }
      this.showDropdown =
        !!response.configurationLintingResult?.artifacts?.length;
    }

    this.icon = STATUS_ICON_MAP[this.buttonSeverity];

    if (this.showDropdown) {
      this.dropdownItems = this.buildDropdownItems(response);
    }
  }

  private applyLintingResultState(
    lintingResultStatus?: ConfigurationLintingExecutionResultStatus
  ): void {
    if (lintingResultStatus === "PASS") {
      this.buttonSeverity = "success";
      this.tooltipMessage = "This audit passed without violations.";
    } else if (lintingResultStatus === "WARNING") {
      this.buttonSeverity = "warn";
      this.tooltipMessage =
        "This audit passed with warnings. Click to access reports";
    } else if (lintingResultStatus === "FAIL") {
      this.buttonSeverity = "danger";
      this.tooltipMessage = "This audit failed. Click to access reports";
    }
  }

  private buildDropdownItems(
    response: SystematicConfigAuditOperationsResponse
  ): MenuItem[] {
    const artifacts = response.configurationLintingResult?.artifacts ?? [];
    return ArtifactsMenuBuilder.buildMenuItems(artifacts);
  }

  openDetailsDialog(event?: Event): void {
    event?.stopPropagation();
    this.dialogVisible = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
