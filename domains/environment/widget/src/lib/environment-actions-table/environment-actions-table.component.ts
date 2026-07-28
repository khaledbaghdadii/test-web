import { Component, computed, input } from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, ValueGetterParams } from "ag-grid-enterprise";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import {
  DateCellRendererComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { RequestTypeCellRendererComponent } from "./cell-renderers/request-type-cell-renderer.component";
import { RequestResultCellRendererComponent } from "./cell-renderers/request-result-cell-renderer.component";
import { RequestActionsCellRendererComponent } from "./cell-renderers/request-actions-cell-renderer.component";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-environment-actions-table",
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: "./environment-actions-table.component.html",
})
export class EnvironmentActionsTableComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly requests = input.required<ManagementRequest[]>();

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No environment actions" };

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  };

  readonly columnDefinitions = computed<ColDef<ManagementRequest>[]>(() => [
    {
      field: "type",
      headerName: "Type",
      cellRenderer: RequestTypeCellRendererComponent,
      cellRendererParams: {
        projectId: this.projectId(),
        environmentId: this.environmentId(),
      },
    },
    {
      headerName: "Status",
      colId: "status",
      valueGetter: (params: ValueGetterParams<ManagementRequest>) => {
        const request = params.data;
        if (!request) {
          return "";
        }
        return request.abortedBy && !request.resultStatus
          ? "ABORTING"
          : request.status;
      },
    },
    {
      field: "resultStatus",
      headerName: "Result",
      sortable: false,
      cellRenderer: RequestResultCellRendererComponent,
    },
    {
      field: "createdOn",
      headerName: "Created On",
      cellRenderer: DateCellRendererComponent,
    },
    {
      field: "startedOn",
      headerName: "Started On",
      cellRenderer: DateCellRendererComponent,
    },
    {
      field: "endedOn",
      headerName: "Ended On",
      cellRenderer: DateCellRendererComponent,
    },
    {
      headerName: "",
      colId: "actions",
      sortable: false,
      cellRenderer: RequestActionsCellRendererComponent,
      cellRendererParams: {
        projectId: this.projectId(),
        environmentId: this.environmentId(),
      },
    },
  ]);
}
