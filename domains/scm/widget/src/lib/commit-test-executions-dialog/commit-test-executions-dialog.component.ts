import { Component, inject } from "@angular/core";
import { DynamicDialogConfig } from "primeng/dynamicdialog";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef } from "ag-grid-enterprise";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { ScenarioRunStatusCellRendererComponent } from "@mxevolve/domains/test/ui";
import { ScenarioExecutionLinkCellRendererComponent } from "../scenario-execution-link-cell-renderer/scenario-execution-link-cell-renderer.component";
import {
  DateCellRendererComponent,
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";

export interface CommitTestExecutionRow {
  id: string;
  projectId: string;
  name: string;
  status: ScenarioRunStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface CommitTestExecutionsDialogData {
  commitId: string;
  executions: CommitTestExecutionRow[];
}

@Component({
  selector: "mxevolve-commit-test-executions-dialog",
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="w-full"
      [rowData]="rowData"
      [columnDefs]="colDefs"
      [defaultColDef]="defaultColDef"
      [noRowsOverlayComponent]="noRowsOverlayComponent"
      [noRowsOverlayComponentParams]="noRowsOverlayComponentParams"
      [loadingOverlayComponent]="loadingOverlayComponent"
      domLayout="autoHeight"
    />
  `,
})
export class CommitTestExecutionsDialogComponent {
  private readonly config =
    inject<DynamicDialogConfig<CommitTestExecutionsDialogData>>(
      DynamicDialogConfig
    );

  readonly rowData = this.config.data!.executions;

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = {
    message: "No test executions found for this commit",
  };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    resizable: true,
  };

  readonly colDefs: ColDef<CommitTestExecutionRow>[] = [
    {
      field: "name",
      headerName: "Test Execution Name",
      flex: 2,
      minWidth: 200,
      cellRenderer: ScenarioExecutionLinkCellRendererComponent,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      cellRenderer: ScenarioRunStatusCellRendererComponent,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      minWidth: 200,
      cellRenderer: DateCellRendererComponent,
    },
    {
      field: "endDate",
      headerName: "End Date",
      minWidth: 200,
      cellRenderer: DateCellRendererComponent,
    },
  ];
}
