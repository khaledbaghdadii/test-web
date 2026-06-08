import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import {
  AllCommunityModule,
  type GridApi,
  type GridReadyEvent,
  ModuleRegistry,
} from "ag-grid-community";
import { catchError, of } from "rxjs";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import {
  ScenarioRunCommitIdCellRendererComponent,
  ScenarioRunStartDateCellRendererComponent,
} from "@mxevolve/domains/test/ui";
import { RadioButtonCellRendererComponent } from "./cell-renderers/radio-button-cell-renderer.component";
import type { SingleSelectScenarioRunViewModel } from "./single-select-scenario-run-table.view-model";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-single-select-scenario-run-table",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  providers: [ScenarioRunService],
  templateUrl: "./single-select-scenario-run-table.component.html",
})
export class SingleSelectScenarioRunTableComponent {
  readonly contextId = input<string>();
  readonly subContextId = input<string>();
  readonly status = input<string>();
  readonly projectId = input.required<string>();
  readonly selectedScenarioRunId = output<string>();

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly toastMessageService = inject(ToastMessageService);

  private gridApi: GridApi | undefined;

  readonly selectedId = signal<string | undefined>(undefined);

  readonly scenarioRunsResource = rxResource({
    params: () => {
      const contextId = this.contextId();
      const subContextId = this.subContextId();
      const status = this.status();
      const projectId = this.projectId();
      return { projectId, contextId, subContextId, status };
    },
    stream: ({ params }) =>
      this.scenarioRunService
        .fetch(
          params.projectId,
          params.contextId,
          params.subContextId,
          params.status ? [params.status] : undefined
        )
        .pipe(
          catchError(() => {
            this.toastMessageService.showError("Failed to load scenario runs");
            return of([]);
          })
        ),
  });

  readonly scenarioRuns = computed(
    () => this.scenarioRunsResource.value() ?? []
  );
  readonly isLoading = computed(() => this.scenarioRunsResource.isLoading());

  readonly gridContext: {
    selectedId: string | undefined;
    onSelectionChange: (id: string) => void;
  } = {
    selectedId: undefined,
    onSelectionChange: (id: string) => this.onSelectionChange(id),
  };

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No scenario runs" };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly columnDefinitions: ColDef<SingleSelectScenarioRunViewModel>[] = [
    {
      headerName: "",
      width: 60,
      maxWidth: 60,
      sortable: false,
      cellRenderer: RadioButtonCellRendererComponent,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      cellRenderer: ScenarioRunStartDateCellRendererComponent,
    },
    {
      field: "commitId",
      headerName: "Commit ID",
      cellRenderer: ScenarioRunCommitIdCellRendererComponent,
    },
    {
      field: "mxVersion",
      headerName: "MX Version",
      valueFormatter: (
        params: ValueFormatterParams<SingleSelectScenarioRunViewModel>
      ) => params.value || "-",
    },
    {
      field: "mxBuildId",
      headerName: "MX Build ID",
      valueFormatter: (
        params: ValueFormatterParams<SingleSelectScenarioRunViewModel>
      ) => params.value || "-",
    },
  ];

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: false,
    filter: false,
    resizable: true,
  };

  constructor() {
    effect(() => {
      const runs = this.scenarioRuns();
      const currentSelection = this.selectedId();
      if (currentSelection && !runs.some((r) => r.id === currentSelection)) {
        this.selectedId.set(undefined);
        this.gridContext.selectedId = undefined;
      }
    });
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  onSelectionChange(id: string): void {
    this.selectedId.set(id);
    this.gridContext.selectedId = id;
    this.selectedScenarioRunId.emit(id);
    this.gridApi?.refreshCells({ force: true });
  }
}
