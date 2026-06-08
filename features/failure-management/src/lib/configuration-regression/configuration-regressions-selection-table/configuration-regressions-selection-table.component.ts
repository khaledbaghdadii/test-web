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
import {
  FilterTranslatorService,
  TableChipsFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { DetectionUriBuilderPipe } from "../../detections";

import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfigurationRegressionService } from "../configuration-regression.service";
import { LiteConfigurationRegression } from "../model/lite-configuration-regression.model";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { Checkbox, CheckboxChangeEvent } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { Tooltip } from "primeng/tooltip";
import { ConfigurationRegressionTableStateService } from "./configuration-regression-table-state.service";
import { ConfigurationRegressionTableSelectionStateService } from "./configuration-regression-table-selection-state.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { ConfigurationRegressionTableQuery } from "./configuration-regression-table-query.model";

export interface ConfigurationRegressionTableRowSelectionState {
  selectionState: {
    checked: boolean;
    partialSelected: boolean;
    selectionMessage?: string;
  };
}
@Component({
  selector: "mxevolve-configuration-regressions-selection-table",
  imports: [
    ButtonModule,
    TableModule,
    RouterModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    DetectionUriBuilderPipe,
    Checkbox,
    FormsModule,
    Tooltip,
    SelectedAnalysisObjectsListingComponent,
    TableChipsFilterComponent,
  ],
  providers: [
    ConfigurationRegressionService,
    ConfigurationRegressionTableStateService,
    ConfigurationRegressionTableSelectionStateService,
  ],
  templateUrl: "./configuration-regressions-selection-table.component.html",
})
export class ConfigurationRegressionsSelectionTableComponent
  implements OnDestroy
{
  private readonly configurationRegressionTableStateService = inject(
    ConfigurationRegressionTableStateService
  );
  private readonly configurationRegressionTableSelectionStateService = inject(
    ConfigurationRegressionTableSelectionStateService
  );
  private readonly filterTranslator = inject(FilterTranslatorService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analysisObjectTableSelectionStateService = inject(
    AnalysisObjectTableSelectionStateService
  );

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;
  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;

  selectedTitlePhrases: string[] = [];
  selectedGuiltyChangePhrases: string[] = [];

  constructor() {
    this.showErrorMessage();
    this.getSelectedConfigurationRegressions();
  }

  selectedConfigurationRegressions = model<
    AnalysisObjectSelectionState<LiteConfigurationRegression>[]
  >([]);
  configurationRegressions =
    this.configurationRegressionTableStateService.configurationRegressions;
  totalRecords = this.configurationRegressionTableStateService.totalElements;

  isLoading = this.configurationRegressionTableStateService.isLoading;
  isInitiallySelectedRegressionsLoading =
    this.configurationRegressionTableSelectionStateService
      .isInitiallySelectedRegressionsLoading;

  errorMessage = this.configurationRegressionTableStateService.errorMessage;
  initiallyConfigurationRegressionSelectionStateErrorMessage =
    this.configurationRegressionTableSelectionStateService.errorMessage;

  initiallyConfigurationRegressionSelectionStates =
    this.configurationRegressionTableSelectionStateService
      .initiallyConfigurationRegressionSelectionStates;

  tableRowSelectionState = computed<
    Map<string, ConfigurationRegressionTableRowSelectionState>
  >(() => {
    const configurationRegressionTableRowSelectionMap = new Map<
      string,
      ConfigurationRegressionTableRowSelectionState
    >();
    this.configurationRegressions().forEach((regression) => {
      const regressionInitialSelectionState =
        this.selectedConfigurationRegressions().find(
          (selectionState) => selectionState.analysisObject.id === regression.id
        );
      configurationRegressionTableRowSelectionMap.set(regression.id, {
        selectionState: {
          checked:
            this.analysisObjectTableSelectionStateService.isAnalysisObjectFullySelected(
              regression,
              this.selectedConfigurationRegressions()
            ),
          partialSelected:
            this.analysisObjectTableSelectionStateService.isAnalysisObjectPartiallySelected(
              regression,
              this.selectedConfigurationRegressions()
            ),
          selectionMessage: regressionInitialSelectionState?.selectionMessage,
        },
      } as ConfigurationRegressionTableRowSelectionState);
    });
    return configurationRegressionTableRowSelectionMap;
  });

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.configurationRegressionTableStateService.refreshConfigurationRegressions(
          refresh
        );
      }
    });
  }

  @Input({ required: true }) projectId: string;
  selectedRegressionIdsLoading = model<boolean>(false);
  isTableLoading = computed(() => {
    return (
      this.isLoading() ||
      this.selectedRegressionIdsLoading() ||
      this.isInitiallySelectedRegressionsLoading()
    );
  });
  @Input()
  set initiallySelectedConfigurationRegressions(
    initiallySelectedRegressions: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this.configurationRegressionTableSelectionStateService.setInitiallySelectedConfigurationRegressions(
      initiallySelectedRegressions
    );
  }

  selectedAnalysisObjects = computed(() => {
    return this.selectedConfigurationRegressions().map(
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
    regression: LiteConfigurationRegression
  ) {
    if (event.checked) {
      this.addConfigurationRegressionToSelection(regression);
    } else {
      this.removeConfigurationRegressionFromSelection(regression.id);
    }
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent): void {
    const newQuery =
      this.filterTranslator.handleTableFiltersChange<ConfigurationRegressionTableQuery>(
        event
      );
    this.configurationRegressionTableStateService.setConfigurationRegressionsTableQuery(
      newQuery
    );
  }

  removeConfigurationRegressionFromSelection(
    configurationRegressionId: string
  ) {
    this.selectedConfigurationRegressions.update((current) =>
      current.filter(
        (currentRegression) =>
          currentRegression.analysisObject.id !== configurationRegressionId
      )
    );
  }

  private addConfigurationRegressionToSelection(
    regression: LiteConfigurationRegression
  ) {
    this.selectedConfigurationRegressions.update((current) =>
      this.analysisObjectTableSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
        regression,
        current
      )
    );
  }

  private showErrorMessage() {
    this.showConfigurationRegressionTableStateErrorMessage();
    this.showInitialConfigurationRegressionSelectionStateErrorMessage();
  }

  private showConfigurationRegressionTableStateErrorMessage() {
    toObservable(this.errorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) this.toastMessageService.showError(error);
      });
  }

  private showInitialConfigurationRegressionSelectionStateErrorMessage() {
    toObservable(
      this.initiallyConfigurationRegressionSelectionStateErrorMessage
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) this.toastMessageService.showError(error);
      });
  }

  private getSelectedConfigurationRegressions() {
    toObservable(this.initiallyConfigurationRegressionSelectionStates)
      .pipe(takeUntil(this.destroy$))
      .subscribe((initiallySelectedConfigurationRegressions) => {
        this.selectedConfigurationRegressions.set(
          initiallySelectedConfigurationRegressions
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
