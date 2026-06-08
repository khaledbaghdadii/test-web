import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { DateDisplayComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-start-date-cell-renderer",
  standalone: true,
  imports: [DateDisplayComponent],
  template: `<mxevolve-date-display [date]="date"></mxevolve-date-display>`,
})
export class StartDateCellRendererComponent
  implements ICellRendererAngularComp
{
  date: string | undefined;

  agInit(params: ICellRendererParams): void {
    this.date = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
