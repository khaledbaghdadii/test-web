import { Component, computed, effect, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { MessageService } from "primeng/api";
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import {
  ReferenceScenario,
  ReferenceScenariosService,
} from "@mxevolve/domains/business-process/data-access";
import { EnvironmentService } from "@mxevolve/domains/environment/data-access";
import { ReferenceScenarioStatusCellRendererComponent } from "./cell-renderers/scenario-status/reference-scenario-status-cell-renderer.component";
import { ReferenceScenarioDurationCellRendererComponent } from "./cell-renderers/scenario-duration/reference-scenario-duration-cell-renderer.component";
import {
  ActionsCellRendererComponent,
  CommitIdCellRendererComponent,
  EnvironmentStatusCellRendererComponent,
  StartDateCellRendererComponent,
} from "@mxevolve/domains/environment/widget";
import { ScenarioRunNameCellRendererComponent } from "@mxevolve/domains/test/ui";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-reference-scenarios-table",
  standalone: true,
  imports: [AgGridAngular],
  providers: [ReferenceScenariosService, EnvironmentService, MessageService],
  templateUrl: "./reference-scenarios-table.component.html",
})
export class ReferenceScenariosTableComponent {
  readonly projectId = input.required<string>();
  readonly referenceScenarioExecutionGroupId = input.required<string>();

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = {
    message: "No reference environments",
  };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;
  readonly actionsCellRendererComponent = ActionsCellRendererComponent;

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  };

  private readonly referenceScenariosService = inject(
    ReferenceScenariosService
  );
  private readonly toastMessageService = inject(ToastMessageService);

  readonly referenceScenariosResource = rxResource<
    ReferenceScenario[],
    { projectId: string; groupId: string }
  >({
    params: () => ({
      projectId: this.projectId(),
      groupId: this.referenceScenarioExecutionGroupId(),
    }),
    stream: ({ params }) => {
      if (!params.groupId) {
        return of<ReferenceScenario[]>([]);
      }

      return this.referenceScenariosService.fetchReferenceScenarios(
        params.projectId,
        params.groupId
      );
    },
  });

  readonly referenceScenarios = computed(() =>
    this.referenceScenariosResource.hasValue()
      ? this.referenceScenariosResource.value()
      : []
  );

  constructor() {
    effect(() => {
      if (this.referenceScenariosResource.status() === "error") {
        this.toastMessageService.showError(
          "Failed to fetch the reference environments."
        );
      }
    });
  }

  readonly columnDefinitions = computed<ColDef<ReferenceScenario>[]>(() => [
    {
      field: "tpkName",
      headerName: "Scenario Name",
      cellRendererSelector: (params) => ({
        component: ScenarioRunNameCellRendererComponent,
        params: {
          projectId: this.projectId(),
          scenarioRunId: params.data?.scenarioExecutionId,
          name: params.data?.tpkName,
        },
      }),
    },
    {
      field: "scenarioStatus",
      headerName: "Scenario Status",
      cellRenderer: ReferenceScenarioStatusCellRendererComponent,
    },
    {
      headerName: "Environment status",
      valueGetter: (params) => params.data?.environment?.status,
      cellRenderer: EnvironmentStatusCellRendererComponent,
    },
    {
      field: "scenarioStartDate",
      headerName: "Start Date",
      cellRenderer: StartDateCellRendererComponent,
    },
    {
      headerName: "Duration",
      sortable: false,
      cellRenderer: ReferenceScenarioDurationCellRendererComponent,
    },
    {
      field: "tpkCommitId",
      headerName: "Commit Id",
      cellRenderer: CommitIdCellRendererComponent,
    },
    {
      field: "tpkMxVersion",
      headerName: "Mx version",
      valueFormatter: (params: ValueFormatterParams<ReferenceScenario>) =>
        params.value || "-",
    },
    {
      field: "tpkMxBuildId",
      headerName: "Mx build id",
      valueFormatter: (params: ValueFormatterParams<ReferenceScenario>) =>
        params.value || "-",
    },
    {
      headerName: "Actions",
      sortable: false,
      cellRendererSelector: (params) => ({
        component: this.actionsCellRendererComponent,
        params: {
          projectId: this.projectId(),
          environment: params.data?.environment,
        },
      }),
    },
  ]);
}
