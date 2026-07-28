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
import { Observable, Subject, takeUntil } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { Incident } from "../model/incident.model";

import { FormsModule } from "@angular/forms";
import {
  FilterTranslatorService,
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
import { IncidentsTableStateService } from "./incidents-table-state.service";
import { PreviouslyLinkedFilter } from "@mxevolve/domains/test/model";
import { IncidentsTableQuery } from "./incidents-table-query.model";

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
  providers: [IncidentsTableStateService, FilterTranslatorService],
  templateUrl: "./incidents-selection-table.component.html",
})
export class IncidentsSelectionTableComponent implements OnDestroy {
  private readonly stateService = inject(IncidentsTableStateService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analysisObjectTableSelectionStateService = inject(
    AnalysisObjectTableSelectionStateService
  );
  private readonly filterTranslator = inject(FilterTranslatorService);

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;
  private _previouslyLinkedFilter?: PreviouslyLinkedFilter;

  incidents = this.stateService.incidents;
  total = this.stateService.total;
  isTableLoading = this.stateService.isLoading;
  statusOptions = this.stateService.statusOptions;
  errorMessage = this.stateService.errorMessage;
  statusesErrorMessage = this.stateService.statusesErrorMessage;
  size = this.stateService.size;
  firstRowIndex = computed(
    () => this.stateService.page() * this.stateService.size()
  );

  selectedStatuses: string[] = [];

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.stateService.refresh();
      }
    });
  }

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
  @Input()
  set previouslyLinkedFilter(value: PreviouslyLinkedFilter | undefined) {
    this._previouslyLinkedFilter = value;
    this.stateService.setPreviouslyLinkedFilterCriteria(value);
  }

  get previouslyLinkedFilter(): PreviouslyLinkedFilter | undefined {
    return this._previouslyLinkedFilter;
  }

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
    this.showErrorMessages();
  }

  incidentSelectionStates: Signal<Map<string, IncidentTableRowSelectionState>> =
    computed(() => {
      const selectionStates = new Map<string, IncidentTableRowSelectionState>();
      this.incidents().forEach((incident) => {
        const currentSelection = this.selectedIncidents().find(
          (sel) => sel.analysisObject.id === incident.id
        );
        selectionStates.set(incident.id, {
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
        });
      });
      return selectionStates;
    });

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    const query =
      this.filterTranslator.handleTableFiltersChange<IncidentsTableQuery>(
        event
      );
    this.stateService.setIncidentsTableQuery(query);
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

  private showErrorMessages() {
    toObservable(this.errorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          this.toastMessageService.showError(error);
        }
      });

    toObservable(this.statusesErrorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          this.toastMessageService.showError(error);
        }
      });
  }
}

export interface IncidentTableRowSelectionState {
  selectionState: {
    checked: boolean;
    partialSelected: boolean;
    selectionMessage?: string;
  };
}
