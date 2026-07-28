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
import type { ColDef } from "ag-grid-enterprise";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  ValidationProcessExecution,
  ValidationProcessListingService,
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
  ValidationTemplatesDialogComponent,
  type RepushEligibleEvent,
  type RunActionsRow,
} from "@mxevolve/domains/business-process/composite-widget";
import { DefinitionDetailsLinkCellComponent } from "../../shared/definition-details-link/definition-details-link-cell.component";
import {
  ValidationRunNameCellComponent,
  ValidationRunStatusCellComponent,
} from "./validation-activity.cells";
import {
  VAL_ACTIVE_STATUSES,
  VAL_HISTORY_STATUSES,
  validationLoadPage,
} from "./validation-activity.queries";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";

/** A Validation run row enriched with the fields the Actions cell needs. */
type ValidationRunRow = ValidationProcessExecution & RunActionsRow;

/**
 * Status multiselect options for the Status column header filter — the same set
 * the legacy validation table exposed (excludes the internal `FAILED_TO_START`
 * / `NA` statuses).
 */
const VAL_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] = [
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
const VAL_ACTIVE_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  VAL_STATUS_OPTIONS.filter((option) =>
    VAL_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/** Status options limited to the History (Inactive) table's terminal statuses. */
const VAL_HISTORY_STATUS_OPTIONS: ActivityRunsHeaderFilterOption[] =
  VAL_STATUS_OPTIONS.filter(
    (option) => !VAL_ACTIVE_STATUSES.includes(option.value as ExecutionStatus)
  );

/** Official Status multiselect options (parity with the legacy validation table). */
const VAL_OFFICIALITY_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "Official", value: "OFFICIAL" },
  { label: "Unofficial", value: "UNOFFICIAL" },
  { label: "N/A", value: "NA" },
];

/** BP Quality Level multiselect options (parity with the legacy validation table). */
const VAL_QUALITY_LEVEL_OPTIONS: ActivityRunsHeaderFilterOption[] = [
  { label: "DQG", value: "DQG" },
  { label: "MQG", value: "MQG" },
  { label: "N/A", value: "NA" },
];

/**
 * Validation activity landing page. Renders two backend-paginated
 * {@link ActivityRunsTableComponent} instances — **Active Runs** (in-flight
 * statuses, revealed by default) and **History** (the rest, behind a Show
 * History toggle) — over the migrated {@link ValidationProcessListingService}.
 * The validation columns/filters/sorts match the legacy validation table
 * field-by-field; the project's validation definitions are loaded once to feed
 * the Business Process Definition / Process Name column filters. The My Runs
 * toggle scopes both tables to the current user while keeping Owner visible,
 * and the Build button opens the Validation templates dialog.
 */
@Component({
  selector: "mxevolve-validation-activity",
  imports: [
    Button,
    MxevolveIconComponent,
    ActivityRunsTableComponent,
    MyRunsToggleComponent,
    ValidationTemplatesDialogComponent,
  ],
  providers: [
    ValidationProcessListingService,
    BusinessProcessDefinitionService,
    DevelopmentService,
  ],
  templateUrl: "./validation-activity.component.html",
})
export class ValidationActivityComponent {
  readonly projectId = input.required<string>();

  private readonly listingService = inject(ValidationProcessListingService);
  private readonly definitionService = inject(BusinessProcessDefinitionService);

  protected readonly activeStatuses = VAL_ACTIVE_STATUSES;
  protected readonly historyStatuses = VAL_HISTORY_STATUSES;

  protected readonly historyShown = signal(false);
  protected readonly ownerPhrase = signal<string | undefined>(undefined);

  protected readonly templatesDialog = viewChild.required(
    ValidationTemplatesDialogComponent
  );

  /**
   * Loads the project's validation definitions exactly once; their ids and
   * process names feed the Business Process Definition / Process Name column
   * filters (resolved to `definitionIds` for the backend). Falls back to an
   * empty list so the page still renders if the lookup fails.
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
                definition.family?.id === ExecutionFamily.VALIDATION_PROCESS
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
    const base = validationLoadPage(
      this.listingService,
      projectId,
      definitions
    );
    return (req: Parameters<typeof base>[0]) =>
      base(req).pipe(
        map((page) => ({
          total: page.total,
          rows: page.rows.map(
            (row): ValidationRunRow => ({
              ...row,
              projectId,
              processId: row.id,
              status: row.status ?? ExecutionStatus.NA,
              familyId: ExecutionFamily.VALIDATION_PROCESS,
              sourceDefinitionId: row.sourceDefinitionId,
            })
          ),
        }))
      );
  });

  /**
   * Column definitions for a runs table, in the legacy validation order. The
   * Owner stays visible while My Runs scopes the rows to the user. The Status
   * column's filter options are supplied per
   * table so the Active and History tables only offer the statuses they can
   * actually contain.
   */
  private columnDefsFor(
    statusOptions: ActivityRunsHeaderFilterOption[]
  ): ColDef<ValidationRunRow>[] {
    const projectId = this.projectId();
    return [
      {
        colId: "name",
        field: "name",
        headerName: "Execution Name",
        cellRenderer: ValidationRunNameCellComponent,
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
        cellRenderer: ValidationRunStatusCellComponent,
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
          options: VAL_OFFICIALITY_OPTIONS,
        }),
      },
      {
        colId: "businessProcessQualityLevel",
        field: "businessProcessQualityLevel",
        headerName: "BP Quality Level",
        headerComponent: ActivityRunsHeaderFilterComponent,
        headerComponentParams: this.filterParams(
          "businessProcessQualityLevel",
          "multiselect",
          { options: VAL_QUALITY_LEVEL_OPTIONS }
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
  protected readonly activeColumnDefs = computed<ColDef<ValidationRunRow>[]>(
    () => this.columnDefsFor(VAL_ACTIVE_STATUS_OPTIONS)
  );

  /** Column definitions for the History table (history-only status filter). */
  protected readonly historyColumnDefs = computed<ColDef<ValidationRunRow>[]>(
    () => this.columnDefsFor(VAL_HISTORY_STATUS_OPTIONS)
  );

  /** Active table: live abort + repush available. */
  protected readonly activeActionsColumn: ActivityRunsActionsColumn<ValidationRunRow> =
    {
      cellRenderer: RunActionsCellComponent,
      cellRendererParams: {},
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
