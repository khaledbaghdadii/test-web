import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MenuItem } from "primeng/api";
import { SplitButtonModule } from "primeng/splitbutton";
import { TooltipModule } from "primeng/tooltip";
import { Subject, takeUntil } from "rxjs";
import { EnvironmentConfigAuditService } from "../service/environment-config-audit.service";
import {
  ConfigurationLintingExecutionResultStatus,
  RequestResultType,
  RequestStatus,
  SystematicConfigAuditOperationsResponse,
} from "../models/systematic-config-audit.models";
import { ConfigAuditArtifactMenuBuilder } from "../artifacts/config-audit-artifact-menu.builder";

@Component({
  selector: "mxevolve-environment-config-audit-button",
  standalone: true,
  imports: [ButtonModule, SplitButtonModule, TooltipModule],
  templateUrl: "./environment-config-audit-button.component.html",
  providers: [EnvironmentConfigAuditService],
})
export class EnvironmentConfigAuditButtonComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) projectId?: string;
  @Input({ required: true }) environmentId?: string;

  private readonly environmentConfigAuditService = inject(
    EnvironmentConfigAuditService
  );

  loading = false;
  buttonSeverity: "primary" | "success" | "warn" | "danger" = "primary";
  tooltipMessage?: string;
  showDropdown = true;
  dropdownItems: MenuItem[] = [];

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
        error: (error: Error) => {
          this.showDropdown = false;
          this.buttonSeverity = "danger";
          this.tooltipMessage = error.message;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private applyButtonState(
    response: SystematicConfigAuditOperationsResponse
  ): void {
    const requestStatus = response.requestStatus;

    this.tooltipMessage = undefined;
    this.buttonSeverity = "primary";
    this.showDropdown = false;

    if (
      requestStatus === RequestStatus.PENDING ||
      requestStatus === RequestStatus.STARTED
    ) {
      this.tooltipMessage = "This audit is in progress";
    } else if (requestStatus === RequestStatus.INVALID) {
      this.buttonSeverity = "danger";
      this.tooltipMessage =
        "This audit failed : " + response.requestStatusMessage;
    } else if (requestStatus === RequestStatus.ENDED) {
      if (response.requestResultStatus !== RequestResultType.SUCCESS) {
        this.buttonSeverity = "danger";
        this.tooltipMessage =
          "This audit failed : " + response.requestResultMessage;
      } else {
        this.applyLintingResultState(
          response.configurationLintingResult?.resultStatus
        );
      }
      this.showDropdown =
        !!response.configurationLintingResult?.artifacts?.length;
    }

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
    return ConfigAuditArtifactMenuBuilder.buildMenuItems(artifacts);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
