import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  model,
  OnDestroy,
  Output,
} from "@angular/core";

import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { DetectionType } from "../../detections/detection-type.enum";
import { DetectionCategory } from "../../detections/detection-category.enum";
import { combineLatest, Observable, Subject, takeUntil } from "rxjs";
import { HiddenDetectionCreationDetailComponent } from "../hidden-detection-creation-detail/hidden-detection-creation-detail.component";
import { RouterLink } from "@angular/router";
import { Skeleton } from "primeng/skeleton";
import {
  FilterTranslatorService,
  TableChipsFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { ToastMessageService } from "@mxflow/ui/alert";
import { DetectionUriBuilderPipe } from "../../detections/detection-uri-builder.pipe";
import { CheckboxChangeEvent, CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { LiteBinaryRegression } from "../model/lite-binary-regression.model";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { BinaryRegressionTableStateService } from "./binary-regression-table-state.service";
import { BinaryRegressionTableQuery } from "./binary-regression-table-query.model";
import { toObservable } from "@angular/core/rxjs-interop";

import { BinaryRegressionTableSelectionStateService } from "./binary-regression-table-selection-state.service";
import { ValidationScope } from "@mxflow/features/validation-management";

export interface BinaryRegressionTableRowSelectionState {
  selectionState: {
    checked: boolean;
    partialSelected: boolean;
    selectionMessage?: string;
  };
}

@Component({
  selector: "mxevolve-binary-regression-selection-table",
  imports: [
    TableModule,
    DetectionUriBuilderPipe,
    HiddenDetectionCreationDetailComponent,
    RouterLink,
    Skeleton,
    TableEmptyMessageComponent,
    CheckboxModule,
    TooltipModule,
    FormsModule,
    SelectedAnalysisObjectsListingComponent,
    TableChipsFilterComponent,
  ],
  providers: [
    BinaryRegressionTableStateService,
    BinaryRegressionTableSelectionStateService,
    BinaryRegressionDataService,
    FilterTranslatorService,
    ToastMessageService,
    AnalysisObjectTableSelectionStateService,
  ],
  templateUrl: "./binary-regression-selection-table.component.html",
})
export class BinaryRegressionSelectionTableComponent implements OnDestroy {
  private readonly binaryRegressionTableStateService = inject(
    BinaryRegressionTableStateService
  );
  private readonly binaryRegressionTableSelectionStateService = inject(
    BinaryRegressionTableSelectionStateService
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

  selectedTitlePhrases: string[] = [];
  selectedDefectIdPhrases: string[] = [];
  selectedMxVersionPhrases: string[] = [];

  @Output() warningMessageChange = new EventEmitter<string | undefined>();

  constructor() {
    this.showErrorMessage();
    this.getSelectedBinaryRegressions();
    this.emitWarningMessage();
  }

  selectedBinaryRegressions = model<
    AnalysisObjectSelectionState<LiteBinaryRegression>[]
  >([]);
  listOfRegressions = this.binaryRegressionTableStateService.binaryRegressions;
  totalRecords = this.binaryRegressionTableStateService.totalElements;
  firstRowIndex = computed(
    () =>
      this.binaryRegressionTableStateService.page() *
      this.binaryRegressionTableStateService.pageSize()
  );

  isLoading = this.binaryRegressionTableStateService.isLoading;
  isInitiallySelectedRegressionsLoading =
    this.binaryRegressionTableSelectionStateService
      .isInitiallySelectedRegressionsLoading;

  warningMessage = this.binaryRegressionTableStateService.warningMessage;
  errorMessage = this.binaryRegressionTableStateService.errorMessage;
  initiallyBinaryRegressionSelectionStateErrorMessage =
    this.binaryRegressionTableSelectionStateService.errorMessage;

  initiallyBinaryRegressionSelectionStates =
    this.binaryRegressionTableSelectionStateService
      .initiallyBinaryRegressionSelectionStates;
  tableRowSelectionState = computed<
    Map<string, BinaryRegressionTableRowSelectionState>
  >(() => {
    const binaryRegressionTableRowSelectionMap = new Map<
      string,
      BinaryRegressionTableRowSelectionState
    >();
    this.listOfRegressions().forEach((regression) => {
      const regressionInitialSelectionState =
        this.selectedBinaryRegressions().find(
          (selectionState) => selectionState.analysisObject.id === regression.id
        );
      binaryRegressionTableRowSelectionMap.set(regression.id, {
        selectionState: {
          checked:
            this.analysisObjectSelectionStateService.isAnalysisObjectFullySelected(
              regression,
              this.selectedBinaryRegressions()
            ),
          partialSelected:
            this.analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected(
              regression,
              this.selectedBinaryRegressions()
            ),
          selectionMessage: regressionInitialSelectionState?.selectionMessage,
        },
      } as BinaryRegressionTableRowSelectionState);
    });
    return binaryRegressionTableRowSelectionMap;
  });

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.binaryRegressionTableStateService.refreshBinaryRegressions(
          refresh
        );
      }
    });
  }

  @Input() set validationScope(validationScope: ValidationScope | undefined) {
    this.binaryRegressionTableStateService.setValidationScope(validationScope);
  }

  @Input() set showBinaryRegressionsWithoutDefects(
    showBinaryRegressionsWithoutDefects: boolean
  ) {
    this.binaryRegressionTableStateService.showBinaryRegressionsWithoutDefects(
      showBinaryRegressionsWithoutDefects
    );
  }

  selectedRegressionIdsLoading = model<boolean>(false);
  isTableLoading = computed(() => {
    return (
      this.isLoading() ||
      this.selectedRegressionIdsLoading() ||
      this.isInitiallySelectedRegressionsLoading()
    );
  });

  @Input()
  set initiallySelectedRegressions(
    initiallySelectedRegressions: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this.binaryRegressionTableSelectionStateService.setInitiallySelectedBinaryRegressions(
      initiallySelectedRegressions
    );
  }

  selectedAnalysisObjects = computed(() => {
    return this.selectedBinaryRegressions().map(
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
    regression: LiteBinaryRegression
  ) {
    if (event.checked) {
      this.addBinaryRegressionToSelection(regression);
    } else {
      this.removeBinaryRegressionFromSelection(regression.id);
    }
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent): void {
    const newQuery =
      this.filterTranslator.handleTableFiltersChange<BinaryRegressionTableQuery>(
        event
      );
    this.binaryRegressionTableStateService.setBinaryRegressionsTableQuery(
      newQuery
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private addBinaryRegressionToSelection(regression: LiteBinaryRegression) {
    this.selectedBinaryRegressions.update((current) =>
      this.analysisObjectSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
        regression,
        current
      )
    );
  }

  removeBinaryRegressionFromSelection(binaryRegressionId: string) {
    this.selectedBinaryRegressions.update((current) =>
      current.filter((br) => br.analysisObject.id !== binaryRegressionId)
    );
  }

  private showErrorMessage() {
    combineLatest([
      toObservable(this.errorMessage),
      toObservable(this.initiallyBinaryRegressionSelectionStateErrorMessage),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((errors) => {
        errors.forEach((error) => {
          if (error) this.toastMessageService.showError(error);
        });
      });
  }

  private getSelectedBinaryRegressions() {
    toObservable(this.initiallyBinaryRegressionSelectionStates)
      .pipe(takeUntil(this.destroy$))
      .subscribe((initiallySelectedBinaryRegressions) => {
        this.selectedBinaryRegressions.set(initiallySelectedBinaryRegressions);
      });
  }

  private emitWarningMessage() {
    toObservable(this.warningMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((warning) => this.warningMessageChange.emit(warning));
  }
}
