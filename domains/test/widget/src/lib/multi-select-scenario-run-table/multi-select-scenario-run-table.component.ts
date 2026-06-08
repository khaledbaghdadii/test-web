import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { AgGridAngular } from "ag-grid-angular";
import type {
  ColDef,
  RowSelectionOptions,
  SelectionChangedEvent,
  SelectionColumnDef,
} from "ag-grid-enterprise";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { catchError, of } from "rxjs";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { ScenarioRunStatusCellRendererComponent } from "@mxevolve/domains/test/ui";
import type { MultiSelectScenarioRunViewModel } from "./multi-select-scenario-run-table.view-model";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-multi-select-scenario-run-table",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  providers: [ScenarioRunService],
  templateUrl: "./multi-select-scenario-run-table.component.html",
})
export class MultiSelectScenarioRunTableComponent {
  readonly projectId = input.required<string>();
  readonly scenarioRunIds = input.required<string[]>();
  readonly selectedScenarioRunIds = output<string[]>();

  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly scenarioRunsResource = rxResource({
    params: () => {
      const projectId = this.projectId();
      const scenarioRunIds = this.scenarioRunIds();
      return { projectId, scenarioRunIds };
    },
    stream: ({ params }) =>
      params.scenarioRunIds.length === 0
        ? of([])
        : this.scenarioRunService
            .fetch(
              params.projectId,
              undefined,
              undefined,
              undefined,
              params.scenarioRunIds
            )
            .pipe(
              catchError(() => {
                this.toastMessageService.showError(
                  "Failed to load scenario runs"
                );
                return of([]);
              })
            ),
  });

  readonly scenarioRuns = computed<MultiSelectScenarioRunViewModel[]>(() => {
    const runs = this.scenarioRunsResource.value() ?? [];
    return runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status as ScenarioRunStatus,
    }));
  });
  readonly isLoading = computed(() => this.scenarioRunsResource.isLoading());

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No scenario runs" };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly rowSelection: RowSelectionOptions = {
    mode: "multiRow",
  };

  readonly selectionColumnDef: SelectionColumnDef = {
    pinned: "left",
    sortable: false,
    width: 50,
    maxWidth: 50,
  };

  readonly columnDefinitions: ColDef<MultiSelectScenarioRunViewModel>[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      sortable: true,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      sortable: true,
      cellRenderer: ScenarioRunStatusCellRendererComponent,
    },
  ];

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: false,
    filter: false,
    resizable: true,
  };

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRows =
      event.api.getSelectedRows() as MultiSelectScenarioRunViewModel[];
    this.selectedScenarioRunIds.emit(selectedRows.map((row) => row.id));
  }
}
