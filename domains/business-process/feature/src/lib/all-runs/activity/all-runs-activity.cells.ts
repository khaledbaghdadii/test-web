import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-enterprise";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "@mxflow/config";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";

export interface AllRunsNameCellParams extends ICellRendererParams {
  projectId: string;
}

const processTypeRoutes: Record<string, string> = {
  CI_PROCESS: CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION: MASTER_VALIDATION_MFE_PATH,
  BINARY_UPGRADE: BINARY_UPGRADE_MFE_PATH,
};

const familyRoutes: Record<string, string> = {
  [ExecutionFamily.USER_STORY_BUILD_AND_TEST]: CI_PROCESS_MFE_PATH,
  [ExecutionFamily.VALIDATION_PROCESS]: MASTER_VALIDATION_MFE_PATH,
  [ExecutionFamily.UPGRADE_PROCESS]: BINARY_UPGRADE_MFE_PATH,
};

@Component({
  selector: "mxevolve-all-runs-name-cell",
  imports: [RouterLink],
  template: `@if (processId && executionLink) {
    <a
      class="text-primary no-underline hover:underline"
      [routerLink]="executionLink"
      >{{ name }}</a
    >
    } @else {
    <span>{{ name }}</span>
    }`,
})
export class AllRunsNameCellComponent implements ICellRendererAngularComp {
  protected name = "";
  protected processId = "";
  protected projectId = "";
  protected executionLink: string | string[] = "";

  agInit(params: AllRunsNameCellParams): void {
    this.update(params);
  }

  refresh(params: AllRunsNameCellParams): boolean {
    this.update(params);
    return true;
  }

  private update(params: AllRunsNameCellParams): void {
    this.name = (params.value as string) ?? "";
    const data = params.data as { id?: string; familyId?: string } | undefined;
    this.processId = data?.id ?? "";
    this.projectId = params.projectId ?? "";

    const route = this.routeFor(this.processId, data?.familyId);
    this.executionLink = route
      ? [
          "/app",
          this.projectId,
          "business-process",
          route,
          "execution",
          this.processId,
        ]
      : `/execution/details/${this.processId}`;
  }

  private routeFor(processId: string, familyId?: string): string | undefined {
    const processType = processId.split("__")[0];
    return processTypeRoutes[processType] ?? familyRoutes[familyId ?? ""];
  }
}

@Component({
  selector: "mxevolve-all-runs-status-cell",
  imports: [ExecutionStatusTagComponent],
  template: `@if (status) {
    <mxevolve-execution-status-tag [status]="status" />
    } @else {
    <span>-</span>
    }`,
})
export class AllRunsStatusCellComponent implements ICellRendererAngularComp {
  protected status?: ExecutionStatus;

  agInit(params: ICellRendererParams): void {
    this.status = params.value as ExecutionStatus | undefined;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
