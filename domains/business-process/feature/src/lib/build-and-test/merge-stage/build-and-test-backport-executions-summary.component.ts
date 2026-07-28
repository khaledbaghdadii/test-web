import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  BuildAndTestExecutionsService,
  BuildAndTestExecutionSummary,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import {
  BINARY_UPGRADE_MFE_PATH,
  BUILD_AND_TEST_PROCESS_PATH,
} from "@mxevolve/shared/core/config";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { Message } from "primeng/message";
import { catchError, of } from "rxjs";
import { BuildAndTestBackportLinkCellRendererComponent } from "./cell-renderers/build-and-test-backport-link-cell-renderer.component";
import { BuildAndTestBackportStatusCellRendererComponent } from "./cell-renderers/build-and-test-backport-status-cell-renderer.component";

ModuleRegistry.registerModules([AllCommunityModule]);

const MASTER_VALIDATION_MFE_PATH = "validation-processes";

interface BackportExecutionRow {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly status?: ExecutionStatus;
}

interface FailedBackportDefinitionRow {
  readonly id: string;
  readonly name: string;
  readonly href: string;
}

@Component({
  selector: "mxevolve-build-and-test-backport-executions-summary",
  imports: [AgGridAngular, Message, MxevolveIconComponent],
  providers: [BuildAndTestExecutionsService, BusinessProcessDefinitionService],
  templateUrl: "./build-and-test-backport-executions-summary.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBackportExecutionsSummaryComponent {
  readonly projectId = input.required<string>();
  readonly backportExecutionIds = input<string[]>([]);
  readonly failedBackportDefinitionIds = input<string[]>([]);
  readonly integrateDestinationBranch = input<string>("");
  readonly backportDestinationBranches = input<string[]>([]);

  private readonly errorMessage = signal<string | undefined>(undefined);

  readonly backportExecutionsResource = rxResource({
    params: () => {
      const ids = this.backportExecutionIds();
      if (ids.length === 0) return undefined;
      return { projectId: this.projectId(), ids };
    },
    stream: ({ params }) =>
      this.buildAndTestExecutionsService
        .getBuildAndTestExecutions(params.projectId, { ids: params.ids })
        .pipe(
          catchError(() => {
            this.errorMessage.set("Failed to fetch backport executions");
            return of({ content: [], totalElements: 0 });
          })
        ),
  });

  readonly failedBackportDefinitionsResource = rxResource({
    params: () => {
      const ids = this.failedBackportDefinitionIds();
      if (ids.length === 0) return undefined;
      return { projectId: this.projectId(), ids };
    },
    stream: ({ params }) =>
      this.businessProcessDefinitionService
        .getBusinessProcessDefinitions({ projectId: params.projectId })
        .pipe(catchError(() => of([]))),
  });

  readonly backportExecutionRows = computed<BackportExecutionRow[]>(() => {
    const ids = this.backportExecutionIds();
    const response = this.backportExecutionsResource.value();
    const executions = response?.content ?? [];
    const foundRows = executions.map((execution) =>
      this.toExecutionRow(execution)
    );
    const missingRows = ids
      .filter((id) => !executions.some((execution) => execution.id === id))
      .map((id) => ({
        id,
        name: id,
        href: this.buildExecutionHref(id),
        status: undefined,
      }));
    return [...foundRows, ...missingRows];
  });

  readonly failedBackportDefinitionRows = computed<
    FailedBackportDefinitionRow[]
  >(() => {
    const ids = this.failedBackportDefinitionIds();
    const definitions = this.failedBackportDefinitionsResource.value() ?? [];
    return definitions
      .filter((definition) => ids.includes(definition.id))
      .map((definition) => ({
        id: definition.id,
        name: definition.name,
        href: this.buildDefinitionHref(definition.id),
      }));
  });

  readonly missingDefinitionIds = computed(() => {
    const definitions = this.failedBackportDefinitionsResource.value() ?? [];
    return this.failedBackportDefinitionIds().filter(
      (id) => !definitions.some((definition) => definition.id === id)
    );
  });

  readonly showEmptyBackportInfo = computed(
    () =>
      this.backportExecutionIds().length === 0 &&
      this.failedBackportDefinitionIds().length === 0 &&
      this.missingDefinitionIds().length === 0 &&
      !!this.integrateDestinationBranch()
  );

  readonly infoMessage = computed(() => {
    const destinationBranches = this.backportDestinationBranches();
    if (destinationBranches.length === 0) {
      return `Backport processes will start after changes are integrated into ${this.integrateDestinationBranch()}.`;
    }
    return `Backport into ${destinationBranches.join(
      ", "
    )} will start after integrating into ${this.integrateDestinationBranch()} passes`;
  });

  readonly missingDefinitionsMessage = computed(() =>
    this.missingDefinitionIds().length === 0
      ? undefined
      : `These business process definitions could not be fetched and executed: ${this.missingDefinitionIds().join(
          ", "
        )}.`
  );

  readonly executionColumnDefinitions: ColDef<BackportExecutionRow>[] = [
    {
      headerName: "Name",
      field: "name",
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: BuildAndTestBackportLinkCellRendererComponent,
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: BuildAndTestBackportStatusCellRendererComponent,
    },
  ];

  readonly failedDefinitionColumnDefinitions: ColDef<FailedBackportDefinitionRow>[] =
    [
      {
        headerName: "Process Template Name",
        field: "name",
        flex: 1,
        sortable: true,
        filter: true,
        cellRenderer: BuildAndTestBackportLinkCellRendererComponent,
      },
    ];

  readonly defaultColumnDefinition: ColDef = {
    resizable: true,
    minWidth: 140,
  };

  private readonly buildAndTestExecutionsService = inject(
    BuildAndTestExecutionsService
  );
  private readonly businessProcessDefinitionService = inject(
    BusinessProcessDefinitionService
  );

  get executionFetchError(): string | undefined {
    return this.errorMessage();
  }

  private toExecutionRow(
    execution: BuildAndTestExecutionSummary
  ): BackportExecutionRow {
    return {
      id: execution.id,
      name: execution.name ?? execution.id,
      href: this.buildExecutionHref(execution.id),
      status: execution.status,
    };
  }

  private buildExecutionHref(id: string): string {
    return `/app/${this.projectId()}/business-process${this.buildExecutionUri(
      id
    )}`;
  }

  private buildExecutionUri(id: string): string {
    const [businessProcessType] = id.split("__");
    if (businessProcessType === ExecutionFamily.UPGRADE_PROCESS) {
      return `/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`;
    }
    if (businessProcessType === ExecutionFamily.USER_STORY_BUILD_AND_TEST) {
      return `/${BUILD_AND_TEST_PROCESS_PATH}/execution/${id}`;
    }
    if (businessProcessType === ExecutionFamily.VALIDATION_PROCESS) {
      return `/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`;
    }
    return `/execution/details/${id}`;
  }

  private buildDefinitionHref(id: string): string {
    return `/app/${this.projectId()}/business-process/definition/details/${id}`;
  }
}
