import { Component } from "@angular/core";
import { Tag } from "primeng/tag";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

interface StatusTagConfiguration {
  label: string;
  severity: "success" | "info" | "warn" | "danger" | "secondary";
  icon: string;
  spin?: boolean;
}

@Component({
  selector: "mxevolve-reference-scenario-status-cell-renderer",
  standalone: true,
  imports: [Tag, MxevolveIconComponent],
  templateUrl: "./reference-scenario-status-cell-renderer.component.html",
})
export class ReferenceScenarioStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  private static readonly CONFIGURATIONS: Record<
    string,
    StatusTagConfiguration
  > = {
    Passed: { label: "Passed", severity: "success", icon: "check_circle" },
    Failed: { label: "Failed", severity: "danger", icon: "cancel" },
    Aborting: {
      label: "Aborting",
      severity: "danger",
      icon: "progress_activity",
      spin: true,
    },
    Aborted: {
      label: "Aborted",
      severity: "danger",
      icon: "power_settings_new",
    },
    "Failed To Abort": {
      label: "Failed To Abort",
      severity: "danger",
      icon: "cancel",
    },
    Underway: { label: "Underway", severity: "warn", icon: "pending" },
    READY: { label: "Ready", severity: "warn", icon: "pending" },
    NA: { label: "N/A", severity: "secondary", icon: "remove_circle_outline" },
  };

  configuration: StatusTagConfiguration = {
    label: "-",
    severity: "secondary",
    icon: "remove_circle_outline",
  };

  agInit(params: ICellRendererParams): void {
    const status = (params.value as string) ?? "";
    this.configuration = ReferenceScenarioStatusCellRendererComponent
      .CONFIGURATIONS[status] ?? {
      label: status || "-",
      severity: "secondary",
      icon: "remove_circle_outline",
    };
  }

  refresh(): boolean {
    return false;
  }
}
