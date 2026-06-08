import { Component } from "@angular/core";
import { ILoadingOverlayAngularComp } from "ag-grid-angular";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-table-loading-overlay",
  standalone: true,
  imports: [MxevolveIconComponent],
  host: {
    class: "block h-full w-full",
  },
  template: `
    <div
      class="box-border grid h-full w-full place-items-center"
      style="padding-top: var(--ag-header-height);"
    >
      <div class="flex flex-col items-center justify-center">
        <mxevolve-icon
          name="progress_activity"
          [spin]="true"
          size="xl"
          class="text-primary"
        />
        <span class="text-surface-500 dark:text-surface-300 mt-4 text-sm">
          Loading...
        </span>
      </div>
    </div>
  `,
})
export class TableLoadingOverlayComponent
  implements ILoadingOverlayAngularComp
{
  agInit(): void {
    // no-op
  }
}
