import { Component } from "@angular/core";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "mxevolve-build-and-test-backport-status-cell-renderer",
  standalone: true,
  imports: [ExecutionStatusTagComponent],
  template: `@if (status) {
    <mxevolve-execution-status-tag [status]="status" />
    } @else {
    <span>-</span>
    }`,
})
export class BuildAndTestBackportStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  status?: ExecutionStatus;

  agInit(params: ICellRendererParams): void {
    this.status = params.value as ExecutionStatus | undefined;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
