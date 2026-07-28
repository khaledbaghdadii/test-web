import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-enterprise";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import type { Observable } from "rxjs";
import type {
  ActivityRunsActionsColumn,
  ActivityRunsPage,
  ActivityRunsPageRequest,
  ActivityRunsTableContext,
} from "./activity-runs-table.types";

/**
 * Reusable, activity-agnostic runs table. Renders a backend-paginated AG Grid
 * (serverSide row model) using the consumer's column definitions, with custom
 * header filter controls (no built-in AG Grid filter UI), an optional sticky
 * (pinned-right) Actions column, and loading / no-rows overlays. Both the
 * Active Runs and Show History tables are instances of this widget configured
 * with a different status set; the data loader is supplied by the consumer.
 */
@Component({
  selector: "mxevolve-activity-runs-table",
  imports: [AgGridAngular],
  templateUrl: "./activity-runs-table.component.html",
  styleUrls: ["./activity-runs-table.component.scss"],
})
export class ActivityRunsTableComponent<T = unknown> {
  readonly projectId = input.required<string>();
  readonly columnDefs = input.required<ColDef<T>[]>();
  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50, 100]);
  readonly statuses = input.required<string[]>();
  readonly ownerPhrase = input<string | undefined>(undefined);
  readonly loadPage =
    input.required<
      (req: ActivityRunsPageRequest) => Observable<ActivityRunsPage<T>>
    >();
  readonly actionsColumn = input<ActivityRunsActionsColumn<T> | undefined>(
    undefined
  );
  readonly noRowsMessage = input<string>("No runs found");

  private readonly toastMessageService = inject(ToastMessageService);
  private gridApi: GridApi<T> | undefined;

  /** Column filter values keyed by the consumer's `filterKey`. */
  private readonly filters = signal<Record<string, unknown>>({});

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayParams = computed(() => ({
    message: this.noRowsMessage(),
  }));
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColDef: ColDef<T> = {
    flex: 1,
    minWidth: 160,
    sortable: false,
    resizable: true,
    filter: false,
    suppressHeaderMenuButton: true,
  };

  /** Stable context so custom header filters can read/publish filter values. */
  readonly gridContext: ActivityRunsTableContext = {
    getFilterValue: (key) => this.filters()[key],
    setFilterValue: (key, value) => this.onFilterChange(key, value),
  };

  /** Consumer columns plus the sticky (pinned-right) Actions column. */
  readonly effectiveColumnDefs = computed<ColDef<T>[]>(() => {
    const columns = [...this.columnDefs()];
    const actions = this.actionsColumn();
    if (actions) {
      columns.push(this.buildActionsColumn(actions));
    }
    return columns;
  });

  constructor() {
    // Re-fetch whenever any query input changes. A single stable datasource
    // reads the live signal values in `getRows`; purging the server-side cache
    // forces AG Grid to reload from the first block with the current filters,
    // status set, owner phrase and page size (resetting to the first page).
    effect(() => {
      this.projectId();
      this.statuses();
      this.ownerPhrase();
      this.pageSize();
      this.filters();
      this.loadPage();
      this.gridApi?.refreshServerSide({ purge: true });
    });
  }

  onGridReady(event: GridReadyEvent<T>): void {
    this.gridApi = event.api;
    this.gridApi.setGridOption("serverSideDatasource", this.createDatasource());
  }

  private onFilterChange(key: string, value: unknown): void {
    this.filters.update((current) => {
      const next = { ...current };
      if (value == null) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  private buildActionsColumn(actions: ActivityRunsActionsColumn<T>): ColDef<T> {
    return {
      headerName: actions.headerName ?? "Actions",
      colId: "actions",
      pinned: "right",
      lockPinned: true,
      suppressMovable: true,
      sortable: false,
      filter: false,
      resizable: false,
      width: actions.width ?? 120,
      cellRenderer: actions.cellRenderer,
      cellRendererParams: actions.cellRendererParams,
    };
  }

  private createDatasource(): IServerSideDatasource<T> {
    const toastMessageService = this.toastMessageService;
    const statuses = () => this.statuses();
    const ownerPhrase = () => this.ownerPhrase();
    const pageSize = () => this.pageSize();
    const filters = () => this.filters();
    const loadPage = () => this.loadPage();
    return {
      getRows(params: IServerSideGetRowsParams<T>): void {
        const size = pageSize();
        const startRow = params.request.startRow ?? 0;
        const page = Math.floor(startRow / size);
        const sortModel = params.request.sortModel;
        const sort =
          sortModel.length > 0
            ? `${sortModel[0].colId},${sortModel[0].sort}`
            : undefined;

        loadPage()({
          page,
          pageSize: size,
          statuses: statuses(),
          ownerPhrase: ownerPhrase(),
          sort,
          filters: filters(),
        }).subscribe({
          next: (result) => {
            params.success({
              rowData: result.rows,
              rowCount: result.total,
            });
          },
          error: () => {
            toastMessageService.showError("Couldn't load runs");
            params.fail();
          },
        });
      },
    };
  }
}
