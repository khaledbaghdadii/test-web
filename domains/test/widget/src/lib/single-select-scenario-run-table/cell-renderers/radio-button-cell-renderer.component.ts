import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { RadioButton } from "primeng/radiobutton";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "mxevolve-radio-button-cell-renderer",
  imports: [RadioButton, FormsModule],
  host: { class: "flex items-center justify-center h-full" },
  template: `<p-radioButton
    name="scenario-run-selection"
    [value]="rowId"
    [ngModel]="checked ? rowId : null"
    (onClick)="onSelect()"
    [inputId]="'scenario-run-' + rowId"
    ariaLabel="Select scenario run"
  ></p-radioButton>`,
})
export class RadioButtonCellRendererComponent
  implements ICellRendererAngularComp
{
  checked = false;
  rowId = "";
  private onSelectionChange: ((id: string) => void) | undefined;

  agInit(params: ICellRendererParams): void {
    this.rowId = params.data?.id ?? "";
    this.checked = params.context?.selectedId === this.rowId;
    this.onSelectionChange = params.context?.onSelectionChange;
  }

  refresh(params: ICellRendererParams): boolean {
    this.checked = params.context?.selectedId === this.rowId;
    return true;
  }

  onSelect(): void {
    this.onSelectionChange?.(this.rowId);
  }
}
