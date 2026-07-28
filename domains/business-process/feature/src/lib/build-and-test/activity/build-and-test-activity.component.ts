import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { Button } from "primeng/button";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AuthenticationService } from "@mxflow/core/auth";
import { catchError, map, of } from "rxjs";
import { rxResource } from "@angular/core/rxjs-interop";
import type { ColDef, ValueGetterParams } from "ag-grid-enterprise";
import {
  BuildAndTestExecutionsService,
  BuildAndTestExecutionSummary,
  SharedJiraDetailsService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ActivityRunsHeaderFilterComponent,
  ActivityRunsTableComponent,
  MyRunsToggleComponent,
  type ActivityRunsActionsColumn,
  type ActivityRunsHeaderFilterOption,
  type ActivityRunsHeaderFilterParams,
} from "@mxevolve/domains/business-process/widget";
import {
  BuildAndTestTemplatesDialogComponent,
  RunActionsCellComponent,
  type RepushEligibleEvent,
  type RunActionsRow,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import {
  BuildAndTestRunNameCellComponent,
  BuildAndTestRunStatusCellComponent,
  BuildAndTestRunUserStoriesCellComponent,
} from "./build-and-test-activity.cells";
import {
  BT_ACTIVE_STATUSES,
  BT_HISTORY_STATUSES,
  buildAndTestLoadPage,
} from "./build-and-test-activity.queries";

/** A Build & Test run row enriched with the fields the Actions cell needs. */
type BuildAndTestRunRow = BuildAndTestExecutionSummary & RunActionsRow;

/** Status multiselect options for the Status column header filter. */
const BT_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] = Object.values(
  ExecutionStatus
).map((status) => ({ label: status.replaceAll("_", " "), value: status }));

