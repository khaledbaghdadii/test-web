import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { SplitButtonModule } from "primeng/splitbutton";
import { TooltipModule } from "primeng/tooltip";
import { MenuItem } from "primeng/api";
import {
  ConfigurationLintingResultStatus,
  SystematicConfigAuditOperationsResponse,
  SystematicConfigAuditRequestResultType,
  SystematicConfigAuditRequestStatus,
  SystematicConfigAuditService,
} from "@mxevolve/domains/environment/data-access";
import { buildConfigAuditArtifactMenuItems } from "./config-audit-artifact-menu.builder";

type ButtonSeverity = "primary" | "success" | "warn" | "danger";

interface ConfigAuditButtonState {
  severity: ButtonSeverity;
  tooltip?: string;
  showDropdown: boolean;
  dropdownItems: MenuItem[];
}

const INITIAL_STATE: ConfigAuditButtonState = {
  severity: "primary",
  tooltip: undefined,
  showDropdown: false,
  dropdownItems: [],
};

/**
 * Config Audit split-button. Fetches the latest systematic-config-audit for the
 * environment and renders a colored button whose severity/icon reflect the
 * audit status; when artifacts are available it becomes a split-button with a
 * CSV Report / HTML Report dropdown. Ported to signals from the legacy
 * ci-process-mfe EnvironmentConfigAuditButtonComponent.
 */
@Component({
  selector: "mxevolve-config-audit-button",
  imports: [ButtonModule, SplitButtonModule, TooltipModule],
  templateUrl: "./config-audit-button.component.html",
  providers: [SystematicConfigAuditService],
  host: {
    style: "display: contents;",
  },
})
export class ConfigAuditButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();

  private readonly service = inject(SystematicConfigAuditService);

  private readonly audit = rxResource({
    params: () => ({
      projectId: this.projectId(),
      environmentId: this.environmentId(),
    }),
    stream: ({ params }) =>
      this.service.retrieveSystematicConfigAudit(
        params.projectId,
        params.environmentId
      ),
  });

  readonly loading = computed(() => this.audit.isLoading());

  private readonly state = computed<ConfigAuditButtonState>(() => {
    if (this.audit.status() === "error") {
      return {
        severity: "danger",
        tooltip: this.audit.error()?.message,
        showDropdown: false,
        dropdownItems: [],
      };
    }
    if (!this.audit.hasValue()) {
      return INITIAL_STATE;
    }
    return this.resolveState(this.audit.value());
  });

  readonly severity = computed(() => this.state().severity);
  readonly tooltip = computed(() => this.state().tooltip);
  readonly showDropdown = computed(() => this.state().showDropdown);
  readonly dropdownItems = computed(() => this.state().dropdownItems);

  private resolveState(
    response: SystematicConfigAuditOperationsResponse
  ): ConfigAuditButtonState {
    const requestStatus = response.requestStatus;

    if (
      requestStatus === SystematicConfigAuditRequestStatus.PENDING ||
      requestStatus === SystematicConfigAuditRequestStatus.STARTED
    ) {
      return {
        severity: "primary",
        tooltip: "This audit is in progress",
        showDropdown: false,
        dropdownItems: [],
      };
    }

    if (requestStatus === SystematicConfigAuditRequestStatus.INVALID) {
      return {
        severity: "danger",
        tooltip: "This audit failed : " + response.requestStatusMessage,
        showDropdown: false,
        dropdownItems: [],
      };
    }

    // ENDED
    if (
      response.requestResultStatus !==
      SystematicConfigAuditRequestResultType.SUCCESS
    ) {
      return {
        severity: "danger",
        tooltip: "This audit failed : " + response.requestResultMessage,
        showDropdown: false,
        dropdownItems: [],
      };
    }

    const lintingState = this.resolveLintingState(
      response.configurationLintingResult?.resultStatus
    );
    const artifacts = response.configurationLintingResult?.artifacts ?? [];
    const showDropdown = artifacts.length > 0;

    return {
      severity: lintingState.severity,
      tooltip: lintingState.tooltip,
      showDropdown,
      dropdownItems: showDropdown
        ? buildConfigAuditArtifactMenuItems(artifacts)
        : [],
    };
  }

  private resolveLintingState(
    resultStatus?: ConfigurationLintingResultStatus
  ): { severity: ButtonSeverity; tooltip?: string } {
    switch (resultStatus) {
      case "PASS":
        return {
          severity: "success",
          tooltip: "This audit passed without violations.",
        };
      case "WARNING":
        return {
          severity: "warn",
          tooltip: "This audit passed with warnings. Click to access reports",
        };
      case "FAIL":
        return {
          severity: "danger",
          tooltip: "This audit failed. Click to access reports",
        };
      default:
        return { severity: "primary", tooltip: undefined };
    }
  }
}
