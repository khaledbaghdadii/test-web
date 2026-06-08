import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-commit-id-cell-renderer",
  standalone: true,
  imports: [CommitIdDisplayComponent],
  template: `
    @if (url) {
    <a
      class="text-primary no-underline hover:underline"
      [href]="url"
      target="_blank"
    >
      <mxevolve-commit-id-display [commitId]="commitId" />
    </a>
    } @else {
    <mxevolve-commit-id-display [commitId]="commitId" />
    }
  `,
})
export class CommitIdCellRendererComponent implements ICellRendererAngularComp {
  commitId: string | undefined;
  url: string | undefined;

  agInit(params: ICellRendererParams): void {
    this.commitId = params.data?.id;
    this.url = params.data?.url;
  }

  refresh(params: ICellRendererParams): boolean {
    this.commitId = params.data?.id;
    this.url = params.data?.url;
    return true;
  }
}
