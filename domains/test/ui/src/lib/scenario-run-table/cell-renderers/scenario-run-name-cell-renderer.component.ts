import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { ScenarioRunNameDisplayComponent } from "../../scenario-run-name-display/scenario-run-name-display.component";

export interface ScenarioRunNameCellRendererParams extends ICellRendererParams {
  projectId: string;
  scenarioRunId: string;
}

@Component({
  selector: "mxevolve-scenario-run-name-cell-renderer",
  standalone: true,
  imports: [ScenarioRunNameDisplayComponent],
  template: `<mxevolve-scenario-run-name-display
    [scenarioRunId]="scenarioRunId"
    [name]="name"
    [projectId]="projectId"
  ></mxevolve-scenario-run-name-display>`,
})
export class ScenarioRunNameCellRendererComponent
  implements ICellRendererAngularComp
{
  scenarioRunId = "";
  name = "";
  projectId = "";

  agInit(params: ScenarioRunNameCellRendererParams): void {
    this.name = params.value;
    this.scenarioRunId = params.scenarioRunId;
    this.projectId = params.projectId;
  }

  refresh(): boolean {
    return false;
  }
}
