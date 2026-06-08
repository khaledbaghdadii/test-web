import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { DurationDisplayComponent } from "@mxevolve/shared/ui/primitive";

export interface ScenarioRunDurationCellRendererParams
  extends ICellRendererParams {
  startDate: string;
  endDate: string;
}

@Component({
  selector: "mxevolve-scenario-run-duration-cell-renderer",
  standalone: true,
  imports: [DurationDisplayComponent],
  template: `<mxevolve-duration-display
    [startDate]="startDate"
    [endDate]="endDate"
  ></mxevolve-duration-display>`,
})
export class ScenarioRunDurationCellRendererComponent
  implements ICellRendererAngularComp
{
  startDate = "";
  endDate = "";

  agInit(params: ScenarioRunDurationCellRendererParams): void {
    this.startDate = params.startDate;
    this.endDate = params.endDate;
  }

  refresh(): boolean {
    return false;
  }
}
