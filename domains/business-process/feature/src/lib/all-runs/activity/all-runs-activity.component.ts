import { Component, computed, inject, input, signal } from "@angular/core";
import { map, Observable } from "rxjs";
import { Button } from "primeng/button";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AuthenticationService } from "@mxflow/core/auth";
import type { ColDef } from "ag-grid-enterprise";
import {
  AllExecutionSummary,
  AllExecutionsService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ActivityRunsHeaderFilterComponent,
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
  type ActivityRunsPage,
  type ActivityRunsPageRequest,
  type ActivityRunsActionsColumn,
  type ActivityRunsHeaderFilterOption,
  type ActivityRunsHeaderFilterParams,
} from "@mxevolve/domains/business-process/widget";
import {
  RunActionsCellComponent,
  type RunActionsRow,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import {
  AllRunsNameCellComponent,
  AllRunsStatusCellComponent,
} from "./all-runs-activity.cells";
import {
  ALL_RUNS_ACTIVE_STATUSES,
  ALL_RUNS_HISTORY_STATUSES,
  allRunsLoadPage,
} from "./all-runs-activity.queries";

type AllRunsRow = AllExecutionSummary & RunActionsRow;
type AllRunsPageLoader = (
  req: ActivityRunsPageRequest
) => Observable<ActivityRunsPage<AllRunsRow>>;

const ALL_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] = Object.values(
  ExecutionStatus
).map((status) => ({ label: status.replaceAll("_", " "), value: status }));

const ALL_ACTIVE_STATUS_OPTIONS = ALL_STATUS_OPTIONS.filter((option) =>
  ALL_RUNS_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
);

const ALL_HISTORY_STATUS_OPTIONS = ALL_STATUS_OPTIONS.filter(
  (option) =>
    !ALL_RUNS_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
);

const OFFICIALITY_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "Official", value: "OFFICIAL" },
  { label: "Unofficial", value: "UNOFFICIAL" },
  { label: "N/A", value: "NA" },
];

@Component({
  selector: "mxevolve-all-runs-activity",
  imports: [
    Button,
    MxevolveIconComponent,
    ActivityRunsTableComponent,
    MyRunsToggleComponent,
  ],
  providers: [AllExecutionsService],
  templateUrl: "./all-runs-activity.component.html",
})
export class AllRunsActivityComponent {
  readonly projectId = input.required<string>();

  private readonly executionsService = inject(AllExecutionsService);
  private readonly authService = inject(AuthenticationService);

  protected readonly activeStatuses = ALL_RUNS_ACTIVE_STATUSES;
  protected readonly historyStatuses = ALL_RUNS_HISTORY_STATUSES;
  protected readonly historyShown = signal(false);
  protected readonly ownerPhrase = signal<string | undefined>(
    this.authService.getUsername() || undefined
  );

  protected readonly loadPage = computed<AllRunsPageLoader>(() => {
    const projectId = this.projectId();
    const base = allRunsLoadPage(this.executionsService, projectId);
    return (req: Parameters<typeof base>[0]) =>
      base(req).pipe(
        map((page) => ({
          total: page.total,
          rows: page.rows.map(
            (row): AllRunsRow => ({
              ...row,
              projectId,
              processId: row.id,
              status: row.status ?? ExecutionStatus.NA,
              familyId:
                row.familyId ?? ExecutionFamily.USER_STORY_BUILD_AND_TEST,
              sourceDefinitionId: row.sourceDefinitionId,
            })
          ),
        }))
      );
  });

  private columnDefsFor(
    statusOptions: ActivityRunsHeaderFilterOption[]
  ): ColDef<AllRunsRow>[] {
    const projectId = this.projectId();
    return [
      {
        colId: "name",
        field: "name",
        headerName: "Execution Name",
        cellRenderer: AllRunsNameCellComponent,
        cellRendererParams: { projectId },
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("namePhrase", "text", {
          placeholder: "Filter name",
        }),
      },
      {
        colId: "status",
        field: "status",
        headerName: "Status",
        cellRenderer: AllRunsStatusCellComponent,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("statuses", "multiselect", {
          options: statusOptions,
        }),
      },
      {
        colId: "officiality",
        field: "officiality",
        headerName: "Official Status",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("officiality", "multiselect", {
          options: OFFICIALITY_OPTIONS,
        }),
      },
      {
        colId: "owner",
        field: "owner",
        headerName: "Owner",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("ownerPhrase", "text", {
          placeholder: "Filter owner",
        }),
      },
      {
        colId: "startDate",
        field: "startDate",
        headerName: "Start Date",
        sortable: true,
        valueFormatter: formatDate,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("startDateRange", "dateRange"),
      },
      {
        colId: "endDate",
        field: "endDate",
        headerName: "End Date",
        sortable: true,
        valueFormatter: formatDate,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("endDateRange", "dateRange"),
      },
      {
        colId: "daysExtended",
        field: "daysExtended",
        headerName: "Days Extended",
        sortable: true,
      },
      {
        colId: "expiryDate",
        field: "expiryDate",
        headerName: "Expiry Date",
        sortable: true,
        valueFormatter: formatDate,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "expiryDateRange",
          "dateRange"
        ),
      },
      {
        colId: "businessProcessDefinitionName",
        field: "businessProcessDefinitionName",
        headerName: "Business Process Definition",
        cellRenderer: DefinitionDetailsLinkCellComponent,
        cellRendererParams: { projectId },
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "businessProcessDefinitionNamePhrase",
          "text",
          { placeholder: "Filter definition" }
        ),
      },
    ];
  }

  protected readonly activeColumnDefs = computed<ColDef<AllRunsRow>[]>(() =>
    this.columnDefsFor(ALL_ACTIVE_STATUS_OPTIONS)
  );

  protected readonly historyColumnDefs = computed<ColDef<AllRunsRow>[]>(() =>
    this.columnDefsFor(ALL_HISTORY_STATUS_OPTIONS)
  );

  protected readonly activeActionsColumn: ActivityRunsActionsColumn<AllRunsRow> =
    {
      cellRenderer: RunActionsCellComponent,
    };

  protected readonly historyActionsColumn: ActivityRunsActionsColumn<AllRunsRow> =
    {
      cellRenderer: RunActionsCellComponent,
      cellRendererParams: { terminal: true },
    };

  protected onOwnerPhrase(ownerPhrase: string | undefined): void {
    this.ownerPhrase.set(ownerPhrase);
  }

  protected toggleHistory(): void {
    this.historyShown.update((shown) => !shown);
  }

  private filterParams(
    filterKey: string,
    filterType: ActivityRunsHeaderFilterParams["filterType"],
    extra: Partial<ActivityRunsHeaderFilterParams> = {}
  ): ActivityRunsHeaderFilterParams {
    return { filterKey, filterType, ...extra };
  }
}

function formatDate(params: { value?: string | null }): string {
  return params.value ? new Date(params.value).toLocaleString() : "";
}
