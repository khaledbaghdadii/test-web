import { Component, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { Tag } from "primeng/tag";

@Component({
  selector: "mxevolve-mx-db-types-cell-renderer",
  imports: [Tag],
  template: `
    @for (type of mxDbTypes(); track type) {
    <p-tag
      [value]="type"
      severity="info"
      style="max-height: 25px; margin-right: 3px"
    />
    } @empty { - }
  `,
})
export class MxDbTypesCellRendererComponent
  implements ICellRendererAngularComp
{
  readonly mxDbTypes = signal<string[]>([]);

  agInit(params: ICellRendererParams): void {
    this.mxDbTypes.set(params.data?.mxDbTypes ?? []);
  }

  refresh(): boolean {
    return false;
  }
}
