import { Component, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { Tag } from "primeng/tag";

@Component({
  selector: "mxevolve-application-role-cell-renderer",
  imports: [Tag],
  template: `
    @if (isPrimary()) {
    <p-tag value="Primary" style="max-height: 25px" />
    } @else if (!isPrimary()) {
    <p-tag severity="secondary" value="Secondary" style="max-height: 25px" />
    } @else { - }
  `,
})
export class ApplicationRoleCellRendererComponent
  implements ICellRendererAngularComp
{
  isPrimary = signal<boolean | undefined>(undefined);

  agInit(params: ICellRendererParams): void {
    this.isPrimary.set(params.data?.isPrimary);
  }

  refresh(): boolean {
    return false;
  }
}
