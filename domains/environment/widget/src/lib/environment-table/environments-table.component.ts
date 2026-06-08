import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import {
  Environment,
  EnvironmentService,
} from "@mxevolve/domains/environment/data-access";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { EnvironmentNameCellRendererComponent } from "./cell-renderers/environment-name-cell-renderer.component";
import { EnvironmentStatusCellRendererComponent } from "./cell-renderers/environment-status-cell-renderer.component";
import { StartDateCellRendererComponent } from "./cell-renderers/start-date-cell-renderer.component";
import { CommitIdCellRendererComponent } from "./cell-renderers/commit-id-cell-renderer.component";
import { ActionsCellRendererComponent } from "./cell-renderers/actions-cell-renderer.component";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-environments-table",
  standalone: true,
  imports: [AgGridAngular],
  providers: [EnvironmentService],
  templateUrl: "./environments-table.component.html",
})
export class EnvironmentsTableComponent {
  readonly environmentIds = input.required<string[]>();
  readonly projectId = input.required<string>();

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No environments" };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;
  readonly actionsCellRendererComponent = ActionsCellRendererComponent;

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  };

  private readonly environmentService = inject(EnvironmentService);

  readonly environmentsResource = rxResource<
    Environment[],
    { environmentIds: string[] }
  >({
    params: () => ({ environmentIds: this.environmentIds() }),
    stream: ({ params }) => {
      if (params.environmentIds.length === 0) {
        return of<Environment[]>([]);
      }
      return this.environmentService.fetchByEnvironmentIds(
        params.environmentIds
      );
    },
  });

  readonly environments = computed(() =>
    this.environmentsResource.hasValue()
      ? this.environmentsResource.value()
      : []
  );

  readonly columnDefinitions = computed<ColDef<Environment>[]>(() => {
    const baseColumns: ColDef<Environment>[] = [
      {
        field: "id",
        headerName: "ID",
        cellRenderer: EnvironmentNameCellRendererComponent,
        cellRendererParams: { projectId: this.projectId() },
      },
      {
        field: "status",
        headerName: "Status",
        cellRenderer: EnvironmentStatusCellRendererComponent,
      },
      {
        field: "startDate",
        headerName: "Start Date",
        cellRenderer: StartDateCellRendererComponent,
      },
      {
        field: "mxVersion",
        headerName: "MX Version",
        valueFormatter: (params: ValueFormatterParams<Environment>) =>
          params.value || "-",
      },
      {
        field: "mxBuildId",
        headerName: "MX Build ID",
        valueFormatter: (params: ValueFormatterParams<Environment>) =>
          params.value || "-",
      },
      {
        field: "commitId",
        headerName: "Commit ID",
        cellRenderer: CommitIdCellRendererComponent,
      },
    ];

    return [
      ...baseColumns,
      {
        headerName: "Actions",
        sortable: false,
        cellRenderer: this.actionsCellRendererComponent,
        cellRendererParams: {
          projectId: this.projectId(),
        },
      },
    ];
  });
}
