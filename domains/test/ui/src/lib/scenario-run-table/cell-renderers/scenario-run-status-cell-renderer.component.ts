import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { ScenarioRunStatusDisplayComponent } from "../../scenario-run-status-display/scenario-run-status-display.component";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-scenario-run-status-cell-renderer",
  standalone: true,
  imports: [ScenarioRunStatusDisplayComponent],
  template: `@if (status) {
    <mxevolve-scenario-run-status-display [status]="status" />
    }`,
})
export class ScenarioRunStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  status: ScenarioRunStatus;

  agInit(params: ICellRendererParams): void {
    this.status = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
