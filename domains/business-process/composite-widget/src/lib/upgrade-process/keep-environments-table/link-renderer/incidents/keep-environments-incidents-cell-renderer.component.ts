import { Component } from "@angular/core";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";
import type { LinkedIncident } from "@mxevolve/domains/business-process/data-access";

@Component({
  templateUrl: "keep-environments-incidents-cell-renderer.component.html",
})
export class KeepEnvironmentsIncidentsCellRendererComponent
  implements AgRendererComponent
{
  params: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.updateParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.updateParams(params);
    return true;
  }

  private updateParams(params: ICellRendererParams): void {
    this.params = params;
  }

  get incidents(): LinkedIncident[] {
    return (this.params?.value as LinkedIncident[]) ?? [];
  }

  getIncidentLink(incident: LinkedIncident): string | null {
    return incident.externalIssueLink;
  }
}
