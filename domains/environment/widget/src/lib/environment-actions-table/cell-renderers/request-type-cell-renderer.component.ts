import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";

export interface RequestTypeCellRendererParams extends ICellRendererParams {
  projectId: string;
  environmentId: string;
}

@Component({
  selector: "mxevolve-request-type-cell-renderer",
  standalone: true,
  imports: [RouterLink],
  template: `<a [routerLink]="link()" target="_blank" class="p-button-link">{{
    type()
  }}</a>`,
})
export class RequestTypeCellRendererComponent
  implements ICellRendererAngularComp
{
  readonly type = signal("");
  readonly requestId = signal("");
  readonly projectId = signal("");
  readonly environmentId = signal("");

  readonly link = computed(
    () =>
      `/app/${this.projectId()}/environments/${this.environmentId()}/requests/${this.requestId()}/events`
  );

  agInit(params: RequestTypeCellRendererParams): void {
    const request = params.data as ManagementRequest;
    this.type.set(request.type);
    this.requestId.set(request.id);
    this.projectId.set(params.projectId);
    this.environmentId.set(params.environmentId);
  }

  refresh(): boolean {
    return false;
  }
}
