import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import type {
  ArchivalUserStoriesUpdateStatus,
  ArchivalUserStoryUpdate,
} from "@mxevolve/domains/business-process/data-access";

export interface StatusCellRendererParams extends ICellRendererParams {
  status: ArchivalUserStoriesUpdateStatus;
}

@Component({
  selector: "mxevolve-archival-user-stories-status-cell-renderer",
  imports: [Tag, MxevolveIconComponent],
  template: `
    <p-tag [severity]="severity">
      <span class="flex items-center gap-1 text-sm">
        <mxevolve-icon [name]="iconName" [spin]="spin" size="sm" />
        <span>{{ label }}</span>
      </span>
    </p-tag>
  `,
})
export class ArchivalUserStoriesStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  severity: "warn" | "success" | "danger" = "danger";
  iconName = "cancel";
  spin = false;
  label = "Not Updated";

  agInit(params: StatusCellRendererParams): void {
    this.updateParams(params);
  }

  refresh(params: StatusCellRendererParams): boolean {
    this.updateParams(params);
    return true;
  }

  private updateParams(params: StatusCellRendererParams): void {
    const status = params.status;
    const row = params.data as ArchivalUserStoryUpdate;
    const isUnderway = !!status?.startDate && !status?.endDate;

    if (isUnderway) {
      this.severity = "warn";
      this.iconName = "progress_activity";
      this.spin = true;
      this.label = "Underway";
    } else if (row?.updated) {
      this.severity = "success";
      this.iconName = "check_circle";
      this.spin = false;
      this.label = "Updated";
    } else {
      this.severity = "danger";
      this.iconName = "cancel";
      this.spin = false;
      this.label = "Not Updated";
    }
  }
}
