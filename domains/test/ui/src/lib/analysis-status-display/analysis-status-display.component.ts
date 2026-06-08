import { Component, computed, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AnalysisStatus } from "@mxevolve/domains/test/model";

interface AnalysisStatusTagConfiguration {
  label: string;
  severity: "success" | "info" | "warn" | "danger" | "secondary";
  icon: string;
}

@Component({
  selector: "mxevolve-analysis-status-display",
  imports: [Tag, MxevolveIconComponent],
  template: `
    <p-tag [severity]="configuration().severity">
      <div class="flex items-center gap-1 text-sm">
        <mxevolve-icon [name]="configuration().icon" size="sm" />
        <span>{{ configuration().label }}</span>
      </div>
    </p-tag>
  `,
})
export class AnalysisStatusDisplayComponent {
  private static readonly CONFIGURATIONS: Record<
    AnalysisStatus,
    AnalysisStatusTagConfiguration
  > = {
    [AnalysisStatus.NA]: {
      label: "N/A",
      severity: "secondary",
      icon: "remove_circle_outline",
    },
    [AnalysisStatus.ASSIGNED]: {
      label: "Assigned",
      severity: "warn",
      icon: "person",
    },
    [AnalysisStatus.UNDER_ANALYSIS]: {
      label: "Under Analysis",
      severity: "info",
      icon: "search",
    },
    [AnalysisStatus.INCIDENT_SENT]: {
      label: "Incident Sent",
      severity: "info",
      icon: "mark_email_read",
    },
    [AnalysisStatus.PASSED]: {
      label: "Passed",
      severity: "success",
      icon: "check_circle",
    },
    [AnalysisStatus.FAILED]: {
      label: "Failed",
      severity: "danger",
      icon: "cancel",
    },
    [AnalysisStatus.CANCELLED]: {
      label: "Cancelled",
      severity: "danger",
      icon: "cancel",
    },
  };

  private static readonly DEFAULT: AnalysisStatusTagConfiguration = {
    label: "N/A",
    severity: "secondary",
    icon: "remove_circle_outline",
  };

  readonly status = input.required<string>();

  readonly configuration = computed(() => {
    const parsed = Object.values<string>(AnalysisStatus).includes(this.status())
      ? (this.status() as AnalysisStatus)
      : undefined;
    return parsed
      ? AnalysisStatusDisplayComponent.CONFIGURATIONS[parsed]
      : AnalysisStatusDisplayComponent.DEFAULT;
  });
}
