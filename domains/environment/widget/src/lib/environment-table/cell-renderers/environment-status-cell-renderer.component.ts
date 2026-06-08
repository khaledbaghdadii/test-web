import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

@Component({
  selector: "mxevolve-environment-status-cell-renderer",
  standalone: true,
  imports: [EnvironmentStatusDisplayComponent],
  template: `<mxevolve-environment-status-display
    [status]="status"
  ></mxevolve-environment-status-display>`,
})
export class EnvironmentStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  status: EnvironmentStatus;

  agInit(params: ICellRendererParams): void {
    this.status = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
