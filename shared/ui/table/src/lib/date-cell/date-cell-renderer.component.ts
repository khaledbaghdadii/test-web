import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";
import { DateDisplayComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-date-cell-renderer",
  standalone: true,
  imports: [DateDisplayComponent],
  template: `<mxevolve-date-display [date]="value" />`,
})
export class DateCellRendererComponent implements ICellRendererAngularComp {
  value: string | undefined;

  agInit(params: ICellRendererParams): void {
    this.value = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    this.value = params.value;
    return true;
  }
}
