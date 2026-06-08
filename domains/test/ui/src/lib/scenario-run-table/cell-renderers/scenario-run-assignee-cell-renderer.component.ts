import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { AssigneeDisplayComponent } from "../../assignee-display/assignee-display.component";

export interface ScenarioRunAssigneeCellRendererParams
  extends ICellRendererParams {
  assigneeEmail: string;
}

@Component({
  selector: "mxevolve-scenario-run-assignee-cell-renderer",
  standalone: true,
  imports: [AssigneeDisplayComponent],
  template: `<mxevolve-assignee-display
    [assigneeDisplayName]="assigneeDisplayName"
    [assigneeEmail]="assigneeEmail"
  />`,
})
export class ScenarioRunAssigneeCellRendererComponent
  implements ICellRendererAngularComp
{
  assigneeDisplayName = "";
  assigneeEmail = "";

  agInit(params: ScenarioRunAssigneeCellRendererParams): void {
    this.assigneeDisplayName = params.value;
    this.assigneeEmail = params.assigneeEmail;
  }

  refresh(): boolean {
    return false;
  }
}
