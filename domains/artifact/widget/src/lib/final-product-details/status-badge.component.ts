import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

type FinalProductStatusSeverity =
  | "success"
  | "secondary"
  | "info"
  | "warn"
  | "danger"
  | "contrast";

interface FinalProductStatus {
  severity: FinalProductStatusSeverity;
  label: string;
  icon: string;
}

@Component({
  selector: "mxevolve-final-product-status-badge",
  template: `
    <p-tag [severity]="status().severity">
      <span class="flex items-center gap-1 text-sm">
        <mxevolve-icon [name]="status().icon" size="sm" />
        <span>{{ status().label }}</span>
      </span>
    </p-tag>
  `,
  imports: [Tag, MxevolveIconComponent],
})
export class FinalProductStatusBadgeComponent {
  readonly state = input.required<string>();

  readonly status = computed<FinalProductStatus>(() =>
    this.resolveStatus(this.state())
  );

  private resolveStatus(state: string): FinalProductStatus {
    switch (state.toLowerCase()) {
      case "available":
        return {
          severity: "success",
          label: "Available",
          icon: "check_circle",
        };
      case "failed":
        return { severity: "danger", label: "Failed", icon: "cancel" };
      case "creating":
        return {
          severity: "info",
          label: "Creating",
          icon: "hourglass_empty",
        };
      case "purged":
        return { severity: "contrast", label: "Purged", icon: "delete" };
      case "purging":
        return {
          severity: "warn",
          label: "Purging",
          icon: "cleaning_services",
        };
      case "purge_failed":
        return {
          severity: "danger",
          label: "Purge Failed",
          icon: "error",
        };
      default:
        return {
          severity: "contrast",
          label: "Unknown Status",
          icon: "help",
        };
    }
  }
}
