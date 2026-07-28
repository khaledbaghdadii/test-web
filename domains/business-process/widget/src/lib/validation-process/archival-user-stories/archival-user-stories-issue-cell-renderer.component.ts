import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-enterprise";

export interface IssueCellRendererParams extends ICellRendererParams {
  jiraBaseUrl: string;
}

@Component({
  selector: "mxevolve-archival-user-stories-issue-cell-renderer",
  template: `
    @if (jiraBaseUrl && userStoryId) {
    <a
      class="text-primary no-underline hover:underline"
      [href]="jiraBaseUrl + '/browse/' + userStoryId"
      target="_blank"
      rel="noopener noreferrer"
      >{{ userStoryId }}</a
    >
    } @else {
    <span>{{ userStoryId }}</span>
    }
  `,
})
export class ArchivalUserStoriesIssueCellRendererComponent
  implements ICellRendererAngularComp
{
  jiraBaseUrl = "";
  userStoryId = "";

  agInit(params: IssueCellRendererParams): void {
    this.updateParams(params);
  }

  refresh(params: IssueCellRendererParams): boolean {
    this.updateParams(params);
    return true;
  }

  private updateParams(params: IssueCellRendererParams): void {
    this.jiraBaseUrl = params.jiraBaseUrl ?? "";
    this.userStoryId = (params.value as string) ?? "";
  }
}
