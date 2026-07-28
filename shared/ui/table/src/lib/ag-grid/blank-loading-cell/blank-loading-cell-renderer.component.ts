// blank-loading-cell-renderer.component.ts
import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  standalone: true,
  template: ``, // renders nothing
})
export class BlankLoadingCellRendererComponent
  implements ICellRendererAngularComp
{
  agInit(): void {
    // no-op
  }
  refresh(): boolean {
    return false;
  }
}
