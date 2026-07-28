import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
  selector: "mxevolve-build-and-test-backport-link-cell-renderer",
  standalone: true,
  template: `
    @if (href) {
    <a
      class="text-primary no-underline hover:underline"
      [href]="href"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ label }}
    </a>
    } @else {
    <span>{{ label }}</span>
    }
  `,
})
export class BuildAndTestBackportLinkCellRendererComponent
  implements ICellRendererAngularComp
{
  label = "";
  href = "";

  agInit(params: ICellRendererParams<{ readonly href?: string }>): void {
    this.label = String(params.value ?? "");
    this.href = params.data?.href ?? "";
  }

  refresh(params: ICellRendererParams<{ readonly href?: string }>): boolean {
    this.agInit(params);
    return true;
  }
}
