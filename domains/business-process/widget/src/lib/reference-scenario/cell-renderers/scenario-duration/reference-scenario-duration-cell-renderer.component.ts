import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { DurationPipeModule } from "@mxflow/pipe";
import { ReferenceScenario } from "@mxevolve/domains/business-process/data-access";

@Component({
  selector: "mxevolve-reference-scenario-duration-cell-renderer",
  standalone: true,
  imports: [DurationPipeModule],
  templateUrl: "./reference-scenario-duration-cell-renderer.component.html",
})
export class ReferenceScenarioDurationCellRendererComponent
  implements ICellRendererAngularComp
{
  startTime?: string;
  endTime?: string;

  agInit(params: ICellRendererParams<ReferenceScenario>): void {
    this.startTime = params.data?.scenarioStartDate;
    this.endTime = params.data?.scenarioEndDate;
  }

  refresh(): boolean {
    return false;
  }
}
