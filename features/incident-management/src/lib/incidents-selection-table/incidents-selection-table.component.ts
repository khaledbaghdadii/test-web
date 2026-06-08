import {
  Component,
  computed,
  inject,
  Input,
  model,
  OnDestroy,
  signal,
  Signal,
} from "@angular/core";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { finalize, Observable, Subject, takeUntil } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { IncidentService } from "../incident.service";
import { IncidentsTableQuery } from "./incidents-table-query.model";
import { Incident } from "../model/incident.model";

import { FormsModule } from "@angular/forms";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { ToggleButtonModule } from "primeng/togglebutton";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { Checkbox, CheckboxChangeEvent } from "primeng/checkbox";
import { Tooltip } from "primeng/tooltip";
import { FilterMetadata } from "primeng/api";
import {
  IncidentsApiRequest,
  IncidentsFetchRequest,
  IncidentsQueryParams,
} from "@mxflow/features/incident-management";

@Component({
  selector: "mxevolve-incidents-selection-table",
  imports: [
    TableModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    TableCheckboxFilterComponent,
    ToggleButtonModule,
    FormsModule,
    Checkbox,
    Tooltip,
    SelectedAnalysisObjectsListingComponent,
  ],
  templateUrl: "./incidents-selection-table.component.html",
})
export class IncidentsSelectionTableComponent implements OnDestroy {
  private readonly incidentService = inject(IncidentService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analysisObjectTableSelectionStateService = inject(
    AnalysisObjectTableSelectionStateService
  );

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.resetIncidentsQuery();
        this.fetchTableData(this.mapToDomainRequest(this.incidentsQuery));
        this.fetchStatusOptions();
      }
    });
  }
  isTableLoading = false;
  total = 0;
  statusOptions: { text: string; value: string }[] = [];
  selectedStatuses: string[] = [];
  incidentsQuery: IncidentsTableQuery = {
    size: 10,
    page: 0,
  };
  private readonly _initiallySelectedIncidents = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);

  @Input()
  set initiallySelectedIncidents(
    value: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this._initiallySelectedIncidents.set(value ?? []);
  }

  @Input() selectedIncidentIdsLoading = false;

  incidents = signal<Incident[]>([]);
  selectedIncidents = model<AnalysisObjectSelectionState<Incident>[]>([]);
  selectedAnalysisObjects = computed(() => {
    return this.selectedIncidents().map(
      (incidentSelection): SelectedAnalysisObject => {
        return {
          id: incidentSelection.analysisObject.id,
          title: incidentSelection.analysisObject.title,
          selectionType: incidentSelection.selectionType,
          selectionMessage: incidentSelection.selectionMessage,
        };
      }
    );
  });

  constructor() {
    this.initializeSelectedIncidents();
  }

  incidentSelections: Signal<IncidentTableRowSelectionState[]> = computed(() =>
    this.incidents().map((incident) => {
      const currentSelection = this.selectedIncidents().find(
        (sel) => sel.analysisObject.id === incident.id
      );
      return {
        incident,
        selectionState: {
          checked:
            this.analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected(
              incident,
              this.selectedIncidents()
            ),
          partialSelected:
            this.analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected(
              incident,
              this.selectedIncidents()
            ),
          selectionMessage: currentSelection?.selectionMessage,
        },
      };
    })
  );

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    this.incidents.set([]);
    this.updatePaginationParams(event);
    this.updateQueryParams(event);
    this.fetchTableData(this.mapToDomainRequest(this.incidentsQuery));
  }

  fetchTableData(fetchRequest: IncidentsFetchRequest) {
    this.isTableLoading = true;
    this.incidentService
      .fetch(fetchRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isTableLoading = false))
      )
      .subscribe({
        next: (incidentPage) => {
          this.incidents.set(incidentPage.content);
          this.total = incidentPage.totalElements;
        },
        error: (error) => {
          this.showErrorMessage(error.message);
          this.selectedIncidents.set([]);
        },
      });
  }

  fetchStatusOptions() {
    this.incidentService
      .fetchAllStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => {
          this.statusOptions = statuses.map((status) => ({
            text: status,
            value: status,
          }));
        },
        error: (error) => {
          this.showErrorMessage(error.message);
        },
      });
  }

  private resetIncidentsQuery() {
    this.incidentsQuery = {
      size: 10,
      page: 0,
    };
  }

  private showErrorMessage(message: string) {
    this.toastMessageService.showError(message);
  }

  private updateQueryParams(event: TableLazyLoadEvent) {
    Object.entries(event.filters ?? {}).forEach(([key, filterValue]) => {
      let value = this.extractArrayFilterValue(filterValue);

      if (!value) {
        value = this.extractSingleObjectFilterValue(filterValue);
      }

      if (value) {
        this.updateQueryProperty(key, value);
      } else {
        this.deleteQueryProperty(key);
      }
    });
  }

  private extractArrayFilterValue(
    filterValue: FilterMetadata | FilterMetadata[] | undefined
  ): unknown {
    if (Array.isArray(filterValue) && filterValue[0].value) {
      return filterValue[0].value;
    }

    return undefined;
  }

  private extractSingleObjectFilterValue(
    filterValue: FilterMetadata | FilterMetadata[] | undefined
  ): unknown {
    if (!Array.isArray(filterValue) && typeof filterValue === "object") {
      return filterValue.value;
    }

    return undefined;
  }

  private updatePaginationParams(event: TableLazyLoadEvent) {
    const pageIndex = Math.floor((event.first ?? 0) / (event.rows ?? 10));

    this.incidentsQuery.size = event.rows ?? 10;

    if (pageIndex !== this.incidentsQuery.page) {
      this.incidentsQuery.page = pageIndex;
    } else {
      this.incidentsQuery.page = 0;
    }
  }

  private updateQueryProperty(
    key: keyof IncidentsTableQuery,
    newValue?: IncidentsTableQuery[keyof IncidentsTableQuery]
  ) {
    if (newValue) {
      this.incidentsQuery[key] = newValue;
    }
  }

  private deleteQueryProperty(key: keyof IncidentsTableQuery) {
    delete this.incidentsQuery[key];
  }

  private mapToDomainRequest(
    incidentsTableQuery: IncidentsTableQuery
  ): IncidentsFetchRequest {
    const queryParams: IncidentsQueryParams = {
      page: incidentsTableQuery.page,
      size: incidentsTableQuery.size,
    };

    const filters: IncidentsApiRequest = {
      titlePhrase: incidentsTableQuery.titlePhrase,
      ...(incidentsTableQuery.statuses &&
      incidentsTableQuery.statuses.length > 0
        ? { statuses: incidentsTableQuery.statuses }
        : {}),
      externalIssueIdPhrase: incidentsTableQuery.externalIssueIdPhrase,
      reporterPhrase: incidentsTableQuery.reporterPhrase,
      assigneePhrase: incidentsTableQuery.assigneePhrase,
    };

    return {
      queryParams: queryParams,
      filters: filters,
    };
  }

  handleSelectionChange(event: CheckboxChangeEvent, incident: Incident) {
    event.checked
      ? this.addIncidentToSelection(incident)
      : this.removeIncidentFromSelection(incident.id);
  }

  removeIncidentFromSelection(id: string) {
    this.selectedIncidents.update((selectedIncidents) =>
      selectedIncidents.filter(
        (selectedIncident) => selectedIncident.analysisObject?.id !== id
      )
    );
  }

  private initializeSelectedIncidents() {
    toObservable(this._initiallySelectedIncidents)
      .pipe(takeUntil(this.destroy$))
      .subscribe((initiallySelectedIncidents) => {
        this.selectedIncidents.set(
          initiallySelectedIncidents.map((selection) => ({
            ...selection,
            analysisObject: selection.analysisObject as Incident,
          }))
        );
      });
  }

  private addIncidentToSelection(incidentToAdd: Incident) {
    this.selectedIncidents.update((selectedIncidents) =>
      this.analysisObjectTableSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
        incidentToAdd,
        selectedIncidents
      )
    );
  }
}

export interface IncidentTableRowSelectionState {
  incident: Incident;
  selectionState: {
    checked: boolean;
    partialSelected: boolean;
    selectionMessage?: string;
  };
}
