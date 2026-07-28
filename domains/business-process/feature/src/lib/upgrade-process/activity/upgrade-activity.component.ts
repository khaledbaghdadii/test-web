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
import { catchError, map, of } from "rxjs";
import { rxResource } from "@angular/core/rxjs-interop";
import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from "ag-grid-enterprise";
import {
  BinaryUpgradeExecutionSummary,
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  UpgradeProcessListingService,
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
  RunActionsCellComponent,
  UpgradeTemplatesDialogComponent,
  type RepushEligibleEvent,
  type RunActionsRow,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import {
  UpgradeRunNameCellComponent,
  UpgradeRunStatusCellComponent,
} from "./upgrade-activity.cells";
import {
  UPG_ACTIVE_STATUSES,
  UPG_HISTORY_STATUSES,
  upgradeLoadPage,
} from "./upgrade-activity.queries";

/** An Upgrade run row enriched with the fields the Actions cell needs. */
type UpgradeRunRow = BinaryUpgradeExecutionSummary & RunActionsRow;

/**
 * Status multiselect options for the Status column header filter — the same set
 * the legacy upgrade table exposed.
 */
const UPG_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "Not Started", value: ExecutionStatus.NOT_STARTED },
  { label: "Running", value: ExecutionStatus.RUNNING },
  { label: "Passed", value: ExecutionStatus.PASSED },
  { label: "Failed", value: ExecutionStatus.FAILED },
  { label: "Pending Input", value: ExecutionStatus.PENDING_INPUT },
  { label: "Stopped", value: ExecutionStatus.STOPPED },
  { label: "Aborting", value: ExecutionStatus.ABORTING },
  { label: "Aborted", value: ExecutionStatus.ABORTED },
];

/** Status options limited to the Active table's in-flight statuses. */
const UPG_ACTIVE_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  UPG_STATUS_OPTIONS.filter((option) =>
    UPG_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/** Status options limited to the History (Inactive) table's terminal statuses. */
const UPG_HISTORY_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  UPG_STATUS_OPTIONS.filter(
    (option) => !UPG_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/** Official Status multiselect options (parity with the legacy upgrade table). */
const UPG_OFFICIALITY_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "Official", value: "OFFICIAL" },
  { label: "Unofficial", value: "UNOFFICIAL" },
  { label: "N/A", value: "NA" },
];

/** BP Quality Level multiselect options (parity with the legacy upgrade table). */
const UPG_QUALITY_LEVEL_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "DQG", value: "DQG" },
  { label: "MQG", value: "MQG" },
  { label: "N/A", value: "NA" },
];

/**
 * Upgrade activity landing page. Renders two backend-paginated
 * {@link ActivityRunsTableComponent} instances — **Active Runs** (in-flight
 * statuses, revealed by default) and **History** (the rest, behind a Show
 * History toggle) — over the migrated {@link UpgradeProcessListingService}. The
 * upgrade columns/filters/sorts match the legacy `binary-upgrade-executions`
 * table field-by-field; the project's upgrade definitions are loaded once to
 * feed the Business Process Definition / Process Name column filters. The My
 * Runs toggle scopes both tables to the current user while keeping Owner
 * visible, and the Build button opens the Upgrade templates dialog.
 */
@Component({
  selector: "mxevolve-upgrade-activity",
  imports: [
    Button,
    MxevolveIconComponent,
    ActivityRunsTableComponent,
    MyRunsToggleComponent,
    UpgradeTemplatesDialogComponent,
  ],
  providers: [UpgradeProcessListingService, BusinessProcessDefinitionService],
  templateUrl: "./upgrade-activity.component.html",
  styleUrls: ["./upgrade-activity.component.scss"],
})
export class UpgradeActivityComponent {
  readonly projectId = input.required<string>();

  private readonly listingService = inject(UpgradeProcessListingService);
  private readonly definitionService = inject(BusinessProcessDefinitionService);

  protected readonly activeStatuses = UPG_ACTIVE_STATUSES;
  protected readonly historyStatuses = UPG_HISTORY_STATUSES;

  protected readonly historyShown = signal(false);
  protected readonly ownerPhrase = signal<string | undefined>(undefined);

  protected readonly templatesDialog = viewChild.required(
    UpgradeTemplatesDialogComponent
  );

