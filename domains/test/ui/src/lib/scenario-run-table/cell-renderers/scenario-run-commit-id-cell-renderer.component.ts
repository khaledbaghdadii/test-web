import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-scenario-run-commit-id-cell-renderer",
  standalone: true,
  imports: [CommitIdDisplayComponent],
  template: `<mxevolve-commit-id-display
    [commitId]="commitId"
  ></mxevolve-commit-id-display>`,
})
export class ScenarioRunCommitIdCellRendererComponent
  implements ICellRendererAngularComp
{
  commitId = "";

  agInit(params: ICellRendererParams): void {
    this.commitId = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
