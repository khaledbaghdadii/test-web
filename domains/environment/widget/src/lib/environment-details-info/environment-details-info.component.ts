import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import {
  CommitIdDisplayComponent,
  CopyToClipboardComponent,
  ExpandableMessageComponent,
  MxevolveIconComponent,
} from "@mxevolve/shared/ui/primitive";
import {
  Environment,
  ManagementRequest,
} from "@mxevolve/domains/environment/data-access";
import { Panel } from "primeng/panel";
import { Divider } from "primeng/divider";

interface EnvironmentDeploymentContext {
  source: string;
  details: string;
}

@Component({
  selector: "mxevolve-environment-details-info",
  standalone: true,
  imports: [
    RouterLink,
    Tag,
    Tooltip,
    CommitIdDisplayComponent,
    CopyToClipboardComponent,
    ExpandableMessageComponent,
    MxevolveIconComponent,
    Panel,
    Divider,
  ],
  templateUrl: "./environment-details-info.component.html",
})
export class EnvironmentDetailsInfoComponent {
  readonly environment = input.required<Environment>();
  readonly projectId = input.required<string>();
  readonly latestRequest = input<ManagementRequest | undefined>(undefined);

  readonly definitionName = computed(
    () => this.environment().environmentDefinition?.name ?? "-"
  );

  readonly maintenanceLabel = computed(() =>
    this.environment().maintenance?.full ? "full" : "custom"
  );

  readonly infraAllocationLink = computed(() => {
    const allocationId = this.environment().allocationId;
    return allocationId
      ? `/app/${this.projectId()}/infra/allocations/${allocationId}`
      : null;
  });

  readonly deploymentContext = computed(() =>
    this.getEnvironmentDeploymentContext(this.environment())
  );

  readonly errorReason = computed(() => {
    const request = this.latestRequest();
    if (!request || !this.isStatusClickable(request)) {
      return null;
    }
    if (request.status === "ENDED") {
      return request.resultMessage ?? "No details available";
    }
    return request.statusMessage ?? "No details available";
  });

  private isStatusClickable(request: ManagementRequest): boolean {
    if (request.status === "ENDED" && request.resultMessage) {
      return true;
    }
    return !!(request.statusMessage && request.statusMessage.trim() !== "");
  }

  private getEnvironmentDeploymentContext(
    environment: Environment
  ): EnvironmentDeploymentContext | undefined {
    const environmentSource = environment.environmentSource;
    if (environmentSource) {
      return {
        source: environmentSource,
        details:
          environmentSource === "POOL"
            ? "The environment is ready & requires only a delta import"
            : "",
      };
    }

    const deploymentMode = environment.environmentDeploymentMode;
    if (deploymentMode === null || deploymentMode === undefined) {
      return undefined;
    }

    switch (deploymentMode) {
      case "DB_SNAPSHOT_FROM_DUMPS":
        return {
          source: "DUMP SNAPSHOT",
          details:
            "The database is loaded from the snapshot created using the dump files",
        };
      case "DB_SNAPSHOT_FROM_ENVIRONMENT_SNAPSHOT":
        return {
          source: "DATABASE SNAPSHOT",
          details: "The database is loaded from the environment snapshot",
        };
      case "DUMPS_FROM_ENVIRONMENT_SNAPSHOT":
        return {
          source: "DATABASE SNAPSHOT (DUMP)",
          details:
            "The database is loaded from the dump of the environment snapshot",
        };
      case "ENVIRONMENT_SNAPSHOT":
        return {
          source: "SNAPSHOT",
          details: "Database is created & loaded via FDP",
        };
      case "VANILLA":
      default:
        return {
          source: "VANILLA",
          details: "The database is loaded from the dump files",
        };
    }
  }
}