/** Status options limited to the Active table's in-flight statuses. */
const BT_ACTIVE_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  BT_STATUS_OPTIONS.filter((option) =>
    BT_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/** Status options limited to the History (Inactive) table's terminal statuses. */
const BT_HISTORY_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  BT_STATUS_OPTIONS.filter(
    (option) => !BT_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/**
 * Build & Test activity landing page. Renders two backend-paginated
 * {@link ActivityRunsTableComponent} instances — **Active Runs** (in-flight
 * statuses, revealed by default) and **History** (the rest, behind a Show
 * History toggle) — over the shared executions service. A single
 * {@link SharedJiraDetailsService} call resolves the Jira base url once for the
 * whole page (AC-7 N+1 fix) and feeds every user-story link. The My Runs
 * toggle scopes both tables to the current user while keeping Owner visible.
 */
@Component({
  selector: "mxevolve-build-and-test-activity",
  imports: [
    Button,
    MxevolveIconComponent,
    ActivityRunsTableComponent,
    MyRunsToggleComponent,
    BuildAndTestTemplatesDialogComponent,
  ],
  providers: [BuildAndTestExecutionsService],
  templateUrl: "./build-and-test-activity.component.html",
})
export class BuildAndTestActivityComponent {
  readonly projectId = input.required<string>();

  private readonly executionsService = inject(BuildAndTestExecutionsService);
  private readonly sharedJiraDetails = inject(SharedJiraDetailsService);
  private readonly authService = inject(AuthenticationService);

  protected readonly activeStatuses = BT_ACTIVE_STATUSES;
  protected readonly historyStatuses = BT_HISTORY_STATUSES;

  protected readonly historyShown = signal(false);
  protected readonly ownerPhrase = signal<string | undefined>(
    this.authService.getUsername() || undefined
  );

  protected readonly templatesDialog = viewChild.required(
    BuildAndTestTemplatesDialogComponent
  );

  /**
   * Resolves the project's Jira base url exactly once for the page (shared,
   * de-duplicated request); falls back to an empty url so user-story ids still
   * render as plain text if the lookup fails.
   */
  private readonly jiraDetails = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.sharedJiraDetails.getJiraDetails(params.projectId).pipe(
        map((details) => details.jiraBaseUrl),
        catchError(() => of(""))
      ),
  });

  protected readonly jiraBaseUrl = computed(
    () => this.jiraDetails.value() ?? ""
  );

  /** Shared page loader: backend-paginated runs enriched for the Actions cell. */
  protected readonly loadPage = computed(() => {
    const projectId = this.projectId();
    const base = buildAndTestLoadPage(this.executionsService, projectId);
    return (req: Parameters<typeof base>[0]) =>
      base(req).pipe(
        map((page) => ({
          total: page.total,
          rows: page.rows.map(
            (row): BuildAndTestRunRow => ({
              ...row,
              projectId,
              processId: row.id,
              status: row.status ?? ExecutionStatus.NA,
              familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
              sourceDefinitionId: row.sourceDefinitionId,
            })
          ),
        }))
      );
  });

  /**
   * Column definitions for a runs table. User-story links carry the once-
   * resolved Jira base url. The Status column's
   * filter options are supplied per table so the Active and History tables only
   * offer the statuses they can actually contain.
   */
  private columnDefsFor(
    statusOptions: ActivityRunsHeaderFilterOption[]
  ): ColDef<BuildAndTestRunRow>[] {
    const projectId = this.projectId();
    const jiraBaseUrl = this.jiraBaseUrl();
    return [
      {
        colId: "name",
        field: "name",
        headerName: "Execution Name",
        cellRenderer: BuildAndTestRunNameCellComponent,
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
        cellRenderer: BuildAndTestRunStatusCellComponent,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("statuses", "multiselect", {
          options: statusOptions,
        }),
      },
      {
        colId: "userStoryIds",
        field: "userStoryIds",
        headerName: "User Stories IDs",
        cellRenderer: BuildAndTestRunUserStoriesCellComponent,
        cellRendererParams: { jiraBaseUrl },
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("userStoryIds", "text", {
          placeholder: "Filter user story",
        }),
      },
      {
        colId: "configurationBranchName",
        field: "configurationBranchName",
        headerName: "Configuration Branch Name",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "configurationBranchNamePhrase",
          "text",
          { placeholder: "Filter branch" }
        ),
      },
      {
        colId: "owner",
        field: "owner",
        headerName: "Owner",
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
        valueFormatter: formatDate,
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("endDateRange", "dateRange"),
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
        colId: "daysExtended",
        field: "daysExtended",
        headerName: "Days Extended",
        sortable: true,
      },
      {
        colId: "duration",
        headerName: "Duration",
        valueGetter: durationValueGetter,
      },
      {
        colId: "businessProcessDefinitionName",
        field: "businessProcessDefinitionName",
        headerName: "Business Process Definition",
        cellRenderer: DefinitionDetailsLinkCellComponent,
        cellRendererParams: { projectId },
      },
      {
        colId: "processName",
        field: "processName",
        headerName: "Process Name",
      },
    ];
  }

  /** Column definitions for the Active table (active-only status filter). */
  protected readonly activeColumnDefs = computed<ColDef<BuildAndTestRunRow>[]>(
    () => this.columnDefsFor(BT_ACTIVE_STATUS_OPTIONS)
  );

  /** Column definitions for the History table (history-only status filter). */
  protected readonly historyColumnDefs = computed<ColDef<BuildAndTestRunRow>[]>(
    () => this.columnDefsFor(BT_HISTORY_STATUS_OPTIONS)
  );

  /** Active table: live abort + repush available. */
  protected readonly activeActionsColumn: ActivityRunsActionsColumn<BuildAndTestRunRow> =
    {
      cellRenderer: RunActionsCellComponent,
      cellRendererParams: {
        onRepush: (event: RepushEligibleEvent) => this.onRepush(event),
      },
    };

  /** History table: terminal rows — abort rendered non-abortable, repush kept. */
  protected readonly historyActionsColumn: ActivityRunsActionsColumn<BuildAndTestRunRow> =
    {
      cellRenderer: RunActionsCellComponent,
      cellRendererParams: {
        terminal: true,
        onRepush: (event: RepushEligibleEvent) => this.onRepush(event),
      },
    };

  protected onOwnerPhrase(ownerPhrase: string | undefined): void {
    this.ownerPhrase.set(ownerPhrase);
  }

  protected toggleHistory(): void {
    this.historyShown.update((shown) => !shown);
  }

  protected onBuild(): void {
    this.templatesDialog().open();
  }

  /** Repush eligibility passed: open the executor pre-filled from the run. */
  protected onRepush(event: RepushEligibleEvent): void {
    this.templatesDialog().openRepush(event.processId);
  }

  private filterParams(
    filterKey: string,
    filterType: ActivityRunsHeaderFilterParams["filterType"],
    extra: Partial<ActivityRunsHeaderFilterParams> = {}
  ): ActivityRunsHeaderFilterParams {
    return { filterKey, filterType, ...extra };
  }
}

/** Formats an ISO date string for display; blanks empty values. */
function formatDate(params: { value?: string | null }): string {
  return params.value ? new Date(params.value).toLocaleString() : "";
}

/** Derives a run's duration (start → end) as a `h m` string. */
function durationValueGetter(
  params: ValueGetterParams<BuildAndTestRunRow>
): string {
  const start = params.data?.startDate;
  const end = params.data?.endDate;
  if (!start || !end) {
    return "";
  }
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    return "";
  }
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}
