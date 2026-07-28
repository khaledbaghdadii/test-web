import { Component, computed, effect, input, inject } from "@angular/core";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-enterprise";
import { DialogService } from "primeng/dynamicdialog";
import { ScenarioExecutionService } from "@mxflow/test-management/execution";
import { catchError, map, of, switchMap } from "rxjs";
import { CommitIdCellRendererComponent } from "../commit-id-cell-renderer/commit-id-cell-renderer.component";
import { CommitTestExecutionsCellRendererComponent } from "../commit-test-executions-cell-renderer/commit-test-executions-cell-renderer.component";
import { CommitTestExecutionRow } from "../commit-test-executions-dialog/commit-test-executions-dialog.component";
import {
  BlankLoadingCellRendererComponent,
  DateCellRendererComponent,
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { TestExecutionsByCommitIdService } from "../test-executions-by-commit-id/test-executions-by-commit-id.service";

const PAGE_SIZE = 5;

@Component({
  selector: "mxevolve-paginated-commits-difference",
  standalone: true,
  imports: [AgGridAngular],
  providers: [
    CommitsService,
    DialogService,
    ScenarioExecutionService,
    TestExecutionsByCommitIdService,
  ],
  template: `
    <ag-grid-angular
      class="w-full"
      rowModelType="serverSide"
      [pagination]="true"
      [paginationPageSize]="pageSize"
      [paginationPageSizeSelector]="pageSizeOptions"
      [cacheBlockSize]="pageSize"
      [columnDefs]="colDefs"
      [defaultColDef]="defaultColDef"
      [noRowsOverlayComponent]="noRowsOverlayComponent"
      [noRowsOverlayComponentParams]="noRowsOverlayParams()"
      [loadingOverlayComponent]="loadingOverlayComponent"
      [loadingCellRenderer]="blankLoadingCellRenderer"
      [domLayout]="'autoHeight'"
      (gridReady)="onGridReady($event)"
    />
  `,
})
export class PaginatedCommitsDifferenceComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly source = input.required<string>();
  readonly destination = input.required<string>();
  readonly noRowsMessage = input<string>("No commits found");

  private readonly commitsService = inject(CommitsService);
  private readonly testExecutionsByCommitIdService = inject(
    TestExecutionsByCommitIdService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private gridApi: GridApi | undefined;

  readonly pageSize = PAGE_SIZE;
  readonly pageSizeOptions = [5, 10, 20, 50, 100];

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly blankLoadingCellRenderer = BlankLoadingCellRendererComponent;
  readonly noRowsOverlayParams = computed(() => ({
    message: this.noRowsMessage(),
  }));
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColDef: ColDef = {
    flex: 1,
    sortable: false,
    resizable: true,
  };

  readonly colDefs: ColDef[] = [
    {
      field: "id",
      headerName: "Commit ID",
      minWidth: 120,
      cellRenderer: CommitIdCellRendererComponent,
    },
    {
      field: "message",
      headerName: "Message",
      minWidth: 200,
      flex: 2,
    },
    {
      field: "committerDisplayName",
      headerName: "Author",
      minWidth: 150,
    },
    {
      field: "timeStamp",
      headerName: "Date",
      minWidth: 180,
      cellRenderer: DateCellRendererComponent,
      sort: "desc",
    },
    {
      headerName: "Test Runs",
      minWidth: 200,
      sortable: false,
      cellRenderer: CommitTestExecutionsCellRendererComponent,
    },
  ];

  constructor() {
    effect(() => {
      const _projectId = this.projectId();
      const _repositoryId = this.repositoryId();
      const _source = this.source();
      const _destination = this.destination();
      if (this.gridApi) {
        this.gridApi.setGridOption(
          "serverSideDatasource",
          this.createDatasource(
            _projectId,
            _repositoryId,
            _source,
            _destination
          )
        );
      }
    });
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridApi.setGridOption(
      "serverSideDatasource",
      this.createDatasource(
        this.projectId(),
        this.repositoryId(),
        this.source(),
        this.destination()
      )
    );
  }

  private createDatasource(
    projectId: string,
    repositoryId: string,
    source: string,
    destination: string
  ): IServerSideDatasource {
    const commitsService = this.commitsService;
    const testExecutionsByCommitIdService =
      this.testExecutionsByCommitIdService;
    const toastMessageService = this.toastMessageService;
    return {
      getRows(params: IServerSideGetRowsParams): void {
        const startRow = params.request.startRow ?? 0;
        const page = Math.floor(startRow / PAGE_SIZE);

        params.api.setGridOption("loading", true);

        commitsService
          .getPaginatedCommitDifferences({
            projectId,
            repositoryId,
            source,
            destination,
            page,
            size: PAGE_SIZE,
          })
          .pipe(
            switchMap((response) => {
              const commitIds = response.content.map((commit) => commit.id);
              if (commitIds.length === 0) {
                return of({
                  response,
                  executionsByCommitId: {} as Record<
                    string,
                    CommitTestExecutionRow[]
                  >,
                });
              }

              return testExecutionsByCommitIdService
                .getExecutionsGroupedByCommitId(projectId, commitIds)
                .pipe(
                  catchError(() =>
                    of({} as Record<string, CommitTestExecutionRow[]>)
                  ),
                  map((executionsByCommitId) => ({
                    response,
                    executionsByCommitId,
                  }))
                );
            })
          )
          .subscribe({
            next: ({ response, executionsByCommitId }) => {
              const enrichedRows = response.content.map((commit) => ({
                ...commit,
                executions: executionsByCommitId[commit.id] ?? [],
              }));
              const lastRow = response.last
                ? startRow + response.content.length
                : undefined;
              params.success({
                rowData: enrichedRows,
                rowCount: lastRow,
              });
              params.api.setGridOption("loading", false);
              if (startRow === 0 && enrichedRows.length === 0) {
                params.api.showNoRowsOverlay();
              } else {
                params.api.hideOverlay();
              }
            },
            error: () => {
              toastMessageService.showError("Couldn't fetch commits");
              params.api.setGridOption("loading", false);
              params.fail();
            },
          });
      },
    };
  }
}
