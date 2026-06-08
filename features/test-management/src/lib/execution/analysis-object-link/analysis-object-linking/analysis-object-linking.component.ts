import {
  Component,
  computed,
  EventEmitter,
  inject,
  Injector,
  Input,
  model,
  OnDestroy,
  Output,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { TestCaseExecutionStatus } from "../../test-case-execution/status/test-case-execution-status";
import { StepperModule } from "primeng/stepper";
import {
  LinkBinaryImpactModalContentComponent,
  LinkBinaryRegressionModalContentComponent,
  LinkConfigurationImpactModalContentComponent,
  LinkConfigurationRegressionModalContentComponent,
  LinkFailureReasonModalContentComponent,
} from "@mxflow/features/failure-management";
import { finalize, map, Observable, of, Subject, takeUntil, tap } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { AnalysisObjectLinkService } from "../analysis-object-link.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { AnalysisObjectLinksChangedPipe } from "../analysis-object-links-changed/analysis-object-links-changed.pipe";
import { TestCaseExecutionSelectionTableComponent } from "../../test-case-execution/test-case-execution-selection-table/test-case-execution-selection-table.component";
import { ChipModule } from "primeng/chip";
import {
  AnalysisObjectLinkFilterCriteria,
  AnalysisObjectSelectionStateService,
} from "./analysis-object-selection-state.service";
import {
  UpdateAnalysisObjectLinkRequestGeneratorInput,
  UpdateAnalysisObjectLinkRequestGeneratorService,
} from "./update-analysis-object-link-request-generator.service";
import { AnalysisObjectLink } from "../analysis-object-link";
import {
  AnalysisObject,
  AnalysisObjectLinkingStateFactoryService,
  AnalysisObjectLinkingStateService,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectType,
  AnalysisObjectTypeDisplayPipe,
  BinaryImpactLinkingStateService,
  BinaryRegressionLinkingStateService,
  ConfigurationImpactLinkingStateService,
  ConfigurationRegressionLinkingStateService,
  FailureReasonLinkingStateService,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { TooltipModule } from "primeng/tooltip";
import { LinkIncidentsModalContentComponent } from "@mxflow/features/incident-management";
import { CreateCandidateAnalysisObjectLinksRequest } from "../candidate-analysis-object-link";

@Component({
  selector: "mxevolve-analysis-object-linking",
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TableModule,
    CheckboxModule,
    FormsModule,
    StepperModule,
    LinkBinaryImpactModalContentComponent,
    AnalysisObjectLinksChangedPipe,
    TestCaseExecutionSelectionTableComponent,
    ChipModule,
    TooltipModule,
    LinkBinaryRegressionModalContentComponent,
    LinkConfigurationRegressionModalContentComponent,
    LinkIncidentsModalContentComponent,
    LinkConfigurationImpactModalContentComponent,
    LinkFailureReasonModalContentComponent,
  ],
  providers: [
    AnalysisObjectTypeDisplayPipe,
    AnalysisObjectLinkingStateFactoryService,
    FailureReasonLinkingStateService,
    BinaryImpactLinkingStateService,
    BinaryRegressionLinkingStateService,
    ConfigurationImpactLinkingStateService,
    ConfigurationRegressionLinkingStateService,
    IncidentLinkingStateService,
    AnalysisObjectSelectionStateService,
    UpdateAnalysisObjectLinkRequestGeneratorService,
  ],
  templateUrl: "./analysis-object-linking.component.html",
})
export class AnalysisObjectLinkingComponent implements OnDestroy {
  private readonly linkingStateServiceFactory = inject(
    AnalysisObjectLinkingStateFactoryService
  );
  private readonly analysisObjectLinkService = inject(
    AnalysisObjectLinkService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analysisObjectTypeDisplayPipe = inject(
    AnalysisObjectTypeDisplayPipe
  );
  private readonly analysisObjectSelectionStateService = inject(
    AnalysisObjectSelectionStateService
  );
  private readonly updateLinksRequestGenerator = inject(
    UpdateAnalysisObjectLinkRequestGeneratorService
  );
  @Input() initiallySelectedTestCases: TestCaseExecution[] = [];
  private readonly _analysisObjectType = signal<AnalysisObjectType | undefined>(
    undefined
  );
  private readonly injector = inject(Injector);
  private readonly destroy$ = new Subject<void>();
  protected readonly AnalysisObjectType = AnalysisObjectType;
  linkingStateService: AnalysisObjectLinkingStateService;
  stateService = inject(ScenarioExecutionStateManagementService);
  projectId = this.stateService.projectId;
  scenarioExecution = this.stateService.scenarioExecution;
  testCaseExecutions = this.stateService.analyzableTestCaseExecutions;
  validationScope = this.stateService.validationScope;
  validationScopeWarningMessage =
    this.stateService.validationScopeWarningMessage;
  analysisObjectLinksLoading = this.stateService.analysisObjectLinksLoading;
  selectedTestCaseExecutions = signal<TestCaseExecution[]>([]);
  selectedTestExecutions = model<string[]>([]);
  showTestCaseSelectionTable = signal(false);
  selectedTestCaseExecutionTitles = computed(() =>
    this.selectedTestCaseExecutions()
      .map((tc) => tc.title)
      .join(", ")
  );
  statusFilterOptions = Object.values(TestCaseExecutionStatus)
    .filter((status) => status != TestCaseExecutionStatus.SKIPPED)
    .map((status) => ({
      text: status,
      value: status,
    }));
  isScenarioExecutionChecked = model(false);
  currentAnalysisObjectsSelectionState = signal<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >([]);
  isSubmitButtonLoading = false;
  stepperPanelValue = model(1);
  dialogHeader = computed(() => {
    let header = "";
    if (this.isOpeningTestCaseSelectionStep()) {
      header = "Selected Test Case Executions";
    } else if (this.stepperPanelValue() === 2 && this.analysisObjectType) {
      header = `Link to ${this.analysisObjectTypeDisplayPipe.transform(
        this.analysisObjectType
      )}(s)`;
    }
    return header;
  });

  chipMessage = computed(() => {
    let message = "";
    if (this.isScenarioExecutionChecked()) {
      message += "Scenario Execution";
    }
    if (
      this.isScenarioExecutionChecked() &&
      this.selectedTestCaseExecutions().length > 0
    ) {
      message += " and ";
    }
    if (this.selectedTestCaseExecutions().length > 0) {
      message += `${
        this.selectedTestCaseExecutions().length
      } Test Case Execution(s)`;
    }
    if (
      this.isScenarioExecutionChecked() ||
      this.selectedTestCaseExecutions().length > 0
    ) {
      message += " Selected";
    }
    return message;
  });

  disableTestCaseSelection = computed(() => {
    const testCaseExecutions = this.testCaseExecutions();
    const currentTestExecutionId =
      this.stateService.currentlyViewedTestExecutionId();
    return (
      testCaseExecutions.length === 0 ||
      (currentTestExecutionId &&
        testCaseExecutions.every(
          (testCaseExecution) =>
            testCaseExecution.testExecutionId !== currentTestExecutionId
        )) ||
      this.isLinkingFailureReason()
    );
  });

  isLinkingFailureReason = computed(
    () => this._analysisObjectType() === AnalysisObjectType.FAILURE_REASON
  );

  atLeastOneFailureReasonLinked = computed(
    () =>
      this.isLinkingFailureReason() &&
      this.currentAnalysisObjectsSelectionState().some(
        (value) => value.selectionType === AnalysisObjectSelectionType.FULL
      )
  );

  @Input()
  set analysisObjectType(type: AnalysisObjectType | undefined) {
    if (type) {
      this._analysisObjectType.set(type);
      this.linkingStateService =
        this.linkingStateServiceFactory.getAnalysisObjectLinkingStateService(
          type
        );
      this.changeModalVisibilityOnIsLinkingChange();
      this.resetModalStateOnRefreshEvent();
    }
  }

  get analysisObjectType(): AnalysisObjectType | undefined {
    return this._analysisObjectType();
  }

  @Output() analysisObjectLinksChanged = new EventEmitter<void>();

  isModalVisible = model.required<boolean>();

  initiallyLinkedAnalysisObjects = computed<AnalysisObjectLink[]>(() => {
    if (this.analysisObjectType) {
      const filterCriteria: AnalysisObjectLinkFilterCriteria = {
        analysisObjectType: this.analysisObjectType,
        testCaseExecutions: this.selectedTestCaseExecutions(),
        linkedToScenarioExecution: this.isScenarioExecutionChecked(),
      };
      return this.analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution(
        this.stateService.analysisObjectLinks(),
        filterCriteria
      );
    }
    return [];
  });

  initialAnalysisObjectsSelectionState = computed<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >(() => {
    const initiallyLinkedAnalysisObjectsSelectionState =
      this.analysisObjectSelectionStateService.getInitiallyLinkedAnalysisObjectsSelectionState(
        this.initiallyLinkedAnalysisObjects(),
        this.selectedTestCaseExecutions(),
        this.isScenarioExecutionChecked()
      );
    if (this.analysisObjectType === AnalysisObjectType.INCIDENT) {
      const incidents = this.stateService.linkedIncidents();
      return initiallyLinkedAnalysisObjectsSelectionState.map(
        (selectionState) => {
          const incident = incidents.find(
            (incident) => incident.id === selectionState.analysisObject.id
          );
          return {
            ...selectionState,
            analysisObject: incident ?? selectionState.analysisObject,
          };
        }
      );
    }

    return initiallyLinkedAnalysisObjectsSelectionState;
  });

  constructor() {
    this.setIsLinkingOnModalVisibilityChange();
    this.handleDisableTestCaseSelectionChange();
    this.handleSelectedTestCaseExecutionsChange();
  }

  private handleSelectedTestCaseExecutionsChange() {
    toObservable(this.selectedTestCaseExecutions)
      .pipe(takeUntil(this.destroy$))
      .subscribe((testCases) => {
        if (testCases.length > 0 && this.isLinkingFailureReason()) {
          this.isScenarioExecutionChecked.set(false);
        }
      });
  }

  private handleDisableTestCaseSelectionChange() {
    toObservable(this.disableTestCaseSelection).subscribe(
      (disableTestCaseSelection) => {
        this.stepperPanelValue.set(disableTestCaseSelection ? 2 : 1);
        this.isScenarioExecutionChecked.set(disableTestCaseSelection);
      }
    );
  }

  private setIsLinkingOnModalVisibilityChange() {
    toObservable(this.isModalVisible)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isVisible) => {
        this.showTestCaseSelectionTable.set(false);

        if (isVisible) {
          this.linkingStateService.setIsLinking(true);
          if (
            this.initiallySelectedTestCases &&
            this.initiallySelectedTestCases.length > 0
          ) {
            this.selectedTestCaseExecutions.set(
              this.initiallySelectedTestCases
            );
          } else if (this.isOpeningTestCaseSelectionStep()) {
            this.preselectTestCasesFromSelectedTestCaseInWebReport();
            this.prefilterTestCasesOnCurrentlyOpenedTestExecutionReport();
          }

          this.showTestCaseSelectionTable.set(!this.disableTestCaseSelection());
        }
      });
  }

  private prefilterTestCasesOnCurrentlyOpenedTestExecutionReport() {
    const webReportSelectedTestExecutionId =
      this.stateService.currentlyViewedTestExecutionId();
    this.selectedTestExecutions.set(
      webReportSelectedTestExecutionId ? [webReportSelectedTestExecutionId] : []
    );
  }

  private preselectTestCasesFromSelectedTestCaseInWebReport() {
    this.selectedTestCaseExecutions.set(
      this.stateService.webReportSelectedTestCaseExecutions()
    );
  }

  private isOpeningTestCaseSelectionStep() {
    return this.stepperPanelValue() === 1;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAnalysisObjectSelectionChange(
    selectedLiteDetection: AnalysisObjectSelectionState<AnalysisObject>[]
  ) {
    this.currentAnalysisObjectsSelectionState.set(selectedLiteDetection);
  }

  createAnalysisObjectLink = (analysisObjectId: string) => {
    return this.stateService
      .updateAnalysisObjectsLinks({
        linksToAdd: this.updateLinksRequestGenerator.getLinksToAdd(
          [analysisObjectId],
          this.getUpdateAnalysisObjectLinkRequestGeneratorInput()
        ),
        linksToRemove: [],
      })
      .pipe(
        tap(() => this.analysisObjectLinksChanged.emit()),
        map(() => null)
      );
  };

  createCandidateAnalysisObjectLinks = (): Observable<string | undefined> => {
    const analysisObjectType = this.analysisObjectType;
    if (
      (this.selectedTestCaseExecutions().length > 0 ||
        this.isScenarioExecutionChecked()) &&
      analysisObjectType
    ) {
      return this.analysisObjectLinkService
        .createCandidateAnalysisObjectLinks(
          this.projectId(),
          this.scenarioExecution().id,
          this.getCreateCandidateAnalysisObjectLinksRequest(analysisObjectType)
        )
        .pipe(map((response) => response.id));
    }
    return of(undefined);
  };

  private getCreateCandidateAnalysisObjectLinksRequest(
    analysisObjectType: AnalysisObjectType
  ): CreateCandidateAnalysisObjectLinksRequest {
    return {
      analysisObjectType: analysisObjectType,
      candidateLinks: [
        ...this.selectedTestCaseExecutions().map((testCaseExecution) => ({
          testCaseExecutionId: testCaseExecution.id,
        })),
        ...(this.isScenarioExecutionChecked()
          ? [{ testCaseExecutionId: undefined }]
          : []),
      ],
    };
  }

  hideModal() {
    this.linkingStateService.setIsLinking(false);
    if (!this.linkingStateService.isCreating()) {
      this.resetModalState();
    }
  }

  private resetModalState() {
    this.selectedTestCaseExecutions.set([]);
    if (!this.disableTestCaseSelection()) {
      this.stepperPanelValue.set(1);
      this.isScenarioExecutionChecked.set(false);
    }
  }

  updateLinks() {
    const analysisObjectType = this.analysisObjectType;
    if (analysisObjectType) {
      this.isSubmitButtonLoading = true;
      this.stateService
        .updateAnalysisObjectsLinks(
          this.updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest(
            this.getUpdateAnalysisObjectLinkRequestGeneratorInput()
          )
        )
        .pipe(finalize(() => (this.isSubmitButtonLoading = false)))
        .subscribe({
          next: () => {
            this.analysisObjectLinksChanged.emit();
            this.isModalVisible.set(false);
            this.toastMessageService.showSuccess(
              `${this.analysisObjectTypeDisplayPipe.transform(
                analysisObjectType
              )} links were updated successfully`
            );
          },
          error: (error) => {
            this.toastMessageService.showError(error);
          },
        });
    }
  }

  private getUpdateAnalysisObjectLinkRequestGeneratorInput(): UpdateAnalysisObjectLinkRequestGeneratorInput {
    return this.analysisObjectType
      ? {
          projectId: this.projectId(),
          scenarioExecutionId: this.scenarioExecution().id,
          analysisObjectType: this.analysisObjectType,
          currentAnalysisObjectsSelectionState:
            this.currentAnalysisObjectsSelectionState(),
          initiallyLinkedAnalysisObjectsState:
            this.initialAnalysisObjectsSelectionState(),
          initialAnalysisObjectLinks: this.initiallyLinkedAnalysisObjects(),
          testCaseExecutions: this.selectedTestCaseExecutions(),
          isScenarioExecutionSelected: this.isScenarioExecutionChecked(),
        }
      : ({} as UpdateAnalysisObjectLinkRequestGeneratorInput);
  }

  private resetModalStateOnRefreshEvent() {
    this.linkingStateService.reset$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetModalState();
      });
  }

  private changeModalVisibilityOnIsLinkingChange() {
    toObservable(this.linkingStateService.isLinking, {
      injector: this.injector,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLinking) => {
        this.isModalVisible.set(isLinking);
      });
  }
}
