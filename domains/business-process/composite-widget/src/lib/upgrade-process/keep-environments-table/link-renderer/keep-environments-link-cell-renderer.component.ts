import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";

export interface LinkCellRendererParams extends ICellRendererParams {
  linkTemplate: (data: unknown) => string | null;
  tagLabel?: (data: unknown) => string | null;
}

@Component({
  imports: [RouterLink],
  templateUrl: "keep-environments-link-cell-renderer.component.html",
})
export class KeepEnvironmentsLinkCellRendererComponent
  implements AgRendererComponent
{
  params: LinkCellRendererParams;
  link: string | null = null;
  tag: string | null = null;

  agInit(params: LinkCellRendererParams): void {
    this.updateParams(params);
  }

  refresh(params: LinkCellRendererParams): boolean {
    this.updateParams(params);
    return true;
  }

  private updateParams(params: LinkCellRendererParams): void {
    this.params = params;
    this.link = params.linkTemplate(params.data);
    this.tag = params.tagLabel?.(params.data) ?? null;
  }
}
