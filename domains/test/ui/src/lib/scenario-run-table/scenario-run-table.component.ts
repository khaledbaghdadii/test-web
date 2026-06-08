import { Component, computed, input, signal } from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import type { ScenarioRunTableViewModel } from "./scenario-run-table.view-model";
import { ScenarioRunNameCellRendererComponent } from "./cell-renderers/scenario-run-name-cell-renderer.component";
import { ScenarioRunStartDateCellRendererComponent } from "./cell-renderers/scenario-run-start-date-cell-renderer.component";
import { ScenarioRunDurationCellRendererComponent } from "./cell-renderers/scenario-run-duration-cell-renderer.component";
import { ScenarioRunCommitIdCellRendererComponent } from "./cell-renderers/scenario-run-commit-id-cell-renderer.component";
import { ScenarioRunStatusCellRendererComponent } from "./cell-renderers/scenario-run-status-cell-renderer.component";
import { ScenarioRunEnvStatusCellRendererComponent } from "./cell-renderers/scenario-run-env-status-cell-renderer.component";
import { ScenarioRunAssigneeCellRendererComponent } from "./cell-renderers/scenario-run-assignee-cell-renderer.component";
import {
  ALL_SCENARIO_RUN_STATUSES,
  getScenarioRunStatusDisplayName,
  ScenarioRunStatus,
} from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
  TEXT_FILTER_PARAMS,
} from "@mxevolve/shared/ui/table";

@Component({
  selector: "mxevolve-scenario-run-table",
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: "./scenario-run-table.component.html",
})
export class ScenarioRunTableComponent {
  readonly scenarioRuns =
    input.required<readonly ScenarioRunTableViewModel[]>();
  readonly projectId = input.required<string>();
  readonly loading = input<boolean>(false);

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No scenario runs" };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColumnDefinition = signal<ColDef>({
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  });

  readonly gridContext = computed(() => ({
    projectId: this.projectId(),
  }));

  readonly columnDefinitions = signal<ColDef<ScenarioRunTableViewModel>[]>([
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      filter: "agTextColumnFilter",
      filterParams: TEXT_FILTER_PARAMS,
      cellRendererSelector: (params) => ({
        component: ScenarioRunNameCellRendererComponent,
        params: {
          projectId: params.context?.projectId,
          scenarioRunId: params.data?.id,
        },
      }),
    },
    {
      field: "status",
      headerName: "Status",
      filter: "agSetColumnFilter",
      filterParams: {
        values: ALL_SCENARIO_RUN_STATUSES,
        valueFormatter: (params: { value: string }) =>
          getScenarioRunStatusDisplayName(params.value as ScenarioRunStatus),
      },
      cellRenderer: ScenarioRunStatusCellRendererComponent,
    },
    {
      field: "environmentStatus",
      headerName: "Env Status",
      filter: "agSetColumnFilter",
      filterParams: {
        values: Object.values(EnvironmentStatus),
      },
      cellRenderer: ScenarioRunEnvStatusCellRendererComponent,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      cellRenderer: ScenarioRunStartDateCellRendererComponent,
    },
    {
      headerName: "Duration",
      valueGetter: (params) => {
        const start = params.data?.startDate;
        const end = params.data?.endDate;
        if (!start || !end) return null;
        return new Date(end).getTime() - new Date(start).getTime();
      },
      cellRendererSelector: (params) => ({
        component: ScenarioRunDurationCellRendererComponent,
        params: {
          startDate: params.data?.startDate,
          endDate: params.data?.endDate,
        },
      }),
    },
    {
      field: "commitId",
      headerName: "Commit ID",
      filter: "agTextColumnFilter",
      filterParams: TEXT_FILTER_PARAMS,
      cellRenderer: ScenarioRunCommitIdCellRendererComponent,
    },
    {
      field: "mxVersion",
      headerName: "MX Version",
      flex: 1.2,
      filter: "agTextColumnFilter",
      filterParams: TEXT_FILTER_PARAMS,
      valueFormatter: (
        params: ValueFormatterParams<ScenarioRunTableViewModel>
      ) => params.value || "-",
    },
    {
      field: "mxBuildId",
      headerName: "MX Build ID",
      flex: 1.2,
      filter: "agTextColumnFilter",
      filterParams: TEXT_FILTER_PARAMS,
      valueFormatter: (
        params: ValueFormatterParams<ScenarioRunTableViewModel>
      ) => params.value || "-",
    },
    {
      field: "assigneeDisplayName",
      headerName: "Assignee",
      flex: 1.5,
      filter: "agTextColumnFilter",
      filterParams: TEXT_FILTER_PARAMS,
      cellRendererSelector: (params) => ({
        component: ScenarioRunAssigneeCellRendererComponent,
        params: {
          assigneeEmail: params.data?.assigneeEmail,
        },
      }),
    },
  ]);
}
