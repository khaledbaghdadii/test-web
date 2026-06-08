import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { AnalysisObjectLinkingComponent } from "./analysis-object-linking.component";
import { fakeAsync, tick } from "@angular/core/testing";
import { signal, Type } from "@angular/core";
import {
  testCaseExecution1,
  testCaseExecution2,
  testCaseExecution3,
} from "../../test-case-execution/test-case-execution-utils";
import { scenarioExecution } from "../../scenario-execution/scenario-execution-test-utils";
import { By } from "@angular/platform-browser";
import { TestCaseExecutionStatus } from "../../test-case-execution/status/test-case-execution-status";
import {
  LinkBinaryImpactModalContentComponent,
  LinkBinaryRegressionModalContentComponent,
  LinkConfigurationImpactModalContentComponent,
  LinkConfigurationRegressionModalContentComponent,
} from "@mxflow/features/failure-management";
import {
  DefaultRenderComponent,
  MockBuilder,
  MockedComponentFixture,
  MockRender,
} from "ng-mocks";
import {
  ANALYSIS_OBJECT_1,
  analysisObjectId1,
  getAnalysisObjectLink1,
  getAnalysisObjectLink2,
  getAnalysisObjectLink3,
  getAnalysisObjectLinkWithEmptyTestCaseExecution,
  getFullySelectedAnalysisObject,
  getInitiallyFullyLinkedAnalysisObject,
  INCIDENT_1,
  LITE_BINARY_IMPACT_1,
  LITE_BINARY_IMPACT_2,
  projectId,
  scenarioExecutionId,
  testCaseExecutionId1,
  testCaseExecutionId3,
  updateLinksRequestGeneratorDefaultInput,
} from "../analysis-object-link-test-utils";
import { TableModule } from "primeng/table";
import { CheckboxModule } from "primeng/checkbox";
import { Dialog } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { AnalysisObjectLinkService } from "../analysis-object-link.service";
import { BehaviorSubject, delay, of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { Stepper, StepperModule } from "primeng/stepper";
import { Chip } from "primeng/chip";
import { AnalysisObjectLink } from "../analysis-object-link";
import { AnalysisObjectSelectionStateService } from "./analysis-object-selection-state.service";
import {
  UpdateAnalysisObjectLinkRequestGeneratorInput,
  UpdateAnalysisObjectLinkRequestGeneratorService,
} from "./update-analysis-object-link-request-generator.service";
import {
  AnalysisObjectLinkingStateFactoryService,
  AnalysisObjectLinkingStateService,
  AnalysisObjectType,
  AnalysisObjectTypeDisplayPipe,
} from "@mxflow/features/analysis-objects";
import {
  Incident,
  LinkIncidentsModalContentComponent,
} from "@mxflow/features/incident-management";
import { TestCaseExecutionSelectionTableComponent } from "../../test-case-execution/test-case-execution-selection-table/test-case-execution-selection-table.component";
import { CreateCandidateAnalysisObjectLinksRequest } from "../candidate-analysis-object-link";
import { AnalysisObjectLinksChangedPipe } from "../analysis-object-links-changed/analysis-object-links-changed.pipe";
import { DomTestUtils, getTooltipTextByTestId } from "@mxevolve/testing";

const ANALYSIS_OBJECT_TYPE_DISPLAY = "kalamantina";

describe("Analysis Object Linking", () => {
  let stateService: any;
  let linkingStateService: AnalysisObjectLinkingStateService;
  let linkingStateFactoryService: AnalysisObjectLinkingStateFactoryService;
  let analysisObjectLinksService: AnalysisObjectLinkService;
  let toastMessageService: ToastMessageService;
  let analysisObjectTypeDisplayPipe: AnalysisObjectTypeDisplayPipe;
  let analysisObjectSelectionStateService: AnalysisObjectSelectionStateService;
  let updateLinksRequestGenerator: UpdateAnalysisObjectLinkRequestGeneratorService;
  let component: AnalysisObjectLinkingComponent;
  let fixture: MockedComponentFixture<AnalysisObjectLinkingComponent>;
  const linkedIncidents = signal<Incident[]>([]);
  const analysisObjectLinksChangedPipeTransform = jest
    .fn()
    .mockReturnValue(true);
  const params = {
    isModalVisible: true,
    analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
  } as unknown as DefaultRenderComponent<AnalysisObjectLinkingComponent>;

  beforeEach(async () => {
    stateService = {
      linkedIncidents: linkedIncidents,
      analyzableTestCaseExecutions: signal([
        testCaseExecution1,
        testCaseExecution2,
        testCaseExecution3,
      ]),
      projectId: signal(projectId),
      scenarioExecution: signal({
        ...scenarioExecution,
        id: scenarioExecutionId,
      }),
      validationScope: signal(undefined),
      validationScopeWarningMessage: signal(undefined),
      analysisObjectLinks: signal<AnalysisObjectLink[]>([]),
      webReportSelectedTestCaseExecutions: signal([]),
      currentlyViewedTestExecutionId: signal(undefined),
      analysisObjectLinksLoading: signal(false),
      updateAnalysisObjectsLinks: jest.fn(() => of(null)),
    };

    linkingStateService = {
      isLinking: signal(false),
      isCreating: signal(false),
      setIsLinking: jest.fn(),
      reset$: new BehaviorSubject<undefined>(undefined),
    } as unknown as AnalysisObjectLinkingStateService;

    linkingStateFactoryService = {
      getAnalysisObjectLinkingStateService: jest
        .fn()
        .mockReturnValue(linkingStateService),
    } as unknown as AnalysisObjectLinkingStateFactoryService;

    analysisObjectLinksService = {
      createCandidateAnalysisObjectLinks: jest.fn(() => of()),
    } as unknown as AnalysisObjectLinkService;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    analysisObjectSelectionStateService = {
      getInitiallyLinkedAnalysisObjectsSelectionState: jest.fn(() => []),
      getIdsWithPartialToFullSelectionChange: jest.fn(() => []),
      getAnalysisObjectsLinkedToScenarioOrTestCaseExecution: jest.fn(() => []),
    } as unknown as AnalysisObjectSelectionStateService;

    updateLinksRequestGenerator = {
      generateUpdateAnalysisObjectLinkRequest: jest.fn(() => ({
        linksToAdd: [],
        linksToRemove: [],
      })),
      getLinksToAdd: jest.fn(() => []),
    } as unknown as UpdateAnalysisObjectLinkRequestGeneratorService;

    jest.clearAllMocks();

    await MockBuilder(AnalysisObjectLinkingComponent)
      .mock(ScenarioExecutionStateManagementService, stateService)
      .mock(
        AnalysisObjectLinkingStateFactoryService,
        linkingStateFactoryService
      )
      .mock(AnalysisObjectLinkService, analysisObjectLinksService)
      .mock(ToastMessageService, toastMessageService)
      .mock(AnalysisObjectTypeDisplayPipe)
      .mock(
        AnalysisObjectLinksChangedPipe,
        analysisObjectLinksChangedPipeTransform
      )
      .mock(
        AnalysisObjectSelectionStateService,
        analysisObjectSelectionStateService
      )
      .mock(
        UpdateAnalysisObjectLinkRequestGeneratorService,
        updateLinksRequestGenerator
      )
      .mock(Dialog, { render: { header: true } })
      .keep(CheckboxModule)
      .keep(StepperModule)
      .keep(TableModule)
      .keep(ButtonModule)
      .keep(TooltipModule)
      .keep(Chip);

    fixture = MockRender(AnalysisObjectLinkingComponent, params);
    component = fixture.point.componentInstance;
    component.isModalVisible.set(true);
    fixture.detectChanges();

    analysisObjectTypeDisplayPipe = fixture.point.injector.get(
      AnalysisObjectTypeDisplayPipe
    );
    jest
      .spyOn(analysisObjectTypeDisplayPipe, "transform")
      .mockReturnValue(ANALYSIS_OBJECT_TYPE_DISPLAY);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("handle undefined analysis object type", () => {
    beforeEach(async () => {
      const params = {
        isModalVisible: true,
        analysisObjectType: undefined,
      } as unknown as DefaultRenderComponent<AnalysisObjectLinkingComponent>;

      fixture = MockRender(AnalysisObjectLinkingComponent, params);
      component = fixture.point.componentInstance;
      component.isModalVisible.set(true);
      fixture.detectChanges();

      analysisObjectTypeDisplayPipe = fixture.point.injector.get(
        AnalysisObjectTypeDisplayPipe
      );
      jest
        .spyOn(analysisObjectTypeDisplayPipe, "transform")
        .mockReturnValue(ANALYSIS_OBJECT_TYPE_DISPLAY);
    });

    it("initiallyLinkedAnalysisObjects should be empty", () => {
      jest.clearAllMocks();

      expect(component.initiallyLinkedAnalysisObjects()).toEqual([]);
      expect(
        analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
      ).not.toHaveBeenCalled();
    });

    it("should not create a candidate link if no analysis object type is provided", () => {
      component.selectedTestCaseExecutions.set([testCaseExecution1]);

      component.createCandidateAnalysisObjectLinks();

      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).not.toHaveBeenCalled();
    });

    it("should not call the update links if no analysis object is provided", () => {
      component.updateLinks();
      expect(stateService.updateAnalysisObjectsLinks).not.toHaveBeenCalled();
    });

    it("should not reset the selected test case executions when analysis object type is undefined", () => {
      component.selectedTestCaseExecutions.set([testCaseExecution1]);
      linkingStateService.reset$.next(undefined);
      expect(component.selectedTestCaseExecutions()).toEqual([
        testCaseExecution1,
      ]);
    });

    it("should not reset the stepper value back to 1 when analysis object type is undefined", () => {
      component.stepperPanelValue.set(2);
      component.analysisObjectType = undefined;
      linkingStateService.reset$.next(undefined);
      expect(component.stepperPanelValue()).toEqual(2);
    });

    it("should not reset isScenarioExecutionChecked back to false when analysis object type is undefined", () => {
      component.isScenarioExecutionChecked.set(true);
      component.analysisObjectType = undefined;
      linkingStateService.reset$.next(undefined);
      expect(component.isScenarioExecutionChecked()).toBeTruthy();
    });

    it("should not change isModalVisible when analysis object type is undefined and linkingStateService.isLinking changes", () => {
      component.isModalVisible.set(true);
      component.analysisObjectType = undefined;
      linkingStateService.isLinking.set(false);
      expect(component.isModalVisible()).toBeTruthy();
    });

    it("should not call analysis object type display pipe when analysis object type is undefined", fakeAsync(() => {
      component.stepperPanelValue.set(2);
      expect(analysisObjectTypeDisplayPipe.transform).not.toHaveBeenCalled();
    }));

    it("dialog header should be empty when analysis object type is undefined", fakeAsync(() => {
      component.stepperPanelValue.set(2);
      expect(component.dialogHeader()).toEqual("");
    }));

    it("should not display analysis object link header when the current active step is the analysis object selection and analysis object type is undefined", () => {
      navigateToNextStep();
      expect(getComponent(Dialog).header).toEqual("");
    });
  });

  it("should pass first business process id as input to link incidents modal content component", () => {
    component.analysisObjectType = AnalysisObjectType.INCIDENT;
    fixture.detectChanges();
    navigateToNextStep();

    expect(
      getComponent(LinkIncidentsModalContentComponent).businessProcessId
    ).toBe(scenarioExecution.businessProcesses[0].id);
  });

  it("should set the selected test case executions from the state service whenever the modal is opened", () => {
    component.isModalVisible.set(false);
    stateService.webReportSelectedTestCaseExecutions.set([
      testCaseExecution1,
      testCaseExecution2,
    ]);
    fixture.detectChanges();
    component.isModalVisible.set(true);
    fixture.detectChanges();

    expect(component.selectedTestCaseExecutions()).toEqual([
      testCaseExecution1,
      testCaseExecution2,
    ]);
  });

  it("should not preselect test case executions when the modal is directly opened on the second page of the stepper", () => {
    component.isModalVisible.set(false);
    component.selectedTestCaseExecutions.set([]);
    stateService.webReportSelectedTestCaseExecutions.set([
      testCaseExecution1,
      testCaseExecution2,
    ]);
    component.stepperPanelValue.set(2);
    fixture.detectChanges();
    component.isModalVisible.set(true);
    fixture.detectChanges();

    expect(component.selectedTestCaseExecutions()).toEqual([]);
  });

  it("preselecting test cases from the component input should take precedence over the currently selected test case execution from the web report", () => {
    component.isModalVisible.set(false);
    component.selectedTestCaseExecutions.set([]);
    stateService.webReportSelectedTestCaseExecutions.set([testCaseExecution3]);
    fixture.detectChanges();
    component.initiallySelectedTestCases = [
      testCaseExecution1,
      testCaseExecution2,
    ];
    component.isModalVisible.set(true);
    fixture.detectChanges();

    expect(component.selectedTestCaseExecutions()).toEqual([
      testCaseExecution1,
      testCaseExecution2,
    ]);
  });

  it("should not set the selected test case executions from the state service whenever the modal is closed", () => {
    stateService.webReportSelectedTestCaseExecutions.set([
      testCaseExecution1,
      testCaseExecution2,
    ]);
    fixture.detectChanges();
    component.isModalVisible.set(false);
    fixture.detectChanges();
    expect(component.selectedTestCaseExecutions()).toEqual([]);
  });

  it("should set selectedTestExecutions to empty array when modal is visible and state value is undefined", () => {
    component.isModalVisible.set(false);
    stateService.currentlyViewedTestExecutionId.set(undefined);
    fixture.detectChanges();
    component.isModalVisible.set(true);
    fixture.detectChanges();
    expect(component.selectedTestExecutions()).toEqual([]);
  });

  it("should set selectedTestExecutions to array with value when modal is visible and state value is defined", () => {
    component.isModalVisible.set(false);
    stateService.currentlyViewedTestExecutionId.set(
      testCaseExecution1.testExecutionId
    );
    fixture.detectChanges();
    component.isModalVisible.set(true);
    fixture.detectChanges();
    expect(component.selectedTestExecutions()).toEqual([
      testCaseExecution1.testExecutionId,
    ]);
  });

  it("should render the test case selection table when test case selection is enabled", () => {
    stateService.analyzableTestCaseExecutions.set([testCaseExecution1]);
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(
        fixture,
        "test-case-execution-selection-table"
      ).getInstance()
    ).toBeTruthy();
  });

  it("should not render the selection table when test case selection is disabled", () => {
    stateService.analyzableTestCaseExecutions.set([]);
    fixture.detectChanges();

    expect(
      DomTestUtils.getElementByTestId(
        fixture,
        "test-case-execution-selection-table"
      ).getInstance()
    ).toBeUndefined();
  });

  it("should keep selectedTestExecutions unchanged when modal is not visible", () => {
    stateService.currentlyViewedTestExecutionId.set("test-exec-2");
    fixture.detectChanges();
    component.isModalVisible.set(false);
    fixture.detectChanges();
    expect(component.selectedTestExecutions()).toEqual([]);
  });

  it("should pass selectedTestExecutions as selectedTestExecutionFilters to test case selection table", () => {
    component.selectedTestExecutions.set(["test-exec-1", "test-exec-2"]);

    expect(
      getComponent(TestCaseExecutionSelectionTableComponent)
        .selectedTestExecutionFilters
    ).toEqual(["test-exec-1", "test-exec-2"]);
  });

  describe("setting analysisObjectType", () => {
    it.each([
      [AnalysisObjectType.BINARY_IMPACT],
      [AnalysisObjectType.CONFIGURATION_REGRESSION],
      [AnalysisObjectType.BINARY_REGRESSION],
    ])(
      "should initialize the linking state service based on the analysis object type: %s",
      (type) => {
        component.analysisObjectType = type;
        expect(
          linkingStateFactoryService.getAnalysisObjectLinkingStateService
        ).toHaveBeenCalledWith(type);
        expect(component.linkingStateService).toBe(linkingStateService);
      }
    );

    it("should set modal visibility to true whenever isLinking is true", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.isModalVisible.set(false);
      fixture.detectChanges();

      linkingStateService.isLinking.set(true);
      fixture.detectChanges();

      expect(component.isModalVisible()).toBeTruthy();
    });

    it("should set modal visibility to false whenever isLinking is false", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.isModalVisible.set(true);

      fixture.detectChanges();

      linkingStateService.isLinking.set(false);
      fixture.detectChanges();

      expect(component.isModalVisible()).toBeFalsy();
    });

    it("should stop changing modal visibility when the component is destroyed", fakeAsync(() => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.isModalVisible.set(false);

      fixture.detectChanges();

      component.ngOnDestroy();
      linkingStateService.isLinking.set(true);
      tick();

      fixture.detectChanges();
      expect(component.isModalVisible()).toBeFalsy();
    }));

    it("should reset modal state when reset event is received", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.stepperPanelValue.set(2);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.isScenarioExecutionChecked.set(true);

      linkingStateService.reset$.next(undefined);

      expect(component.stepperPanelValue()).toEqual(1);
      expect(component.selectedTestCaseExecutions()).toEqual([]);
      expect(component.isScenarioExecutionChecked()).toBeFalsy();
    });

    it("should not set scenario execution checked to false if test case selection is disabled", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.stepperPanelValue.set(2);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.isScenarioExecutionChecked.set(true);
      stateService.analyzableTestCaseExecutions.set([]);
      stateService.currentlyViewedTestExecutionId.set("some-test-exec-id");

      linkingStateService.reset$.next(undefined);

      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(component.stepperPanelValue()).toEqual(2);
      expect(component.selectedTestCaseExecutions()).toEqual([]);
      expect(component.isScenarioExecutionChecked()).toBeTruthy();
    });

    it("should stop resetting modal state when the component is destroyed", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.stepperPanelValue.set(2);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.isScenarioExecutionChecked.set(true);

      component.ngOnDestroy();
      linkingStateService.reset$.next(undefined);

      expect(component.stepperPanelValue()).toEqual(2);
      expect(component.selectedTestCaseExecutions()).toEqual([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      expect(component.isScenarioExecutionChecked()).toBeTruthy();
    });
  });

  describe("isModalVisible", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should set isLinking state to true when isModalVisible is true", () => {
      component.isModalVisible.set(false);
      fixture.detectChanges();
      component.isModalVisible.set(true);
      fixture.detectChanges();
      expect(linkingStateService.setIsLinking).toHaveBeenCalledWith(true);
    });

    it("should not update isLinking if isModalVisible is false", () => {
      jest.clearAllMocks();

      component.isModalVisible.set(false);
      fixture.detectChanges();
      expect(linkingStateService.setIsLinking).not.toHaveBeenCalled();
    });

    it("should not update isLinking state when the component is destroyed", () => {
      jest.clearAllMocks();

      component.isModalVisible.set(false);
      fixture.detectChanges();
      component.ngOnDestroy();
      component.isModalVisible.set(true);
      fixture.detectChanges();
      expect(linkingStateService.setIsLinking).not.toHaveBeenCalled();
    });
  });

  describe("dialog header", () => {
    it("should set the default header to empty string", () => {
      component.stepperPanelValue.set(-1);
      expect(component.dialogHeader()).toEqual("");
    });

    it("should set the dialog header signal to Selected Test Cases when stepper is on the first step", () => {
      component.stepperPanelValue.set(1);
      expect(component.dialogHeader()).toEqual("Selected Test Case Executions");
    });

    it("should set the dialog header signal to Link To Analysis Object when stepper is on the second step", fakeAsync(() => {
      component.stepperPanelValue.set(2);
      expect(component.dialogHeader()).toEqual(
        `Link to ${ANALYSIS_OBJECT_TYPE_DISPLAY}(s)`
      );
      expect(analysisObjectTypeDisplayPipe.transform).toHaveBeenCalledWith(
        component.analysisObjectType
      );
    }));

    it("should set the dialog header to Link To the new Analysis Object when stepper is on the second step and the dialog previously was used for a different analysis object type", fakeAsync(() => {
      stateService.analyzableTestCaseExecutions.set([]);
      stateService.currentlyViewedTestExecutionId.set("some-test-exec-id");
      expect(component.disableTestCaseSelection()).toBeTruthy();
      jest
        .spyOn(analysisObjectTypeDisplayPipe, "transform")
        .mockImplementation((analysisObjectType) => {
          if (analysisObjectType === AnalysisObjectType.BINARY_IMPACT) {
            return "Binary Impact";
          } else if (
            analysisObjectType === AnalysisObjectType.CONFIGURATION_REGRESSION
          ) {
            return "Configuration Regression";
          }
          return "";
        });

      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      navigateToNextStep();

      const dialog = getComponent(Dialog);

      expect(dialog.header).toEqual(`Link to Binary Impact(s)`);

      component.analysisObjectType =
        AnalysisObjectType.CONFIGURATION_REGRESSION;

      fixture.detectChanges();

      expect(dialog.header).toEqual(`Link to Configuration Regression(s)`);
    }));

    it("should display test case step header when the current active step is the test case selection", () => {
      getComponent(Stepper).value.set(1);
      expect(getComponent(Dialog).header).toEqual(
        "Selected Test Case Executions"
      );
    });

    it("should display analysis object link header when the current active step is the analysis object selection", () => {
      navigateToNextStep();
      expect(getComponent(Dialog).header).toEqual(
        `Link to ${ANALYSIS_OBJECT_TYPE_DISPLAY}(s)`
      );
    });

    it("should display the selected test case executions tag in the dialog header", () => {
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      expect(getComponent(Chip).label).toEqual(
        "2 Test Case Execution(s) Selected"
      );
    });

    it("should not display scenario execution selected in chip in case test case selection is disabled", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      stateService.currentlyViewedTestExecutionId.set("some-test-exec-id");
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(true);
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(
        DomTestUtils.getElementByType(fixture, Chip).isRendered()
      ).toBeFalsy();
    });

    it("should display scenario execution selected tag in the dialog header if only the scenario execution is selected", () => {
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(true);
      expect(getComponent(Chip).label).toEqual("Scenario Execution Selected");
    });

    it("should display scenario execution and test cases selected tag in the dialog header if both the scenario execution and test cases are selected", () => {
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.isScenarioExecutionChecked.set(true);
      expect(getComponent(Chip).label).toEqual(
        "Scenario Execution and 2 Test Case Execution(s) Selected"
      );
    });

    it("should not display the selected test case executions tag in the dialog header when no test cases or scenario execution are selected", () => {
      component.selectedTestCaseExecutions.set([]);
      expect(
        DomTestUtils.getElementByType(fixture, Chip).isRendered()
      ).toBeFalsy();
    });
  });

  describe("selectedTestCaseExecutionTitles", () => {
    it("should return empty string if no test case executions are selected", () => {
      component.selectedTestCaseExecutions.set([]);
      expect(component.selectedTestCaseExecutionTitles()).toEqual("");
    });

    it("should return the title of a selected test case execution if only one is selected", () => {
      component.selectedTestCaseExecutions.set([testCaseExecution1]);
      expect(component.selectedTestCaseExecutionTitles()).toEqual(
        testCaseExecution1.title
      );
    });

    it("should return a comma-separated list of titles if multiple test case executions are selected", () => {
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      expect(component.selectedTestCaseExecutionTitles()).toEqual(
        `${testCaseExecution1.title}, ${testCaseExecution2.title}`
      );
    });

    it("should compute the correct tooltip value to display on the selected test case executions chip", () => {
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      fixture.detectChanges();

      expect(
        getTooltipTextByTestId(fixture, "selected-test-cases-chip")
      ).toEqual(`${testCaseExecution1.title}, ${testCaseExecution2.title}`);
    });
  });

  it("should initialize the test case executions correctly", () => {
    expect(component.testCaseExecutions()).toEqual([
      testCaseExecution1,
      testCaseExecution2,
      testCaseExecution3,
    ]);
  });

  it("should initialize the scenario execution correctly", () => {
    expect(component.scenarioExecution()).toEqual({
      ...scenarioExecution,
      id: scenarioExecutionId,
    });
  });

  it("should initialize the status filter options correctly", () => {
    expect(component.statusFilterOptions).toEqual([
      {
        text: TestCaseExecutionStatus.NOT_STARTED,
        value: TestCaseExecutionStatus.NOT_STARTED,
      },
      {
        text: TestCaseExecutionStatus.UNDERWAY,
        value: TestCaseExecutionStatus.UNDERWAY,
      },
      {
        text: TestCaseExecutionStatus.PASSED,
        value: TestCaseExecutionStatus.PASSED,
      },
      {
        text: TestCaseExecutionStatus.FAILED,
        value: TestCaseExecutionStatus.FAILED,
      },
      { text: TestCaseExecutionStatus.NA, value: TestCaseExecutionStatus.NA },
    ]);
  });

  it("should initialize the is scenario execution checked to false", () => {
    expect(component.isScenarioExecutionChecked()).toBeFalsy();
  });

  it("should set is scenario execution checked to false when selected test case executions exist and liking failure reasons", () => {
    component.isScenarioExecutionChecked.set(true);
    component.analysisObjectType = AnalysisObjectType.FAILURE_REASON;
    component.selectedTestCaseExecutions.set([
      testCaseExecution1,
      testCaseExecution2,
    ]);
    fixture.detectChanges();
    expect(component.isScenarioExecutionChecked()).toBeFalsy();
  });

  it("should update the scenario execution selected flag correctly", () => {
    const checkboxDebugElement = fixture.debugElement.query(
      By.css("#scenario-execution-checkbox")
    );
    expect(component.isScenarioExecutionChecked()).toBeFalsy();
    checkboxDebugElement.triggerEventHandler("ngModelChange", true);
    fixture.detectChanges();
    expect(component.isScenarioExecutionChecked()).toBeTruthy();
  });

  describe("initialAnalysisObjectsSelectionState", () => {
    it("should call the analysisObjectSelectionStateService to get the analysis objects linked to the selected executions", () => {
      const initiallyLinkedAnalysisObjects = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
      ];
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getAnalysisObjectsLinkedToScenarioOrTestCaseExecution"
        )
        .mockReturnValue(initiallyLinkedAnalysisObjects);
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;

      expect(component.initiallyLinkedAnalysisObjects()).toEqual(
        initiallyLinkedAnalysisObjects
      );
      expect(
        analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
      ).toHaveBeenCalled();
    });

    it("should call the analysisObjectSelectionStateService with the analysis object links", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      const analysisObjectLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink2(AnalysisObjectType.BINARY_IMPACT),
      ];
      stateService.analysisObjectLinks.set(analysisObjectLinks);
      component.selectedTestCaseExecutions.set([]);

      component.initiallyLinkedAnalysisObjects();

      expect(
        analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
      ).toHaveBeenCalledWith(analysisObjectLinks, {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: false,
      });
    });

    it.each([
      [AnalysisObjectType.BINARY_IMPACT],
      [AnalysisObjectType.BINARY_REGRESSION],
      [AnalysisObjectType.CONFIGURATION_REGRESSION],
    ])(
      "should call the analysisObjectSelectionStateService with the analysis object type %s as a filter criteria",
      (type) => {
        component.analysisObjectType = type;
        stateService.analysisObjectLinks.set([]);

        component.initiallyLinkedAnalysisObjects();

        expect(
          analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
        ).toHaveBeenCalledWith([], {
          analysisObjectType: type,
          testCaseExecutions: [],
          linkedToScenarioExecution: false,
        });
      }
    );

    it("should call  the analysisObjectSelectionStateService with the selected test cases as a filter criteria", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);

      component.initiallyLinkedAnalysisObjects();

      expect(
        analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
      ).toHaveBeenCalledWith([], {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [testCaseExecution1, testCaseExecution2],
        linkedToScenarioExecution: false,
      });
    });

    it("should call the analysisObjectSelectionStateService with scenario execution checked as true when checked", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.isScenarioExecutionChecked.set(true);
      stateService.analysisObjectLinks.set([]);

      component.initiallyLinkedAnalysisObjects();

      expect(
        analysisObjectSelectionStateService.getAnalysisObjectsLinkedToScenarioOrTestCaseExecution
      ).toHaveBeenCalledWith([], {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        testCaseExecutions: [],
        linkedToScenarioExecution: true,
      });
    });

    it("should add the incident details to the analysis object part of the initial analysis object selection state", () => {
      linkedIncidents.set([
        {
          ...INCIDENT_1,
          id: analysisObjectId1,
        },
      ]);
      const initialLinks = [
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ];
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getInitiallyLinkedAnalysisObjectsSelectionState"
        )
        .mockReturnValue(initialLinks);
      component.analysisObjectType = AnalysisObjectType.INCIDENT;
      stateService.analysisObjectLinks.set([
        getAnalysisObjectLink1(AnalysisObjectType.INCIDENT),
        getAnalysisObjectLink3(AnalysisObjectType.INCIDENT),
      ]);
      component.selectedTestCaseExecutions.set([testCaseExecution1]);

      expect(component.initialAnalysisObjectsSelectionState()).toEqual([
        {
          ...getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
          analysisObject: {
            ...INCIDENT_1,
            id: analysisObjectId1,
          },
        },
      ]);
    });
  });

  describe("initialAnalysisObjectsSelectionState", () => {
    it("should call the analysisObjectSelectionStateService to get the initially linked analysis objects state", () => {
      const initialLinks = [
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ];
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getInitiallyLinkedAnalysisObjectsSelectionState"
        )
        .mockReturnValue(initialLinks);
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      stateService.analysisObjectLinks.set([
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
      ]);
      component.selectedTestCaseExecutions.set([testCaseExecution1]);

      expect(component.initialAnalysisObjectsSelectionState()).toEqual(
        initialLinks
      );
      expect(
        analysisObjectSelectionStateService.getInitiallyLinkedAnalysisObjectsSelectionState
      ).toHaveBeenCalled();
    });

    it("should call the analysisObjectSelectionStateService with empty analysis object links if no analysis objects are linked to the selected executions", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      stateService.analysisObjectLinks.set([]);
      component.selectedTestCaseExecutions.set([testCaseExecution1]);

      component.initialAnalysisObjectsSelectionState();

      expect(
        analysisObjectSelectionStateService.getInitiallyLinkedAnalysisObjectsSelectionState
      ).toHaveBeenCalledWith([], [testCaseExecution1], false);
    });

    it("should call the analysisObjectSelectionStateService with empty selected test cases list if no test cases are selected", () => {
      const stateServiceLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
      ];
      const initialLinks = [
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ];
      stateService.analysisObjectLinks.set(stateServiceLinks);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getInitiallyLinkedAnalysisObjectsSelectionState"
        )
        .mockReturnValue(initialLinks);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getAnalysisObjectsLinkedToScenarioOrTestCaseExecution"
        )
        .mockReturnValue(stateServiceLinks);

      component.initialAnalysisObjectsSelectionState();

      expect(
        analysisObjectSelectionStateService.getInitiallyLinkedAnalysisObjectsSelectionState
      ).toHaveBeenCalledWith(
        [getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)],
        [],
        false
      );
    });

    it("should call the analysisObjectSelectionStateService with scenario execution checked as true when checked", () => {
      const stateServiceLinks = [
        getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
      ];
      const initialLinks = [
        getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
      ];
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getInitiallyLinkedAnalysisObjectsSelectionState"
        )
        .mockReturnValue(initialLinks);
      jest
        .spyOn(
          analysisObjectSelectionStateService,
          "getAnalysisObjectsLinkedToScenarioOrTestCaseExecution"
        )
        .mockReturnValue(stateServiceLinks);
      component.selectedTestCaseExecutions.set([testCaseExecution1]);
      component.isScenarioExecutionChecked.set(true);

      component.initialAnalysisObjectsSelectionState();

      expect(
        analysisObjectSelectionStateService.getInitiallyLinkedAnalysisObjectsSelectionState
      ).toHaveBeenCalledWith(
        [getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT)],
        [testCaseExecution1],
        true
      );
    });
  });

  describe("initialDetectionSelectionState", () => {
    it("should return an empty list if the set analysis object type is an incident but there are no initial links", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      jest
        .spyOn(component, "initialAnalysisObjectsSelectionState")
        .mockReturnValue([]);
      expect(component.initialAnalysisObjectsSelectionState()).toEqual([]);
    });
  });

  describe("navigating to next step", () => {
    it("next button should be enabled if test cases are selected", () => {
      component.selectedTestCaseExecutions.set([testCaseExecution1]);
      fixture.detectChanges();
      expect(
        getButtonHarness("proceed-to-linking-button").isDisabled()
      ).toBeFalsy();
    });

    it("next button should be enabled if scenario execution is checked", () => {
      component.isScenarioExecutionChecked.set(true);
      fixture.detectChanges();
      expect(
        getButtonHarness("proceed-to-linking-button").isDisabled()
      ).toBeFalsy();
    });

    it("next button should be disabled if no test cases are selected and scenario is not checked", () => {
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(false);
      fixture.detectChanges();
      expect(
        getButtonHarness("proceed-to-linking-button").isDisabled()
      ).toBeTruthy();
    });

    it.each([
      [AnalysisObjectType.BINARY_IMPACT, LinkBinaryImpactModalContentComponent],
      [
        AnalysisObjectType.BINARY_REGRESSION,
        LinkBinaryRegressionModalContentComponent,
      ],
      [
        AnalysisObjectType.CONFIGURATION_REGRESSION,
        LinkConfigurationRegressionModalContentComponent,
      ],
      [
        AnalysisObjectType.CONFIGURATION_IMPACT,
        LinkConfigurationImpactModalContentComponent,
      ],
    ])(
      "should display the analysis objects linking content if the analysis object type matches the component",
      (
        analysisObjectType: AnalysisObjectType,
        analysisObjectComponent: Type<unknown>
      ) => {
        component.analysisObjectType = analysisObjectType;
        fixture.detectChanges();
        navigateToNextStep();
        expect(getComponent(analysisObjectComponent)).toBeTruthy();
      }
    );

    it.each([
      [AnalysisObjectType.BINARY_IMPACT, LinkBinaryImpactModalContentComponent],
      [
        AnalysisObjectType.BINARY_REGRESSION,
        LinkBinaryRegressionModalContentComponent,
      ],
      [
        AnalysisObjectType.CONFIGURATION_REGRESSION,
        LinkConfigurationRegressionModalContentComponent,
      ],
      [
        AnalysisObjectType.CONFIGURATION_IMPACT,
        LinkConfigurationImpactModalContentComponent,
      ],
    ])(
      "should not display the analysis object linking content if the analysis object type used doesnt match",
      (
        analysisObjectType: AnalysisObjectType,
        analysisObjectComponent: Type<unknown>
      ) => {
        const allOtherAnalysisObjectTypes = Object.values(
          AnalysisObjectType
        ).filter((type) => type !== analysisObjectType);
        allOtherAnalysisObjectTypes.forEach((otherType) => {
          component.analysisObjectType = otherType;
          fixture.detectChanges();
          navigateToNextStep();
          expect(
            DomTestUtils.getElementByType(
              fixture,
              analysisObjectComponent
            ).isRendered()
          ).toBeFalsy();
        });
      }
    );
  });

  describe("hideModal", () => {
    it("should set isLinking to false", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.hideModal();
      expect(linkingStateService.setIsLinking).toHaveBeenCalledWith(false);
    });

    it("should not reset the scenario execution selection when a user is creating", () => {
      linkingStateService.isCreating.set(true);
      component.isScenarioExecutionChecked.set(true);
      component.hideModal();
      expect(component.isScenarioExecutionChecked()).toBeTruthy();
    });

    it("should not reset the selected test case executions when a user is creating", () => {
      linkingStateService.isCreating.set(true);
      component.selectedTestCaseExecutions.set([testCaseExecution1]);
      component.hideModal();
      expect(component.selectedTestCaseExecutions()).toEqual([
        testCaseExecution1,
      ]);
    });

    it("should reset the scenario execution selection when the modal is closed and user is not creating", () => {
      linkingStateService.isCreating.set(false);
      component.isScenarioExecutionChecked.set(true);
      component.hideModal();
      expect(component.isScenarioExecutionChecked()).toBeFalsy();
    });

    it("should reset the selected test case executions when the modal is closed and user is not creating", () => {
      linkingStateService.isCreating.set(false);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.hideModal();
      expect(component.selectedTestCaseExecutions()).toEqual([]);
    });

    it("should reset the modal to the first step upon hiding the modal if the test case selection is not disabled", () => {
      linkingStateService.isCreating.set(false);
      component.stepperPanelValue.set(2);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.hideModal();
      expect(component.stepperPanelValue()).toEqual(1);
    });

    it("should not reset the modal to the first step upon hiding the modal if the test case selection is disabled", () => {
      linkingStateService.isCreating.set(false);
      component.stepperPanelValue.set(2);
      stateService.analyzableTestCaseExecutions.set([]);
      stateService.currentlyViewedTestExecutionId.set("some-test-exec-id");
      component.hideModal();
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(component.stepperPanelValue()).toEqual(2);
    });

    it("should be called when the cancel button is clicked", () => {
      const handlerSpy = jest.spyOn(component, "hideModal");
      getComponent(Dialog).onHide.emit();
      fixture.detectChanges();
      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("onAnalysisObjectSelectionChange", () => {
    it("should update the selected analysis objects", () => {
      component.onAnalysisObjectSelectionChange([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      expect(component.currentAnalysisObjectsSelectionState()).toEqual([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
    });

    it.each([
      [
        AnalysisObjectType.BINARY_IMPACT,
        LinkBinaryImpactModalContentComponent,
        "selectedBinaryImpactsChange",
      ],
      [
        AnalysisObjectType.CONFIGURATION_REGRESSION,
        LinkConfigurationRegressionModalContentComponent,
        "selectedConfigurationRegressionsChange",
      ],
      [
        AnalysisObjectType.INCIDENT,
        LinkIncidentsModalContentComponent,
        "selectedIncidentsChange",
      ],
      [
        AnalysisObjectType.CONFIGURATION_IMPACT,
        LinkConfigurationImpactModalContentComponent,
        "selectedConfigurationImpactsChange",
      ],
      [
        AnalysisObjectType.BINARY_REGRESSION,
        LinkBinaryRegressionModalContentComponent,
        "selectedBinaryRegressionsChange",
      ],
    ])(
      "should be called when the selected analysis objects change",
      (
        analysisObjectType: AnalysisObjectType,
        analysisObjectComponent: Type<unknown>,
        analysisObjectChangeEmitter: string
      ) => {
        component.analysisObjectType = analysisObjectType;
        fixture.detectChanges();
        navigateToNextStep();
        const handlerSpy = jest.spyOn(
          component,
          "onAnalysisObjectSelectionChange"
        );
        const componentInstance = getComponent(
          analysisObjectComponent
        ) as HasEmitters;
        const newSelection = [
          getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
          getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
        ];
        componentInstance[analysisObjectChangeEmitter].emit(newSelection);
        expect(handlerSpy).toHaveBeenCalledWith(newSelection);
      }
    );

    type EmitterLike<T> = {
      emit: (value: T) => void;
    };

    type HasEmitters = Record<
      string,
      EmitterLike<Array<ReturnType<typeof getFullySelectedAnalysisObject>>>
    >;
  });

  describe("createAnalysisObjectLink", () => {
    it("should call the request generator with the correct updateRequestGeneratorInput if the scenario execution is checked", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.isScenarioExecutionChecked.set(true);
      const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
          isScenarioExecutionSelected: true,
        };
      component.createAnalysisObjectLink(analysisObjectId1);
      expect(updateLinksRequestGenerator.getLinksToAdd).toHaveBeenCalledWith(
        [analysisObjectId1],
        updateRequestGeneratorInput
      );
    });

    it("should call the request generator with the correct updateRequestGeneratorInput if test cases are selected", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
          testCaseExecutions: [testCaseExecution1, testCaseExecution2],
        };
      component.createAnalysisObjectLink(analysisObjectId1);
      expect(updateLinksRequestGenerator.getLinksToAdd).toHaveBeenCalledWith(
        [analysisObjectId1],
        updateRequestGeneratorInput
      );
    });

    it("should call the request generator with the correct updateRequestGeneratorInput if the scenario and test cases are selected", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.isScenarioExecutionChecked.set(true);
      const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
        {
          ...updateLinksRequestGeneratorDefaultInput,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
          testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          isScenarioExecutionSelected: true,
        };
      component.createAnalysisObjectLink(analysisObjectId1);
      expect(updateLinksRequestGenerator.getLinksToAdd).toHaveBeenCalledWith(
        [analysisObjectId1],
        updateRequestGeneratorInput
      );
    });

    it("should call the update links with the generated request", () => {
      jest
        .spyOn(updateLinksRequestGenerator, "getLinksToAdd")
        .mockReturnValue([
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ]);
      component.createAnalysisObjectLink(analysisObjectId1);
      expect(stateService.updateAnalysisObjectsLinks).toHaveBeenCalledWith({
        linksToAdd: [
          getAnalysisObjectLinkWithEmptyTestCaseExecution(
            AnalysisObjectType.BINARY_IMPACT
          ),
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ],
        linksToRemove: [],
      });
    });

    it("should return emit null after creating the link", (done) => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component
        .createAnalysisObjectLink(analysisObjectId1)
        .subscribe((result) => {
          expect(result).toBeNull();
          done();
        });
    });

    it("should emit an analysis object links changed event after creating the link", (done) => {
      const emitSpy = jest.spyOn(component.analysisObjectLinksChanged, "emit");
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.createAnalysisObjectLink(analysisObjectId1).subscribe(() => {
        expect(emitSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe("createCandidateAnalysisObjectLinks", () => {
    it("should create a candidate link with the correct projectId, scenarioExecutionId, and request", () => {
      const request: CreateCandidateAnalysisObjectLinksRequest = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        candidateLinks: [
          {
            testCaseExecutionId: testCaseExecutionId1,
          },
        ],
      };
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([testCaseExecution1]);

      component.createCandidateAnalysisObjectLinks();

      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId, request);
    });

    it("should create a candidate link with the correct parameters when multiple test cases are selected", () => {
      const request: CreateCandidateAnalysisObjectLinksRequest = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        candidateLinks: [
          { testCaseExecutionId: testCaseExecutionId1 },
          { testCaseExecutionId: testCaseExecutionId3 },
        ],
      };
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution3,
      ]);

      component.createCandidateAnalysisObjectLinks();

      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId, request);
    });

    it("should create a candidate link with an undefined test case execution id if no TCs are selected but the scenario execution is selected", () => {
      const request: CreateCandidateAnalysisObjectLinksRequest = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        candidateLinks: [
          {
            testCaseExecutionId: undefined,
          },
        ],
      };
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(true);

      component.createCandidateAnalysisObjectLinks();

      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId, request);
    });

    it("should not create a candidate link if no test cases are selected and scenario execution is not checked", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(false);
      component.createCandidateAnalysisObjectLinks();
      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).not.toHaveBeenCalled();
    });

    it("should return undefined when no candidate link is created", (done) => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([]);
      component.isScenarioExecutionChecked.set(false);
      component.createCandidateAnalysisObjectLinks().subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it("should request candidate links with the selected TC ids and one undefined TC id if TCs and the scenario executions are selected", () => {
      const request: CreateCandidateAnalysisObjectLinksRequest = {
        analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        candidateLinks: [
          { testCaseExecutionId: testCaseExecutionId1 },
          { testCaseExecutionId: testCaseExecutionId3 },
          { testCaseExecutionId: undefined },
        ],
      };
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution3,
      ]);
      component.isScenarioExecutionChecked.set(true);

      component.createCandidateAnalysisObjectLinks();
      expect(
        analysisObjectLinksService.createCandidateAnalysisObjectLinks
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId, request);
    });

    it("should return the created candidate links id", (done) => {
      const candidateLinkId = "candidate-link-id";
      jest
        .spyOn(analysisObjectLinksService, "createCandidateAnalysisObjectLinks")
        .mockReturnValue(of({ id: candidateLinkId }));
      component.isScenarioExecutionChecked.set(true);
      component.createCandidateAnalysisObjectLinks().subscribe((id) => {
        expect(id).toEqual(candidateLinkId);
        done();
      });
    });

    it("should be passed to the incident linking component if the analysis object type is INCIDENT", () => {
      component.analysisObjectType = AnalysisObjectType.INCIDENT;
      fixture.detectChanges();
      navigateToNextStep();
      expect(
        getComponent(LinkIncidentsModalContentComponent).createIncidentLink
      ).toBeTruthy();
    });
  });

  describe("updateLinks", () => {
    describe("generating updateLinksRequest", () => {
      it("should call request generator with the correct projectId in updateRequestGeneratorInput", () => {
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            projectId: projectId,
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with the correct scenario execution id in updateRequestGeneratorInput", () => {
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            scenarioExecutionId: scenarioExecutionId,
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with the correct analysis object type in updateRequestGeneratorInput", () => {
        component.analysisObjectType = AnalysisObjectType.BINARY_REGRESSION;
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with the currently selected analysis objects in updateRequestGeneratorInput", () => {
        component.currentAnalysisObjectsSelectionState.set([
          getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
        ]);
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            currentAnalysisObjectsSelectionState: [
              getFullySelectedAnalysisObject(ANALYSIS_OBJECT_1),
            ],
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with the initially selected analysis objects in updateRequestGeneratorInput", () => {
        const analysisObjectLinks = [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ];
        stateService.analysisObjectLinks.set(analysisObjectLinks);
        jest
          .spyOn(
            analysisObjectSelectionStateService,
            "getInitiallyLinkedAnalysisObjectsSelectionState"
          )
          .mockReturnValue([
            getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
          ]);
        jest
          .spyOn(
            analysisObjectSelectionStateService,
            "getAnalysisObjectsLinkedToScenarioOrTestCaseExecution"
          )
          .mockReturnValue(analysisObjectLinks);

        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            initialAnalysisObjectLinks: analysisObjectLinks,
            initiallyLinkedAnalysisObjectsState: [
              getInitiallyFullyLinkedAnalysisObject(analysisObjectId1),
            ],
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with all analysis object linked to the selection in updateRequestGeneratorInput", () => {
        const analysisObjectLinks = [
          getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
        ];
        stateService.analysisObjectLinks.set(analysisObjectLinks);
        jest
          .spyOn(
            analysisObjectSelectionStateService,
            "getAnalysisObjectsLinkedToScenarioOrTestCaseExecution"
          )
          .mockReturnValue(analysisObjectLinks);

        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            initialAnalysisObjectLinks: [
              getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
            ],
          };
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with correct updateRequestGeneratorInput if scenario execution is checked", () => {
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            isScenarioExecutionSelected: true,
          };
        component.isScenarioExecutionChecked.set(true);
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with correct updateRequestGeneratorInput if test cases are selected", () => {
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          };
        component.selectedTestCaseExecutions.set([
          testCaseExecution1,
          testCaseExecution2,
        ]);
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should call request generator with correct updateRequestGeneratorInput if scenario execution is checked and test cases are selected", () => {
        const updateRequestGeneratorInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
          {
            ...updateLinksRequestGeneratorDefaultInput,
            isScenarioExecutionSelected: true,
            testCaseExecutions: [testCaseExecution1, testCaseExecution2],
          };
        component.isScenarioExecutionChecked.set(true);
        component.selectedTestCaseExecutions.set([
          testCaseExecution1,
          testCaseExecution2,
        ]);
        component.updateLinks();
        expect(
          updateLinksRequestGenerator.generateUpdateAnalysisObjectLinkRequest
        ).toHaveBeenCalledWith(updateRequestGeneratorInput);
      });

      it("should update the links with the generated request", () => {
        const updateRequest = {
          linksToAdd: [
            getAnalysisObjectLink1(AnalysisObjectType.BINARY_IMPACT),
          ],
          linksToRemove: [
            getAnalysisObjectLink3(AnalysisObjectType.BINARY_IMPACT),
          ],
        };
        jest
          .spyOn(
            updateLinksRequestGenerator,
            "generateUpdateAnalysisObjectLinkRequest"
          )
          .mockReturnValue(updateRequest);
        component.updateLinks();
        expect(stateService.updateAnalysisObjectsLinks).toHaveBeenCalledWith(
          updateRequest
        );
      });
    });

    it("should set modal visibility to false on successfully updating the links", () => {
      component.isModalVisible.set(true);
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(component.isModalVisible()).toBeFalsy();
    });

    it("should set submit button loading to true while updating the links", fakeAsync(() => {
      jest
        .spyOn(stateService, "updateAnalysisObjectsLinks")
        .mockReturnValue(of(undefined).pipe(delay(3000)));
      component.updateLinks();
      tick(0);
      expect(component.isSubmitButtonLoading).toBeTruthy();
    }));

    it("should set submit button loading to false on succesfully updating the links", () => {
      component.isSubmitButtonLoading = true;
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(component.isSubmitButtonLoading).toBeFalsy();
    });

    it("should emit a links changed event on successful update", () => {
      const linksChangedEventMock = jest.spyOn(
        component.analysisObjectLinksChanged,
        "emit"
      );
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(linksChangedEventMock).toHaveBeenCalled();
    });

    it("should display success message containing analysis object type", () => {
      component.analysisObjectType = AnalysisObjectType.BINARY_IMPACT;
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(analysisObjectTypeDisplayPipe.transform).toHaveBeenCalledWith(
        component.analysisObjectType
      );
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        `${ANALYSIS_OBJECT_TYPE_DISPLAY} links were updated successfully`
      );
    });

    it("should display error message on failure to update the links", () => {
      jest
        .spyOn(stateService, "updateAnalysisObjectsLinks")
        .mockReturnValue(throwError(() => "ERROR"));
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(toastMessageService.showError).toHaveBeenCalledWith("ERROR");
    });

    it("should be called when the submit button is clicked", () => {
      navigateToNextStep();
      const handlerSpy = jest.spyOn(component, "updateLinks");
      getButtonHarness("submit-button").click();
      expect(handlerSpy).toHaveBeenCalled();
    });

    it("should set submit button loading to false on failure to update the links", () => {
      jest
        .spyOn(stateService, "updateAnalysisObjectsLinks")
        .mockReturnValue(throwError(() => "ERROR"));
      component.isSubmitButtonLoading = true;
      component.currentAnalysisObjectsSelectionState.set([
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_1),
        getFullySelectedAnalysisObject(LITE_BINARY_IMPACT_2),
      ]);
      component.selectedTestCaseExecutions.set([
        testCaseExecution1,
        testCaseExecution2,
      ]);
      component.updateLinks();
      expect(component.isSubmitButtonLoading).toBeFalsy();
    });

    it("should emit analysisObjectLinksChanged before hiding the modal", () => {
      const emitSpy = jest.spyOn(component.analysisObjectLinksChanged, "emit");
      const modalVisibleSpy = jest.spyOn(component.isModalVisible, "set");
      component.updateLinks();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalled();
      expect(modalVisibleSpy).toHaveBeenCalled();
      const emitCallIndex = emitSpy.mock.invocationCallOrder[0];
      const modalCallIndex = modalVisibleSpy.mock.invocationCallOrder[0];
      expect(emitCallIndex).toBeLessThan(modalCallIndex);
    });
  });

  it("submit btn should be disabled if analysis objects links are not changed when not linking failure reasons", () => {
    analysisObjectLinksChangedPipeTransform.mockReturnValue(false);
    fixture = MockRender(AnalysisObjectLinkingComponent, params);
    component = fixture.point.componentInstance;
    component.isModalVisible.set(true);
    fixture.detectChanges();
    navigateToNextStep();
    expect(getButtonHarness("submit-button").isDisabled()).toBeTruthy();
  });

  it("submit btn should not be disabled if the selected analysis objects changed", () => {
    analysisObjectLinksChangedPipeTransform.mockReturnValue(true);
    fixture = MockRender(AnalysisObjectLinkingComponent, params);
    component = fixture.point.componentInstance;
    component.isModalVisible.set(true);
    fixture.detectChanges();
    navigateToNextStep();

    expect(getButtonHarness("submit-button").isDisabled()).toBeFalsy();
  });

  it("submit btn should not be disabled if at least one failure reason is selected", () => {
    jest.spyOn(stateService, "analysisObjectLinks").mockReturnValue([
      {
        projectId: "string",
        scenarioExecutionId: "string",
        testCaseExecutionId: "string",
        analysisObjectId: "string",
        analysisObjectType: "FAILURE_REASON",
      } as AnalysisObjectLink,
    ]);
    analysisObjectLinksChangedPipeTransform.mockReturnValue(false);
    fixture = MockRender(AnalysisObjectLinkingComponent, params);
    component = fixture.point.componentInstance;
    component.isModalVisible.set(true);
    fixture.detectChanges();
    navigateToNextStep();

    expect(getButtonHarness("submit-button").isDisabled()).toBeTruthy();
  });

  describe("disableTestCaseSelection", () => {
    it("should return false if there are test cases", () => {
      expect(component.testCaseExecutions().length).toBe(3);
      expect(component.disableTestCaseSelection()).toBeFalsy();
    });

    it("should disable test case selection when linking to failure reasons", () => {
      component.analysisObjectType = AnalysisObjectType.FAILURE_REASON;
      expect(component.disableTestCaseSelection()).toBeTruthy();
    });

    it("should return true if there are no test cases", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      expect(component.testCaseExecutions().length).toBe(0);
      expect(component.disableTestCaseSelection()).toBeTruthy();
    });

    it("should set the stepper panel value to 1 if false", () => {
      fixture.detectChanges();
      expect(component.disableTestCaseSelection()).toBeFalsy();
      expect(component.stepperPanelValue()).toBe(1);
    });

    it("should set the stepper panel value to 2 if true", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      fixture.detectChanges();
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(component.stepperPanelValue()).toBe(2);
    });

    it("should hide the test case selection step if true", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      fixture.detectChanges();
      const testCaseSelectionStepPanel = fixture.debugElement.query(
        By.css("[data-testid=test-case-selection-step-panel]")
      );
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(testCaseSelectionStepPanel).toBeFalsy();
    });

    it("should show the test case selection step if false", () => {
      fixture.detectChanges();
      const testCaseSelectionStepPanel = fixture.debugElement.query(
        By.css("[data-testid=test-case-selection-step-panel]")
      );
      expect(component.disableTestCaseSelection()).toBeFalsy();
      expect(testCaseSelectionStepPanel).toBeTruthy();
    });

    it("should set the scenario execution as selected if true", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      fixture.detectChanges();
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(component.isScenarioExecutionChecked()).toBeTruthy();
    });

    it("should not set the scenario execution as selected if false", () => {
      fixture.detectChanges();
      expect(component.disableTestCaseSelection()).toBeFalsy();
      expect(component.isScenarioExecutionChecked()).toBeFalsy();
    });

    it("should set the stepper's initial step test case selection step if enabled", () => {
      expect(component.disableTestCaseSelection()).toBeFalsy();
      expect(getComponent(Stepper).value()).toBe(1);
    });

    it("should set the stepper's initial step analysis object selection step if test case selection is disabled", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(getComponent(Stepper).value()).toBe(2);
    });

    it("should hide the back button of the analysis object selection step if test case selection is disabled", () => {
      stateService.analyzableTestCaseExecutions.set([]);
      navigateToNextStep();
      fixture.detectChanges();
      const backButton = fixture.debugElement.query(
        By.css("[data-testid=back-button]")
      );
      expect(component.disableTestCaseSelection()).toBeTruthy();
      expect(backButton.properties["hidden"]).toBe(true);
    });

    it("should not disabled test case selection when currentlyViewedTestExecutionId is undefined", () => {
      expect(stateService.currentlyViewedTestExecutionId()).toBeUndefined();
      expect(component.testCaseExecutions().length).toBe(3);
      expect(component.disableTestCaseSelection()).toBeFalsy();
    });

    it("should disable test case selection when currentlyViewedTestExecutionId is set but no test cases match", () => {
      stateService.currentlyViewedTestExecutionId.set("non-matching-id");
      expect(component.disableTestCaseSelection()).toBeTruthy();
    });

    it("should not disable test case selection when currentlyViewedTestExecutionId is set and test cases match", () => {
      stateService.currentlyViewedTestExecutionId.set(
        testCaseExecution1.testExecutionId
      );
      expect(component.disableTestCaseSelection()).toBeFalsy();
    });

    it("should not disable test case selection when currentlyViewedTestExecutionId is set but is null", () => {
      stateService.currentlyViewedTestExecutionId.set(null);
      expect(component.testCaseExecutions().length).toBe(3);
      expect(component.disableTestCaseSelection()).toBeFalsy();
    });
  });

  function navigateToNextStep() {
    getComponent(Stepper).value.set(2);
    fixture.detectChanges();
  }

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