  /**
   * Loads the project's upgrade definitions exactly once; their ids and process
   * names feed the Business Process Definition / Process Name column filters
   * (resolved to `definitionIds` for the backend). Falls back to an empty list
   * so the page still renders if the lookup fails.
   */
  private readonly definitionsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.definitionService
        .getBusinessProcessDefinitions({ projectId: params.projectId })
        .pipe(
          map((definitions) =>
            definitions.filter(
              (definition) =>
                definition.family?.id === ExecutionFamily.UPGRADE_PROCESS
            )
          ),
          catchError(() => of<BusinessProcessDefinition[]>([]))
        ),
  });

  protected readonly definitions = computed(
    () => this.definitionsResource.value() ?? []
  );

  /** Distinct Business Process Definition options (value = definition id). */
  private readonly definitionOptions = computed<
    ActivityRunsHeaderFilterOption[]
  >(() => {
    const seen = new Set<string>();
    const options: ActivityRunsHeaderFilterOption[] = [];
    for (const definition of this.definitions()) {
      if (seen.has(definition.id)) {
        continue;
      }
      seen.add(definition.id);
      options.push({ label: definition.name, value: definition.id });
    }
    return options;
  });

  /** Distinct Process Name options (value = process name). */
  private readonly processNameOptions = computed<
    ActivityRunsHeaderFilterOption[]
  >(() => {
    const seen = new Set<string>();
    const options: ActivityRunsHeaderFilterOption[] = [];
    for (const definition of this.definitions()) {
      const processName = definition.processName;
      if (!processName || seen.has(processName)) {
        continue;
      }
      seen.add(processName);
      options.push({ label: processName, value: processName });
    }
    return options;
  });

  /** Shared page loader: backend-paginated runs enriched for the Actions cell. */
  protected readonly loadPage = computed(() => {
    const projectId = this.projectId();
    const definitions = this.definitions();
    const base = upgradeLoadPage(this.listingService, projectId, definitions);
    return (req: Parameters<typeof base>[0]) =>
      base(req).pipe(
        map((page) => ({
          total: page.total,
          rows: page.rows.map(
            (row): UpgradeRunRow => ({
              ...row,
              projectId,
              processId: row.id,
              status: row.status ?? ExecutionStatus.NA,
              familyId: ExecutionFamily.UPGRADE_PROCESS,
              sourceDefinitionId: row.sourceDefinitionId,
            })
          ),
        }))
      );
  });

  /**
   * Column definitions for a runs table, in the legacy upgrade order. The Owner
   * column stays visible while My Runs scopes the rows to the user. The Status
   * column's filter options are supplied per
   * table so the Active and History tables only offer the statuses they can
   * actually contain.
   */
  private columnDefsFor(
    statusOptions: ActivityRunsHeaderFilterOption[]
  ): ColDef<UpgradeRunRow>[] {
    const projectId = this.projectId();
    return [
      {
        colId: "name",
        field: "name",
        headerName: "Execution Name",
        cellRenderer: UpgradeRunNameCellComponent,
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
        cellRenderer: UpgradeRunStatusCellComponent,
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
          options: UPG_OFFICIALITY_OPTIONS,
        }),
      },
      {
        colId: "businessProcessQualityLevel",
        field: "input.businessProcessQualityLevel",
        headerName: "BP Quality Level",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "businessProcessQualityLevel",
          "multiselect",
          { options: UPG_QUALITY_LEVEL_OPTIONS }
        ),
      },
      {
        colId: "parentMxArchivalBranch",
        field: "input.parentMxArchivalBranch",
        headerName: "Parent MX Archival Branch",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "parentMxArchivalBranchPhrase",
          "text",
          { placeholder: "Filter branch" }
        ),
      },
      {
        colId: "mxVersion",
        field: "input.mxVersion",
        headerName: "MX Version",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("mxVersionPhrase", "text", {
          placeholder: "Filter version",
        }),
      },
      {
        colId: "mxBuildId",
        field: "input.mxBuildId",
        headerName: "MX Build ID",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams("mxBuildIdPhrase", "text", {
          placeholder: "Filter build id",
        }),
      },
      {
        colId: "configurationBranchName",
        field: "input.configurationBranchName",
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
        valueFormatter: formatDaysExtended,
      },
      {
        colId: "duration",
        headerName: "Duration",
        valueGetter: durationValue,
      },
      {
        colId: "definitionName",
        field: "definitionName",
        headerName: "Business Process Definition",
        cellRenderer: DefinitionDetailsLinkCellComponent,
        cellRendererParams: { projectId },
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "definitionIds",
          "multiselect",
          {
            options: this.definitionOptions(),
          }
        ),
      },
      {
        colId: "processName",
        field: "processName",
        headerName: "Process Name",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "processNames",
          "multiselect",
          {
            options: this.processNameOptions(),
          }
        ),
      },
    ];
  }

  /** Column definitions for the Active table (active-only status filter). */
  protected readonly activeColumnDefs = computed<ColDef<UpgradeRunRow>[]>(() =>
    this.columnDefsFor(UPG_ACTIVE_STATUS_OPTIONS)
  );

  /** Column definitions for the History table (history-only status filter). */
  protected readonly historyColumnDefs = computed<ColDef<UpgradeRunRow>[]>(() =>
    this.columnDefsFor(UPG_HISTORY_STATUS_OPTIONS)
  );

  /** Active table: live abort + repush available. */
  protected readonly activeActionsColumn: ActivityRunsActionsColumn<UpgradeRunRow> =
    {
      cellRenderer: RunActionsCellComponent,
      cellRendererParams: {
        onRepush: (event: RepushEligibleEvent) => this.onRepush(event),
      },
    };

  /** History table: terminal rows — abort rendered non-abortable, repush kept. */
  protected readonly historyActionsColumn: ActivityRunsActionsColumn<UpgradeRunRow> =
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

  protected onRun(): void {
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
function formatDate(params: ValueFormatterParams): string {
  return params.value ? new Date(params.value).toLocaleString() : "";
}

/** Formats the Days Extended count as "N Day(s)"; blanks negatives (legacy parity). */
function formatDaysExtended(params: ValueFormatterParams): string {
  const value = params.value;
  if (typeof value === "number" && value >= 0) {
    return value === 1 ? `${value} Day` : `${value} Days`;
  }
  return "-";
}

/**
 * Computes the run **Duration** from start/end as "{h}h {m}m {s}s" (parity with
 * the legacy upgrade table's duration pipe); blank when either bound is missing.
 */
function durationValue(params: ValueGetterParams<UpgradeRunRow>): string {
  const start = params.data?.startDate;
  const end = params.data?.endDate;
  if (!start || !end) {
    return "";
  }
  const elapsed = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return "";
  }
  const hours = Math.floor(elapsed / 1000 / 3600);
  const minutes = Math.floor(((elapsed / 1000) % 3600) / 60);
  const seconds = Math.floor((elapsed / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}
