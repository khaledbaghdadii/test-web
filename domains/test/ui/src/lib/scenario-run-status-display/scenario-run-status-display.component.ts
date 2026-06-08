import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";

interface StatusTagConfiguration {
  label: string;
  severity: "success" | "info" | "warn" | "danger" | "secondary";
  icon: string;
  spin?: boolean;
}

@Component({
  selector: "mxevolve-scenario-run-status-display",
  standalone: true,
  imports: [Tag, MxevolveIconComponent],
  template: `
    <p-tag [severity]="configuration().severity">
      <div class="flex items-center gap-1 text-sm">
        <mxevolve-icon
          [name]="configuration().icon"
          size="sm"
          [spin]="configuration().spin ?? false"
        />
        <span>{{ configuration().label }}</span>
      </div>
    </p-tag>
  `,
})
export class ScenarioRunStatusDisplayComponent {
  private static readonly CONFIGURATIONS: Record<
    ScenarioRunStatus,
    StatusTagConfiguration
  > = {
    [ScenarioRunStatus.PASSED]: {
      label: "Passed",
      severity: "success",
      icon: "check_circle",
    },
    [ScenarioRunStatus.FAILED]: {
      label: "Failed",
      severity: "danger",
      icon: "cancel",
    },
    [ScenarioRunStatus.ABORTING]: {
      label: "Aborting",
      severity: "danger",
      icon: "progress_activity",
      spin: true,
    },
    [ScenarioRunStatus.ABORTED]: {
      label: "Aborted",
      severity: "danger",
      icon: "power_settings_new",
    },
    [ScenarioRunStatus.FAILED_TO_ABORT]: {
      label: "Failed To Abort",
      severity: "danger",
      icon: "cancel",
    },
    [ScenarioRunStatus.UNDERWAY]: {
      label: "Underway",
      severity: "warn",
      icon: "pending",
    },
    [ScenarioRunStatus.READY]: {
      label: "Ready",
      severity: "warn",
      icon: "pending",
    },
    [ScenarioRunStatus.NA]: {
      label: "N/A",
      severity: "secondary",
      icon: "remove_circle_outline",
    },
  };

  private static readonly DEFAULT: StatusTagConfiguration = {
    label: "N/A",
    severity: "secondary",
    icon: "remove_circle_outline",
  };

  readonly status = input.required<ScenarioRunStatus>();

  readonly configuration = computed(
    () =>
      ScenarioRunStatusDisplayComponent.CONFIGURATIONS[this.status()] ??
      ScenarioRunStatusDisplayComponent.DEFAULT
  );
}
