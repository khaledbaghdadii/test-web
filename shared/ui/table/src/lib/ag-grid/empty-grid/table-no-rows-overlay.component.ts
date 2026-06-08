import { Component } from "@angular/core";
import { INoRowsOverlayAngularComp } from "ag-grid-angular";
import { INoRowsOverlayParams } from "ag-grid-enterprise";
import { MxevolveIllustrationComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-table-no-rows-overlay",
  standalone: true,
  imports: [MxevolveIllustrationComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-8">
      <mxevolve-illustration name="search_not_found" size="sm" />
      <span class="text-surface-500 dark:text-surface-300 mt-4 text-sm">
        {{ message }}
      </span>
    </div>
  `,
})
export class TableNoRowsOverlayComponent implements INoRowsOverlayAngularComp {
  message = "No rows to display";

  agInit(params: INoRowsOverlayParams & { message?: string }): void {
    if (params.message) {
      this.message = params.message;
    }
  }
}
