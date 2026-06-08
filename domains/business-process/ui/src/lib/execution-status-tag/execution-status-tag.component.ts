import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";

interface StatusTagConfiguration {
  label: string;
  severity: "success" | "info" | "warn" | "danger" | "secondary" | "contrast";
  icon: string;
  spin?: boolean;
}

const STATUS_TAG_CONFIGURATIONS: Record<string, StatusTagConfiguration> = {
  [ExecutionStatus.PASSED]: {
    label: "Passed",
    severity: "success",
    icon: "check_circle",
  },
  [ExecutionStatus.RUNNING]: {
    label: "Running",
    severity: "info",
    icon: "schedule",
  },
  [ExecutionStatus.FAILED]: {
    label: "Failed",
    severity: "danger",
    icon: "cancel",
  },
  [ExecutionStatus.FAILED_TO_START]: {
    label: "Failed to Start",
    severity: "danger",
    icon: "cancel",
  },
  [ExecutionStatus.ABORTED]: {
    label: "Aborted",
    severity: "danger",
    icon: "power_settings_new",
  },
  [ExecutionStatus.ABORTING]: {
    label: "Aborting",
    severity: "danger",
    icon: "progress_activity",
    spin: true,
  },
  [ExecutionStatus.STOPPED]: {
    label: "Stopped",
    severity: "secondary",
    icon: "block",
  },
  [ExecutionStatus.NOT_STARTED]: {
    label: "Not Started",
    severity: "warn",
    icon: "error",
  },
  [ExecutionStatus.PENDING_INPUT]: {
    label: "Pending Input",
    severity: "warn",
    icon: "warning",
  },
  [ExecutionStatus.NA]: {
    label: "NA",
    severity: "secondary",
    icon: "remove_circle",
  },
};

const DEFAULT_STATUS_TAG_CONFIGURATION: StatusTagConfiguration = {
  label: "NA",
  severity: "secondary",
  icon: "remove_circle",
};

@Component({
  selector: "mxevolve-execution-status-tag",
  imports: [Tag, MxevolveIconComponent],
  templateUrl: "./execution-status-tag.component.html",
})
export class ExecutionStatusTagComponent {
  readonly status = input.required<ExecutionStatus>();

  readonly configuration = computed(
    () =>
      STATUS_TAG_CONFIGURATIONS[this.status()] ??
      DEFAULT_STATUS_TAG_CONFIGURATION
  );
}
