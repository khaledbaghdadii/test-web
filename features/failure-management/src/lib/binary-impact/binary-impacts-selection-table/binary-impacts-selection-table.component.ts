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
import { combineLatest, Observable, Subject, takeUntil } from "rxjs";
import { DetectionCategory } from "../../detections/detection-category.enum";
import { DetectionType } from "../../detections/detection-type.enum";
import { LiteBinaryImpact } from "../lite-binary-impact.model";
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
import { CheckboxChangeEvent, CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { TooltipModule } from "primeng/tooltip";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectTableSelectionStateService,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { FetchBinaryImpactsTableQuery } from "./fetch-binary-impacts-table-query.model";
import { BinaryImpactTableStateService } from "./binary-impact-table-state.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { BinaryImpactTableSelectionStateService } from "./binary-impact-table-selection-state.service";
import { ValidationScope } from "@mxflow/features/validation-management";

export interface BinaryImpactTableRowSelectionState {
  selectionState: {
    checked: boolean;
    partialSelected: boolean;
    selectionMessage?: string;
  };
}

@Component({
  selector: "mxevolve-binary-impacts-selection-table",
  imports: [
    ButtonModule,
    TableModule,
    RouterModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    DetectionUriBuilderPipe,
    CheckboxModule,
    FormsModule,
    TooltipModule,
    SelectedAnalysisObjectsListingComponent,
    TableChipsFilterComponent,
  ],
  providers: [
    BinaryImpactTableStateService,
    BinaryImpactTableSelectionStateService,
  ],
  templateUrl: "./binary-impacts-selection-table.component.html",
})
export class BinaryImpactsSelectionTableComponent implements OnDestroy {
  private readonly binaryImpactTableStateService = inject(
    BinaryImpactTableStateService
  );
  private readonly binaryImpactTableSelectionStateService = inject(
    BinaryImpactTableSelectionStateService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly filterTranslator = inject(FilterTranslatorService);
  private readonly analysisObjectSelectionStateService = inject(
    AnalysisObjectTableSelectionStateService
  );

  selectedBinaryImpacts = model<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >([]);

  initiallyBinaryImpactSelectionStates =
    this.binaryImpactTableSelectionStateService
      .initiallyBinaryImpactSelectionStates;

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;
  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;

  listOfImpacts = this.binaryImpactTableStateService.binaryImpacts;
  firstRowIndex = computed(
    () =>
      this.binaryImpactTableStateService.page() *
      this.binaryImpactTableStateService.size()
  );
  totalRecords = this.binaryImpactTableStateService.totalElements;
  isLoading = this.binaryImpactTableStateService.isLoading;
  errorMessage = this.binaryImpactTableStateService.errorMessage;
  isInitiallySelectedImpactsLoading =
    this.binaryImpactTableSelectionStateService
      .isInitiallySelectedImpactsLoading;
  initiallyBinaryImpactSelectionStateErrorMessage =
    this.binaryImpactTableSelectionStateService.errorMessage;
  warningMessage = this.binaryImpactTableStateService.warningMessage;

  selectedAnalysisObjects = computed(() => {
    return this.selectedBinaryImpacts().map(
      (
        selectionState: AnalysisObjectSelectionState<LiteBinaryImpact>
      ): SelectedAnalysisObject => {
        return {
          id: selectionState.analysisObject.id,
          title: selectionState.analysisObject.title,
          selectionType: selectionState.selectionType,
          selectionMessage: selectionState.selectionMessage,
        };
      }
    );
  });
  selectedMxVersionPhrases: string[] = [];

  tableRowSelectionState = computed<
    Map<string, BinaryImpactTableRowSelectionState>
  >(() => {
    const binaryImpactTableRowSelectionMap = new Map<
      string,
      BinaryImpactTableRowSelectionState
    >();
    this.listOfImpacts().forEach((impact) => {
      const impactInitialSelectionState = this.selectedBinaryImpacts().find(
        (selectionState) => selectionState.analysisObject.id === impact.id
      );
      binaryImpactTableRowSelectionMap.set(impact.id, {
        selectionState: {
          checked:
            this.analysisObjectSelectionStateService.isAnalysisObjectFullySelected(
              impact,
              this.selectedBinaryImpacts()
            ),
          partialSelected:
            this.analysisObjectSelectionStateService.isAnalysisObjectPartiallySelected(
              impact,
              this.selectedBinaryImpacts()
            ),
          selectionMessage: impactInitialSelectionState?.selectionMessage,
        },
      } as BinaryImpactTableRowSelectionState);
    });
    return binaryImpactTableRowSelectionMap;
  });

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.binaryImpactTableStateService.refreshBinaryImpacts(refresh);
      }
    });
  }

  selectedImpactIdsLoading = model<boolean>(false);
  isTableLoading = computed(() => {
    return (
      this.isLoading() ||
      this.selectedImpactIdsLoading() ||
      this.isInitiallySelectedImpactsLoading()
    );
  });

  @Input({ required: true }) projectId: string;

  @Input()
  set initiallySelectedImpacts(
    initiallySelectedImpacts: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    const current =
      this.binaryImpactTableSelectionStateService.initiallyBinaryImpactSelectionStates();
    const incomingIds = initiallySelectedImpacts.map(
      (i) => i.analysisObject.id
    );
    const currentIds = current.map((i) => i.analysisObject.id);

    if (JSON.stringify(incomingIds) !== JSON.stringify(currentIds)) {
      this.binaryImpactTableSelectionStateService.setInitiallySelectedBinaryImpacts(
        initiallySelectedImpacts
      );
    }
  }

  @Input() set validationScope(validationScope: ValidationScope | undefined) {
    this.binaryImpactTableStateService.setValidationScope(validationScope);
  }

  @Input() set showImpactsWithoutDefects(showImpactsWithoutDefects: boolean) {
    this.binaryImpactTableStateService.showImpactsWithoutDefects(
      showImpactsWithoutDefects
    );
  }

  @Output() warningMessageChange = new EventEmitter<string | undefined>();

  constructor() {
    this.showErrorMessage();
    this.getSelectedBinaryImpacts();
    this.emitWarningMessage();
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent): void {
    const newQuery =
      this.filterTranslator.handleTableFiltersChange<FetchBinaryImpactsTableQuery>(
        event
      );
    this.binaryImpactTableStateService.setBinaryImpactsTableQuery(newQuery);
  }

  handleSelectionChange(event: CheckboxChangeEvent, impact: LiteBinaryImpact) {
    if (event.checked) {
      this.addBinaryImpactToSelection(impact);
    } else {
      this.removeBinaryImpactFromSelection(impact.id);
    }
  }

  removeBinaryImpactFromSelection(id: string) {
    this.selectedBinaryImpacts.update((current) =>
      current.filter((bi) => bi.analysisObject.id !== id)
    );
  }

  private addBinaryImpactToSelection(impact: LiteBinaryImpact) {
    this.selectedBinaryImpacts.update((current) =>
      this.analysisObjectSelectionStateService.computeAnalysisObjectSelectionStatesAfterAnalysisObjectSelection(
        impact,
        current
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private showErrorMessage() {
    combineLatest([
      toObservable(this.errorMessage),
      toObservable(this.initiallyBinaryImpactSelectionStateErrorMessage),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((errors) => {
        errors.forEach((error) => {
          if (error) this.toastMessageService.showError(error);
        });
      });
  }

  private getSelectedBinaryImpacts() {
    toObservable(this.initiallyBinaryImpactSelectionStates)
      .pipe(takeUntil(this.destroy$))
      .subscribe((initiallySelectedBinaryImpacts) => {
        this.selectedBinaryImpacts.set(initiallySelectedBinaryImpacts);
      });
  }

  private emitWarningMessage() {
    toObservable(this.warningMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((warning) => this.warningMessageChange.emit(warning));
  }
}
