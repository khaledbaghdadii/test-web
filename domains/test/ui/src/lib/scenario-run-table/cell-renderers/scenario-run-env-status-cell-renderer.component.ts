import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

@Component({
  selector: "mxevolve-scenario-run-env-status-cell-renderer",
  standalone: true,
  imports: [EnvironmentStatusDisplayComponent],
  template: `@if (status) {
    <mxevolve-environment-status-display [status]="status" />
    } @else {
    <span>-</span>
    }`,
})
export class ScenarioRunEnvStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  status: EnvironmentStatus | undefined;

  agInit(params: ICellRendererParams): void {
    this.status = params.value as EnvironmentStatus | undefined;
  }

  refresh(): boolean {
    return false;
  }
}
