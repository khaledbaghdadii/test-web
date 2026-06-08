import {
  Component,
  computed,
  inject,
  Input,
  model,
  OnDestroy,
} from "@angular/core";
import { Observable, Subject, takeUntil } from "rxjs";
import { DetectionCategory } from "../../detections/detection-category.enum";
import { DetectionType } from "../../detections/detection-type.enum";
import { ButtonModule } from "primeng/button";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { RouterModule } from "@angular/router";
import { SkeletonModule } from "primeng/skeleton";

import { LiteConfigurationImpact } from "../model/lite-configuration-impact.model";
import { DetectionUriBuilderPipe } from "../../detections/detection-uri-builder.pipe";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { ConfigurationImpactTableRowSelectionState } from "./configuration-impact-table-row-selection-state";
import { Checkbox, CheckboxChangeEvent } from "primeng/checkbox";
import { Tooltip } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";
import { ConfigurationImpactTableStateService } from "./configuration-impact-table-state.service";
import { ConfigurationImpactTableSelectionStateService } from "./configuration-impact-table-selection-state.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { ConfigurationImpactTableQuery } from "./configuration-impact-table-query.model";

@Component({
  selector: "mxevolve-configuration-impacts-selection-table",
  imports: [
    ButtonModule,
    TableModule,
    RouterModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    DetectionUriBuilderPipe,
    Checkbox,
    Tooltip,
    FormsModule,
    SelectedAnalysisObjectsListingComponent,
  ],
  providers: [
    ConfigurationImpactTableStateService,
    ConfigurationImpactTableSelectionStateService,
  ],
  templateUrl: "./configuration-impacts-selection-table.component.html",
})
export class ConfigurationImpactsSelectionTableComponent implements OnDestroy {
  private readonly configurationImpactTableStateService = inject(
    ConfigurationImpactTableStateService
  );
  private readonly configurationImpactTableSelectionStateService = inject(
    ConfigurationImpactTableSelectionStateService
  );
  private readonly filterTranslator = inject(FilterTranslatorService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analysisObjectSelectionStateService = inject(
    AnalysisObjectTableSelectionStateService
  );

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;
  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
  constructor() {
    this.showErrorMessage();
    this.getSelectedConfigurationImpacts();
  }

  configurationImpacts =
    this.configurationImpactTableStateService.configurationImpacts;
  selectedConfigurationImpacts = model<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  >([]);

  totalRecords = this.configurationImpactTableStateService.totalElements;

  isLoading = this.configurationImpactTableStateService.isLoading;
  isInitiallySelectedImpactsLoading =
    this.configurationImpactTableSelectionStateService
      .isInitiallySelectedImpactsLoading;

  errorMessage = this.configurationImpactTableStateService.errorMessage;
  initiallyConfigurationImpactSelectionStateErrorMessage =
    this.configurationImpactTableSelectionStateService.errorMessage;

  initiallyConfigurationImpactSelectionStates =
    this.configurationImpactTableSelectionStateService
      .initiallyConfigurationImpactSelectionStates;

  tableRowSelectionState = computed<
    Map<string, ConfigurationImpactTableRowSelectionState>
  >(() => {
    const configurationImpactTableRowSelectionMap = new Map<
      string,
      ConfigurationImpactTableRowSelectionState
    >();
    this.configurationImpacts().forEach((impact) => {
      const initiallySelectedImpact = this.selectedConfigurationImpacts().find(
        (selectionState) => selectionState.analysisObject.id === impact.id
      );
      configurationImpactTableRowSelectionMap.set(impact.id, {
        selectionState: {
          checked:
            this.analysisObjectSelectionStateService.isAnalysisObjectFullySelected(
              impact,
              this.selectedConfigurationImpacts()
            ),
          partialSelected:
            this.analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected(
              impact,
              this.selectedConfigurationImpacts()
            ),
          selectionMessage: initiallySelectedImpact?.selectionMessage,
        },
      } as ConfigurationImpactTableRowSelectionState);
    });
    return configurationImpactTableRowSelectionMap;
  });

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.configurationImpactTableStateService.refreshConfigurationImpacts(
          refresh
        );
      }
    });
  }
  @Input({ required: true }) projectId: string;
  selectedImpactIdsLoading = model<boolean>(false);
  isTableLoading = computed(() => {
    return (
      this.isLoading() ||
      this.selectedImpactIdsLoading() ||
      this.isInitiallySelectedImpactsLoading()
    );
  });
  @Input()
  set initiallySelectedConfigurationImpacts(
    initiallySelectedRegressions: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this.configurationImpactTableSelectionStateService.setInitiallySelectedConfigurationImpacts(
      initiallySelectedRegressions
    );
  }
  selectedAnalysisObjects = computed(() => {
    return this.selectedConfigurationImpacts().map(
      (selectionState): SelectedAnalysisObject => {
        return {
          id: selectionState.analysisObject.id,
          title: selectionState.analysisObject.title,
          selectionType: selectionState.selectionType,
          selectionMessage: selectionState.selectionMessage,
        };
      }
    );
  });

  handleSelectionChange(
    event: CheckboxChangeEvent,
    impact: LiteConfigurationImpact
  ) {
    if (event.checked) {
      this.addConfigurationImpactToSelection(impact);
    } else {
      this.removeConfigurationImpactFromSelection(impact.id);
    }
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent): void {
    const newQuery =
      this.filterTranslator.handleTableFiltersChange<ConfigurationImpactTableQuery>(
        event,
        { markEmptyStringAsUndefined: true }
      );
    this.configurationImpactTableStateService.setConfigurationImpactsTableQuery(
      newQuery
    );
  }

  removeConfigurationImpactFromSelection(configurationImpactId: string) {
    this.selectedConfigurationImpacts.update((current) =>
      current.filter(
        (currentImpact) =>
          currentImpact.analysisObject.id !== configurationImpactId
      )
    );
  }

  private addConfigurationImpactToSelection(impact: LiteConfigurationImpact) {
    this.selectedConfigurationImpacts.update((current) =>
      this.analysisObjectSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
        impact,
        current
      )
    );
  }

  private showErrorMessage() {
    this.showConfigurationImpactTableStateErrorMessage();
    this.showInitialConfigurationImpactSelectionStateErrorMessage();
  }

  private showConfigurationImpactTableStateErrorMessage() {
    toObservable(this.errorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) this.toastMessageService.showError(error);
      });
  }

  private showInitialConfigurationImpactSelectionStateErrorMessage() {
    toObservable(this.initiallyConfigurationImpactSelectionStateErrorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) this.toastMessageService.showError(error);
      });
  }

  private getSelectedConfigurationImpacts() {
    toObservable(this.initiallyConfigurationImpactSelectionStates)
      .pipe(takeUntil(this.destroy$))
      .subscribe((initiallySelectedConfigurationImpacts) => {
        this.selectedConfigurationImpacts.set(
          initiallySelectedConfigurationImpacts
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
