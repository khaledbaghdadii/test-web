import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";

/** Cell params carrying the project id needed to build the run deep-link. */
export interface RunNameCellParams extends ICellRendererParams {
  projectId: string;
}

/**
 * Renders the run **Name** as a router link to the Build & Test execution view
 * (`build-and-test-activity/execution/{id}`), matching the legacy CI table's
 * linked execution name. Falls back to plain text when the run has no id.
 */
@Component({
  selector: "mxevolve-build-and-test-run-name-cell",
  imports: [RouterLink],
  template: `@if (processId) {
    <a
      class="text-primary no-underline hover:underline"
      [routerLink]="[
        '/app',
        projectId,
        'business-process',
        'build-and-test-processes',
        'execution',
        processId
      ]"
      >{{ name }}</a
    >
    } @else {
    <span>{{ name }}</span>
    }`,
})
export class BuildAndTestRunNameCellComponent
  implements ICellRendererAngularComp
{
  protected name = "";
  protected processId = "";
  protected projectId = "";

  agInit(params: RunNameCellParams): void {
    this.update(params);
  }

  refresh(params: RunNameCellParams): boolean {
    this.update(params);
    return true;
  }

  private update(params: RunNameCellParams): void {
    this.name = (params.value as string) ?? "";
    this.processId = (params.data as { id?: string })?.id ?? "";
    this.projectId = params.projectId ?? "";
  }
}

/** Renders the run **Status** as the shared coloured execution-status badge. */
@Component({
  selector: "mxevolve-build-and-test-run-status-cell",
  imports: [ExecutionStatusTagComponent],
  template: `@if (status) {
    <mxevolve-execution-status-tag [status]="status" />
    } @else {
    <span>-</span>
    }`,
})
export class BuildAndTestRunStatusCellComponent
  implements ICellRendererAngularComp
{
  protected status?: ExecutionStatus;

  agInit(params: ICellRendererParams): void {
    this.status = params.value as ExecutionStatus | undefined;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}

/** Cell params carrying the resolved Jira base url for user-story links. */
export interface RunUserStoriesCellParams extends ICellRendererParams {
  jiraBaseUrl: string;
}

/**
 * Renders the run's **User Stories IDs** as Jira issue links. The `jiraBaseUrl`
 * is resolved once at the container (shared, de-duplicated call) and passed in
 * via cell params, so no per-row `project-details` request is issued (AC-7).
 */
@Component({
  selector: "mxevolve-build-and-test-run-user-stories-cell",
  template: `<span class="flex flex-wrap gap-x-1">
    @for (id of userStoryIds; track id; let last = $last) { @if (jiraBaseUrl) {
    <a
      class="text-primary no-underline hover:underline"
      [href]="jiraBaseUrl + '/browse/' + id"
      target="_blank"
      rel="noopener noreferrer"
      >{{ id }}{{ last ? "" : "," }}</a
    >
    } @else {
    <span>{{ id }}{{ last ? "" : "," }}</span>
    } }
  </span>`,
})
export class BuildAndTestRunUserStoriesCellComponent
  implements ICellRendererAngularComp
{
  protected userStoryIds: string[] = [];
  protected jiraBaseUrl = "";

  agInit(params: RunUserStoriesCellParams): void {
    this.update(params);
  }

  refresh(params: RunUserStoriesCellParams): boolean {
    this.update(params);
    return true;
  }

  private update(params: RunUserStoriesCellParams): void {
    this.userStoryIds = (params.value as string[]) ?? [];
    this.jiraBaseUrl = params.jiraBaseUrl ?? "";
  }
}
