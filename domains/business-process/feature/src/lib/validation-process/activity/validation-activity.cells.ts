import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";

/** Cell params carrying the project id needed to build the run deep-link. */
export interface ValidationRunNameCellParams extends ICellRendererParams {
  projectId: string;
}

/**
 * Renders the run **Execution Name** as a router link to the Validation
 * execution view (`validation-activity/execution/{id}`), matching the legacy
 * validation table's linked execution name. Falls back to plain text when the
 * run has no id.
 */
@Component({
  selector: "mxevolve-validation-run-name-cell",
  imports: [RouterLink],
  template: `@if (processId) {
    <a
      class="text-primary no-underline hover:underline"
      [routerLink]="[
        '/app',
        projectId,
        'business-process',
        'validation-processes',
        'execution',
        processId
      ]"
      >{{ name }}</a
    >
    } @else {
    <span>{{ name }}</span>
    }`,
})
export class ValidationRunNameCellComponent
  implements ICellRendererAngularComp
{
  protected name = "";
  protected processId = "";
  protected projectId = "";

  agInit(params: ValidationRunNameCellParams): void {
    this.update(params);
  }

  refresh(params: ValidationRunNameCellParams): boolean {
    this.update(params);
    return true;
  }

  private update(params: ValidationRunNameCellParams): void {
    this.name = (params.value as string) ?? "";
    this.processId = (params.data as { id?: string })?.id ?? "";
    this.projectId = params.projectId ?? "";
  }
}

/** Renders the run **Status** as the shared coloured execution-status badge. */
@Component({
  selector: "mxevolve-validation-run-status-cell",
  imports: [ExecutionStatusTagComponent],
  template: `@if (status) {
    <mxevolve-execution-status-tag [status]="status" />
    } @else {
    <span>-</span>
    }`,
})
export class ValidationRunStatusCellComponent
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
