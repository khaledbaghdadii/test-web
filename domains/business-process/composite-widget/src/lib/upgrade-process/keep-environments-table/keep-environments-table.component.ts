import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef } from "ag-grid-enterprise";
import {
  AllCommunityModule,
  type FirstDataRenderedEvent,
  ModuleRegistry,
  type SelectionChangedEvent,
} from "ag-grid-community";
import { catchError, map, type Observable, of } from "rxjs";
import { Message } from "primeng/message";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TableLoadingOverlayComponent } from "@mxevolve/shared/ui/table";
import {
  type FurtherAnalysisCandidate,
  FurtherAnalysisService,
  type SelectedFurtherAnalysisResource,
} from "@mxevolve/domains/business-process/data-access";
import {
  KeepEnvironmentsLinkCellRendererComponent,
  type LinkCellRendererParams,
} from "./link-renderer/keep-environments-link-cell-renderer.component";
import { KeepEnvironmentsIncidentsCellRendererComponent } from "./link-renderer/incidents/keep-environments-incidents-cell-renderer.component";

ModuleRegistry.registerModules([AllCommunityModule]);

const REFERENCE_ENVIRONMENT = "REFERENCE_ENVIRONMENT";

@Component({
  selector: "mxevolve-keep-environments-table",
  imports: [AgGridAngular, Message],
  providers: [FurtherAnalysisService],
  templateUrl: "./keep-environments-table.component.html",
})
export class KeepEnvironmentsTableComponent {
  readonly mode = input.required<"edit" | "readonly">();
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly preselectedEnvironmentIds = input<string[]>([]);
  readonly preselectedScenarioIds = input<string[]>([]);

  readonly selectionChanged = output<KeepEnvironmentsSelection>();

  private readonly furtherAnalysisService = inject(FurtherAnalysisService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly hasError = signal(false);

  private readonly candidatesResource = rxResource({
    params: () => ({
      mode: this.mode(),
      projectId: this.projectId(),
      processId: this.processId(),
    }),
    stream: ({ params }): Observable<KeepEnvironmentsRowData[]> => {
      this.hasError.set(false);
      if (params.mode === "edit") {
        return this.furtherAnalysisService
          .getFurtherAnalysisCandidates(params.projectId, params.processId)
          .pipe(
            map((response) => response.candidates),
            catchError((error) => {
              this.hasError.set(true);
              this.toastMessageService.showError(error.message);
              return of([] as KeepEnvironmentsRowData[]);
            })
          );
      }
      return this.furtherAnalysisService
        .getSelectedResources(params.projectId, params.processId)
        .pipe(
          map((response) => response.resources),
          catchError((error) => {
            this.hasError.set(true);
            this.toastMessageService.showError(error.message);
            return of([] as KeepEnvironmentsRowData[]);
          })
        );
    },
  });

  readonly rowData = computed<KeepEnvironmentsRowData[]>(() => {
    return this.candidatesResource.value() ?? [];
  });

  readonly isEmpty = computed(
    () => this.rowData().length === 0 && !this.hasError()
  );
  readonly isLoading = computed(() => this.candidatesResource.isLoading());

  readonly rowSelectionConfig = {
    mode: "multiRow" as const,
    checkboxes: true,
    headerCheckbox: true,
  };

  readonly columnDefinitions = computed<ColDef<KeepEnvironmentsRowData>[]>(
    () => [
      this.buildEnvironmentIdColDef(),
      this.buildTpkNameColDef(),
      this.buildEvitColDef(),
    ]
  );

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: false,
    filter: false,
    resizable: true,
  };

  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  onFirstDataRendered(event: FirstDataRenderedEvent): void {
    const preselectedEnvIds = this.preselectedEnvironmentIds();
    const preselectedScenarioIds = this.preselectedScenarioIds();
    if (
      this.mode() !== "edit" ||
      (preselectedEnvIds.length === 0 && preselectedScenarioIds.length === 0)
    )
      return;
    event.api.forEachNode((row) => {
      const data = row.data as KeepEnvironmentsRowData | undefined;
      if (!data) return;
      if (
        this.shouldSelectRow(data, preselectedEnvIds, preselectedScenarioIds)
      ) {
        row.setSelected(true);
      }
    });
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    if (this.mode() === "readonly") return;
    const selectedRows =
      event.api.getSelectedRows() as KeepEnvironmentsRowData[];
    const environmentIds = selectedRows
      .filter((row) => !row.linkedScenario)
      .map((row) => row.id);
    const scenarioIds = [
      ...new Set(
        selectedRows
          .map((row) => row.linkedScenario?.id)
          .filter((id): id is string => !!id)
      ),
    ];
    this.selectionChanged.emit({ environmentIds, scenarioIds });
  }

  private buildEnvironmentIdColDef(): ColDef<KeepEnvironmentsRowData> {
    return {
      field: "id",
      headerName: "Environment Id",
      autoHeight: true,
      valueGetter: (params) => params.data?.id ?? "-",
      cellRenderer: KeepEnvironmentsLinkCellRendererComponent,
      cellRendererParams: {
        linkTemplate: (data: KeepEnvironmentsRowData) =>
          data.id ? `/app/${this.projectId()}/environments/${data.id}` : null,
        tagLabel: (data: KeepEnvironmentsRowData) =>
          data.tags?.includes(REFERENCE_ENVIRONMENT) ? "Ref env" : null,
      } as Partial<LinkCellRendererParams>,
    };
  }

  private buildTpkNameColDef(): ColDef<KeepEnvironmentsRowData> {
    return {
      headerName: "TPK Name",
      valueGetter: (params) => params.data?.linkedScenario?.name ?? "-",
      cellRenderer: KeepEnvironmentsLinkCellRendererComponent,
      cellRendererParams: {
        linkTemplate: (data: KeepEnvironmentsRowData) =>
          data.linkedScenario?.id
            ? `/app/${this.projectId()}/test/execution/details/${
                data.linkedScenario.id
              }`
            : null,
      } as Partial<LinkCellRendererParams>,
    };
  }

  private buildEvitColDef(): ColDef<KeepEnvironmentsRowData> {
    return {
      headerName: "EVIT",
      valueGetter: (params) => params.data?.linkedScenario?.linkedIncidents,
      cellRenderer: KeepEnvironmentsIncidentsCellRendererComponent,
    };
  }

  private shouldSelectRow(
    data: KeepEnvironmentsRowData,
    preselectedEnvIds: string[],
    preselectedScenarioIds: string[]
  ): boolean {
    return data.linkedScenario
      ? preselectedScenarioIds.includes(data.linkedScenario.id)
      : preselectedEnvIds.includes(data.id);
  }
}

export interface KeepEnvironmentsSelection {
  environmentIds: string[];
  scenarioIds: string[];
}

export type KeepEnvironmentsRowData =
  | FurtherAnalysisCandidate
  | SelectedFurtherAnalysisResource;
