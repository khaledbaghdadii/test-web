import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { buildDefinitionDetailsPath } from "@mxevolve/domains/business-process/util";

export interface DefinitionDetailsLinkCellParams extends ICellRendererParams {
  projectId: string;
}

@Component({
  selector: "mxevolve-definition-details-link-cell",
  imports: [RouterLink],
  template: `@if (name && definitionId) {
    <a
      class="text-primary no-underline hover:underline"
      [routerLink]="buildDefinitionDetailsPath(projectId, definitionId)"
      target="_blank"
      rel="noopener noreferrer"
      >{{ name }}</a
    >
    } @else {
    <span>{{ name }}</span>
    }`,
})
export class DefinitionDetailsLinkCellComponent
  implements ICellRendererAngularComp
{
  protected name = "";
  protected definitionId = "";
  protected projectId = "";
  protected readonly buildDefinitionDetailsPath = buildDefinitionDetailsPath;

  agInit(params: DefinitionDetailsLinkCellParams): void {
    this.update(params);
  }

  refresh(params: DefinitionDetailsLinkCellParams): boolean {
    this.update(params);
    return true;
  }

  private update(params: DefinitionDetailsLinkCellParams): void {
    this.name = (params.value as string) ?? "";
    this.definitionId =
      (params.data as { definitionId?: string } | undefined)?.definitionId ??
      "";
    this.projectId = params.projectId ?? "";
  }
}
