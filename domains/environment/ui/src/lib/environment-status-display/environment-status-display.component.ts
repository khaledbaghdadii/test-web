import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

interface StatusTagConfiguration {
  label: string;
  severity: "success" | "info" | "danger" | "secondary";
  icon: string;
}

@Component({
  selector: "mxevolve-environment-status-display",
  standalone: true,
  imports: [Tag, MxevolveIconComponent],
  template: `
    <p-tag [severity]="configuration().severity" [rounded]="true">
      <div class="flex items-center gap-1 text-sm">
        <mxevolve-icon [name]="configuration().icon" size="sm" />
        <span>{{ configuration().label }}</span>
      </div>
    </p-tag>
  `,
})
export class EnvironmentStatusDisplayComponent {
  private static readonly CONFIGURATIONS: Record<
    EnvironmentStatus,
    StatusTagConfiguration
  > = {
    [EnvironmentStatus.CREATED]: {
      label: "Created",
      severity: "success",
      icon: "check_circle",
    },
    [EnvironmentStatus.CONFIG_VALID]: {
      label: "Config Valid",
      severity: "success",
      icon: "check_circle",
    },
    [EnvironmentStatus.READY]: {
      label: "Ready",
      severity: "success",
      icon: "check_circle",
    },
    [EnvironmentStatus.CONFIG_INVALID]: {
      label: "Config Invalid",
      severity: "danger",
      icon: "cancel",
    },
    [EnvironmentStatus.PREPARATION_FAILED]: {
      label: "Preparation Failed",
      severity: "danger",
      icon: "cancel",
    },
    [EnvironmentStatus.BROKEN]: {
      label: "Broken",
      severity: "danger",
      icon: "cancel",
    },
    [EnvironmentStatus.PREPARING]: {
      label: "Preparing",
      severity: "info",
      icon: "access_time",
    },
    [EnvironmentStatus.EXECUTING]: {
      label: "Executing",
      severity: "info",
      icon: "access_time",
    },
    [EnvironmentStatus.CLEANING]: {
      label: "Cleaning",
      severity: "secondary",
      icon: "access_time",
    },
    [EnvironmentStatus.CLEANED]: {
      label: "Cleaned",
      severity: "secondary",
      icon: "cleaning_services",
    },
    [EnvironmentStatus.CLEAN_FAILED]: {
      label: "Clean Failed",
      severity: "danger",
      icon: "cleaning_services",
    },
  };

  private static readonly DEFAULT: StatusTagConfiguration = {
    label: "Unknown",
    severity: "secondary",
    icon: "remove_circle_outline",
  };

  readonly status = input.required<EnvironmentStatus>();

  readonly configuration = computed(
    () =>
      EnvironmentStatusDisplayComponent.CONFIGURATIONS[this.status()] ??
      EnvironmentStatusDisplayComponent.DEFAULT
  );
}
