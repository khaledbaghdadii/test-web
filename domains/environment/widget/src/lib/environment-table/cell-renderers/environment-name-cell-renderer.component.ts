import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { EnvironmentNameDisplayComponent } from "@mxevolve/domains/environment/ui";

export interface EnvironmentNameCellRendererParams extends ICellRendererParams {
  projectId: string;
}

@Component({
  selector: "mxevolve-environment-name-cell-renderer",
  standalone: true,
  imports: [EnvironmentNameDisplayComponent],
  template: `<mxevolve-environment-name-display
    [environmentId]="environmentId"
    [projectId]="projectId"
  ></mxevolve-environment-name-display>`,
})
export class EnvironmentNameCellRendererComponent
  implements ICellRendererAngularComp
{
  environmentId = "";
  projectId: string;

  agInit(params: EnvironmentNameCellRendererParams): void {
    this.environmentId = params.value;
    this.projectId = params.projectId;
  }

  refresh(): boolean {
    return false;
  }
}
