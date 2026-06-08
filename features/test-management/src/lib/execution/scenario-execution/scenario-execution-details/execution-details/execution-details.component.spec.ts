import {
  Confirmation,
  ConfirmationService,
  MenuItem,
  MenuItemCommandEvent,
} from "primeng/api";
import { ExecutionDetailsComponent } from "./execution-details.component";
import { ScenarioAnalysisStatus } from "./../../scenario-analysis-status/scenario-analysis-status";
import {
  AnalysisStatusUpdateIneligibilityReason,
  AnalysisStatusUpdateIneligibilityReasonDisplayMessage,
} from "../../scenario-analysis-status/analysis-status-eligibility";
import { ScenarioExecutionService } from "../../scenario-execution.service";
import { ScenarioExecutionStatus } from "../../scenario-execution-status/scenario-execution-status";

import { Menu } from "primeng/menu";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  MockComponent,
  MockDirective,
  MockPipe,
  MockPipes,
  ngMocks,
} from "ng-mocks";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  NO_ERRORS_SCHEMA,
  signal,
  Type,
} from "@angular/core";

@Component({
  selector: "p-menu",
  template: "",
  standalone: true,
})
class MockMenuComponent {
  @Input() model: MenuItem[] | undefined;
  @Input() popup: boolean = false;
  @Input() appendTo: HTMLElement | "body" | undefined;
  visible = false;
  toggle = jest.fn();
}
import { CommitIdShortnerPipe, DurationPipe } from "@mxflow/pipe";
import { of, throwError } from "rxjs";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { By } from "@angular/platform-browser";
import { KeptExecutionDisabledPipe } from "../kept-execution-disabled/kept-execution-disabled.pipe";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import {
  projectId,
  scenarioExecution,
  scenarioExecutionId,
} from "../../scenario-execution-test-utils";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { ScenarioExecution } from "../../scenario-execution";
import { ValidationScope } from "@mxflow/features/validation-management";
import { AnalysisObjectLinkingComponent } from "../../../analysis-object-link/analysis-object-linking/analysis-object-linking.component";
import {
  AnalysisObjectType,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { AnalysisObjectLink, TestUnitModel } from "@mxflow/test-management";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";
import { DomTestUtils } from "@mxevolve/testing";
import { DisableAbortPipe } from "../../actions/abort/disable-abort.pipe";
import { Button } from "primeng/button";
import { ShowCommentPipe } from "./comment-input/show-comment-pipe";
import { ShowTerminationMessagePipe } from "./termination-message/show-termination-message-pipe";
import { ButtonHarness } from "../../../../../../../../core/testing/src/lib/dom-test-utils/button/button-harness";

const comment = "user comment on scenario execution";
const newComment = "new user comment on scenario execution";
const abortRequestedMessage = "abort requested message";
const TEST_UNIT = {
  id: "testUnitId",
  disableKeepExecution: true,
} as TestUnitModel;

describe("Scenario execution details component test", () => {
  let scenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let confirmationService: jest.Mocked<ConfirmationService>;
  let analyticsTrackerService: jest.Mocked<TestManagementAnalyticsTrackerService>;
  let stateService: any;
  let incidentLinkingStateService: any;
  let fixture: ComponentFixture<ExecutionDetailsComponent>;
  let component: ExecutionDetailsComponent;

  const keptExecutionDisabledPipeTransform = jest.fn().mockReturnValue(false);
  const disableAbortPipeTransform = jest.fn();
  const showTerminationMessagePipeTransform = jest.fn();

  beforeEach(() => {
    analyticsTrackerService = {
      trackValidationScope: jest.fn(),
    } as unknown as jest.Mocked<TestManagementAnalyticsTrackerService>;
    scenarioExecutionService = {
      getScenarioExecutions: jest.fn(),
      abortScenarioExecution: jest.fn(() => of(abortRequestedMessage)),
    } as unknown as jest.Mocked<ScenarioExecutionService>;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as jest.Mocked<ConfirmationService>;

    stateService = {
      projectId: signal(projectId),
      scenarioExecution: signal<ScenarioExecution | undefined>(
        scenarioExecution
      ),
      validationScope: signal<ValidationScope | undefined>(undefined),
      validationScopeWarningMessage: signal(""),
      testUnit: signal<TestUnitModel | undefined>(TEST_UNIT),
      analysisObjectLinks: signal<AnalysisObjectLink[]>([]),
      getScenarioExecutionAnalysisObjectLinks$: jest.fn(() => of(undefined)),
      refreshAnalysisObjectLinks$: jest.fn(() => of(undefined)),
      refreshSelectedScenarioExecution$: jest.fn(() => of(undefined)),
      setLoading: jest.fn(),
    };

    incidentLinkingStateService = {
      setIsLinking: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [
        ToggleSwitchModule,
        Button,
        MockDirective(ShowElementIfAuthorizedDirective),
        MockPipe(KeptExecutionDisabledPipe, keptExecutionDisabledPipeTransform),
        MockPipe(DisableAbortPipe, disableAbortPipeTransform),
        MockPipe(
          ShowTerminationMessagePipe,
          showTerminationMessagePipeTransform
        ),
        MockComponent(AnalysisObjectLinkingComponent),
        MockMenuComponent,
      ],
      declarations: [
        ExecutionDetailsComponent,
        MockPipes(ShowCommentPipe, DurationPipe, CommitIdShortnerPipe),
      ],
      providers: [
        {
          provide: ScenarioExecutionService,
          useValue: scenarioExecutionService,
        },
        { provide: ConfirmationService, useValue: confirmationService },
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
        {
          provide: IncidentLinkingStateService,
          useValue: incidentLinkingStateService,
        },
        {
          provide: TestManagementAnalyticsTrackerService,
          useValue: analyticsTrackerService,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutionDetailsComponent);
    component = fixture.componentInstance;
    component.incidentEnabled = true;
    component.validationScopeEnabled = true;
    renderShowIfAuthorizedDirectives();
  });

  it("should default the analysis object type to undefined", () => {
    expect(component.analysisObjectType).toEqual(undefined);
  });

  describe("Authorization", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should add the authorization directive with the correct inputs to the analysis status", () => {
      const analysisStatusView = fixture.debugElement.query(
        By.css("#analysis-status")
      );
      expect(analysisStatusView).toBeTruthy();
      const authorizationDirective = ngMocks.findInstance(
        analysisStatusView,
        ShowElementIfAuthorizedDirective
      );
      ngMocks.render(authorizationDirective, authorizationDirective);
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "read_analysis_status",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });

    it("should add the authorization directive with the correct inputs to the set analysis status button", () => {
      const setAnalysisStatusButton = fixture.debugElement.query(
        By.css("#set-analysis-status-button")
      );
      expect(setAnalysisStatusButton).toBeTruthy();
      const authorizationDirective = ngMocks.findInstance(
        setAnalysisStatusButton,
        ShowElementIfAuthorizedDirective
      );
      ngMocks.render(authorizationDirective, authorizationDirective);
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "update_analysis_status",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });

    it("should add the authorization directive with the correct inputs to the link to detection", () => {
      const detectionButton = fixture.debugElement.query(
        By.css("#link-to-regression")
      );
      expect(detectionButton).toBeTruthy();

      const authorizationDirective = ngMocks.findInstance(
        detectionButton,
        ShowElementIfAuthorizedDirective
      );
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("should add the authorization directive with the correct inputs to the link to impact", () => {
      const impactButton = fixture.debugElement.query(
        By.css("#link-to-impact")
      );
      expect(impactButton).toBeTruthy();

      const authorizationDirective = ngMocks.findInstance(
        impactButton,
        ShowElementIfAuthorizedDirective
      );
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("should add the authorization directive with the correct inputs to the link to incident", () => {
      const incidentButton = DomTestUtils.getElementByTestId(
        fixture,
        "link-to-incident"
      ).getDebugElement();
      expect(incidentButton).toBeTruthy();

      const authorizationDirective = ngMocks.findInstance(
        incidentButton,
        ShowElementIfAuthorizedDirective
      );
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("should add the authorization directive with the correct inputs to the view validation scope button", () => {
      component.validationScopeEnabled = true;
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
      const viewValidationScopeButton = fixture.debugElement.query(
        By.css("#viewValidationScopeButton")
      );
      expect(viewValidationScopeButton).toBeTruthy();

      const authorizationDirective = ngMocks.findInstance(
        viewValidationScopeButton,
        ShowElementIfAuthorizedDirective
      );
      ngMocks.render(authorizationDirective, authorizationDirective);
      expect(authorizationDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "validation_scope",
      });
    });
  });

  describe("validationScopeEnabled", () => {
    it("should show validation scope button when validationScopeEnabled is true", () => {
      component.validationScopeEnabled = true;
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
      const viewValidationScopeButton = DomTestUtils.getElementByTestId(
        fixture,
        "viewValidationScopeButton"
      );
      expect(viewValidationScopeButton.isRendered()).toBeTruthy();
    });

    it("should hide validation scope button when validationScopeEnabled is false", () => {
      component.validationScopeEnabled = false;
      fixture.detectChanges();
      renderShowIfAuthorizedDirectives();
      fixture.detectChanges();
      const viewValidationScopeButton = DomTestUtils.getElementByTestId(
        fixture,
        "viewValidationScopeButton"
      );
      expect(viewValidationScopeButton.isRendered()).toBeFalsy();
    });
  });

  describe("incidentEnabled", () => {
    it("should enable link to incident button when incidentEnabled is true", () => {
      component.incidentEnabled = true;
      component.isLoading = false;
      fixture.detectChanges();
      const incidentButton = DomTestUtils.getButtonByTestId(
        fixture,
        "link-to-incident"
      );
      expect(incidentButton.isDisabled()).toBeFalsy();
    });

    it("should disable link to incident button when incidentEnabled is false", () => {
      component.incidentEnabled = false;
      component.isLoading = false;
      fixture.detectChanges();
      const incidentButton = DomTestUtils.getButtonByTestId(
        fixture,
        "link-to-incident"
      );
      expect(incidentButton.isDisabled()).toBeTruthy();
    });
  });

  describe("ngOnInit", () => {
    it("should initialize regression and impact options correctly", () => {
      const showAnalysisObjectsLinkingModalSpy = jest.spyOn(
        fixture.componentInstance,
        "showAnalysisObjectsLinkingModal"
      );

      component.ngOnInit();

      expect(component.linkToRegressionOptions).toEqual([
        { label: "Configuration Regression", command: expect.any(Function) },
        { label: "Binary Regression", command: expect.any(Function) },
      ]);

      expect(component.linkToImpactOptions).toEqual([
        { label: "Configuration Impact", command: expect.any(Function) },
        { label: "Binary Impact", command: expect.any(Function) },
      ]);

      const mockEvent = {} as MenuItemCommandEvent;

      if (component.linkToRegressionOptions) {
        component.linkToRegressionOptions[0].command?.(mockEvent);
        expect(showAnalysisObjectsLinkingModalSpy).toHaveBeenCalledWith(
          AnalysisObjectType.CONFIGURATION_REGRESSION
        );

        component.linkToRegressionOptions[1].command?.(mockEvent);
        expect(showAnalysisObjectsLinkingModalSpy).toHaveBeenCalledWith(
          AnalysisObjectType.BINARY_REGRESSION
        );
      }

      if (component.linkToImpactOptions) {
        component.linkToImpactOptions[0].command?.(mockEvent);
        expect(showAnalysisObjectsLinkingModalSpy).toHaveBeenCalledWith(
          AnalysisObjectType.CONFIGURATION_IMPACT
        );

        component.linkToImpactOptions[1].command?.(mockEvent);
        expect(showAnalysisObjectsLinkingModalSpy).toHaveBeenCalledWith(
          AnalysisObjectType.BINARY_IMPACT
        );
      }
    });

    it("should initialize view validation scope options", () => {
      component.ngOnInit();
      expect(component.viewValidationScopeOptions).toEqual([
        { label: "Defects", command: expect.any(Function) },
        { label: "Upgrade Impacts", command: expect.any(Function) },
      ]);
    });

    it("should set defectsVisible to true when defect option is toggled", () => {
      const mockEvent = {} as MenuItemCommandEvent;
      component.ngOnInit();
      component.viewValidationScopeOptions[0].command?.(mockEvent);
      expect(component.isDefectsModalVisible).toBeTruthy();
    });

    it("should set upgradeImpactsVisible to true when upgrade impacts option is toggled", () => {
      const mockEvent = {} as MenuItemCommandEvent;
      component.ngOnInit();
      component.viewValidationScopeOptions[1].command?.(mockEvent);
      expect(component.isUpradeImpactsModalVisible).toBeTruthy();
    });
  });

  describe("initializing analysis status options", () => {
    const mockEvent = {} as MenuItemCommandEvent;

    it("should initialize the analysisStatusMenuItems to empty array onInit", () => {
      component.ngOnInit();
      expect(component.analysisStatuMenuItems).toEqual([]);
    });

    it("should initialize to empty array if no next statuses are available", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(component.analysisStatuMenuItems).toEqual([]);
    });

    it("should set the label of the menu item to the analysis status name", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.PASSED,
            isEligible: true,
            ineligibilityReason: undefined,
          },
          {
            analysisStatus: ScenarioAnalysisStatus.FAILED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.label)
      ).toEqual([ScenarioAnalysisStatus.PASSED, ScenarioAnalysisStatus.FAILED]);
    });

    it("should disable the menu item if the analysis status is not eligible", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.PASSED,
            isEligible: true,
            ineligibilityReason: undefined,
          },
          {
            analysisStatus: ScenarioAnalysisStatus.FAILED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.disabled)
      ).toEqual([false, true]);
    });

    it("should set the tooltip of the menu item based on the update ineligibility reason", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.PASSED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_IMPACTS_LINKED,
          },
          {
            analysisStatus: ScenarioAnalysisStatus.FAILED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.tooltip)
      ).toEqual([
        AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
          AnalysisStatusUpdateIneligibilityReason.NO_IMPACTS_LINKED
        ],
        AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
          AnalysisStatusUpdateIneligibilityReason.NO_REGRESSIONS_LINKED
        ],
      ]);
    });

    it("should set no tooltip if the next analysis status is eligible", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.PASSED,
            isEligible: true,
            ineligibilityReason: undefined,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.tooltip)
      ).toEqual([undefined]);
    });

    it("should emit an analysis status updated event on selecting a status", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.PASSED,
            isEligible: true,
            ineligibilityReason: undefined,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      jest.spyOn(component.updateAnalysisStatusEvent, "emit");

      expect(component.analysisStatuMenuItems[0].command).toBeDefined();
      component.analysisStatuMenuItems[0].command?.(mockEvent);
      expect(component.updateAnalysisStatusEvent.emit).toHaveBeenCalledWith(
        ScenarioAnalysisStatus.PASSED
      );
    });

    it("should not disable the cancelled option if it is not eligible due to no failure reasons linked", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.CANCELLED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.disabled)
      ).toEqual([false]);
    });

    it("should disable the cancelled option if it is not eligible due to regressions linked", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.CANCELLED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.REGRESSIONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.disabled)
      ).toEqual([true]);
    });

    it("should not display a tooltip for the cancelled option if it is ineligible due to no failure reasons linked", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.CANCELLED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.tooltip)
      ).toEqual([undefined]);
    });
    it("should display a tooltip for the cancelled option if it is ineligible due to regressions linked", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.CANCELLED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.REGRESSIONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };
      expect(
        component.analysisStatuMenuItems.map((menuItem) => menuItem.tooltip)
      ).toEqual([
        AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
          AnalysisStatusUpdateIneligibilityReason.REGRESSIONS_LINKED
        ],
      ]);
    });

    it("should set the correct command for the cancelled option", () => {
      component.analysisStatusEligibility = {
        nextAnalysisStatuses: [
          {
            analysisStatus: ScenarioAnalysisStatus.CANCELLED,
            isEligible: false,
            ineligibilityReason:
              AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED,
          },
        ],
        isUpdateEligible: true,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      };

      jest.spyOn(component, "handleMarkAnalysisStatusAsCancelled");

      expect(component.analysisStatuMenuItems[0].command).toBeDefined();
      component.analysisStatuMenuItems[0].command?.(mockEvent);
      expect(component.handleMarkAnalysisStatusAsCancelled).toHaveBeenCalled();
    });

    it("should not open analysis status menu if update is not eligible", () => {
      const analysisStatusMenu = {
        toggle: jest.fn(),
        visible: false,
      } as unknown as Menu;
      const mouseEvent = {} as unknown as MouseEvent;
      const refreshAnalysisStatusEventEmitter = jest.spyOn(
        component.refreshAnalysisStatusEvent,
        "emit"
      );
      component.isAnalysisStatusUpdateEligible = false;
      fixture.detectChanges();
      component.openAnalysisStatusMenu(analysisStatusMenu, mouseEvent);
      expect(refreshAnalysisStatusEventEmitter).not.toHaveBeenCalled();
      expect(analysisStatusMenu.toggle).not.toHaveBeenCalled();
    });

    it("should not emit refresh analysis status menu if update is eligible but menu is visible", () => {
      const analysisStatusMenu = {
        toggle: jest.fn(),
        visible: true,
      } as unknown as Menu;
      const mouseEvent = {} as unknown as MouseEvent;
      const refreshAnalysisStatusEventEmitter = jest.spyOn(
        component.refreshAnalysisStatusEvent,
        "emit"
      );
      component.isAnalysisStatusUpdateEligible = true;
      fixture.detectChanges();
      component.openAnalysisStatusMenu(analysisStatusMenu, mouseEvent);
      expect(refreshAnalysisStatusEventEmitter).not.toHaveBeenCalled();
      expect(analysisStatusMenu.toggle).toHaveBeenCalledWith(mouseEvent);
    });
  });

  it("should emit refresh analysis status if update is eligible and menu is not visible", () => {
    const analysisStatusMenu = {
      toggle: jest.fn(),
      visible: false,
    } as unknown as Menu;
    const mouseEvent = {} as unknown as MouseEvent;
    const refreshAnalysisStatusEventEmitter = jest.spyOn(
      component.refreshAnalysisStatusEvent,
      "emit"
    );
    component.isAnalysisStatusUpdateEligible = true;
    component.openAnalysisStatusMenu(analysisStatusMenu, mouseEvent);
    expect(refreshAnalysisStatusEventEmitter).toHaveBeenCalled();
    expect(analysisStatusMenu.toggle).toHaveBeenCalledWith(mouseEvent);
  });

  describe("handleError", () => {
    it("should emit error message", () => {
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");
      component.handleError("error");
      expect(emitSpy).toHaveBeenCalledWith("error");
    });
  });

  it("should save the scenario execution comment correctly", () => {
    component.comment = comment;
    component.showCommentButtons = true;
    const saveCommentEventEmitterSpy = jest.spyOn(
      component.saveCommentEventEmitter,
      "emit"
    );
    component.saveComment();
    expect(component.showCommentButtons).toEqual(false);
    expect(saveCommentEventEmitterSpy).toHaveBeenCalledWith(comment);
  });

  it("should update the scenario execution comment correctly", () => {
    component.comment = comment;
    const updateCommentEventEmitterSpy = jest.spyOn(
      component.updateCommentEventEmitter,
      "emit"
    );
    component.updateComment(newComment);
    expect(updateCommentEventEmitterSpy).toHaveBeenCalledWith(newComment);
  });

  it("should cancel updating the scenario execution comment correctly", () => {
    component.comment = comment;
    component.showCommentButtons = true;
    const cancelCommentEventEmitterSpy = jest.spyOn(
      component.cancelCommentEventEmitter,
      "emit"
    );
    component.cancelComment();
    expect(component.showCommentButtons).toEqual(false);
    expect(cancelCommentEventEmitterSpy).toHaveBeenCalled();
  });

  it("should handle marking the analysis status as cancelled correctly", () => {
    const showAnalysisObjectsLinkingModalSpy = jest.spyOn(
      fixture.componentInstance,
      "showAnalysisObjectsLinkingModal"
    );
    component.handleMarkAnalysisStatusAsCancelled();
    expect(showAnalysisObjectsLinkingModalSpy).toHaveBeenCalledWith(
      AnalysisObjectType.FAILURE_REASON
    );
  });

  describe("getIneligibilityReasonMessage", () => {
    it("should return correct reason when scenario is underway", () => {
      expect(
        component.getIneligibilityReasonMessage(
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_UNDERWAY
        )
      ).toEqual(
        "You cannot set the analysis status since the scenario execution is still underway."
      );
    });

    it("should return correct reason when scenario is passed", () => {
      expect(
        component.getIneligibilityReasonMessage(
          AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED
        )
      ).toEqual(
        "The analysis status is automatically set to passed since the scenario execution passed"
      );
    });

    it("should return undefined for unknown eligibility reasons", () => {
      expect(
        component.getIneligibilityReasonMessage(
          undefined as unknown as AnalysisStatusUpdateIneligibilityReason
        )
      ).toBeUndefined();
    });
  });

  describe("abort scenario execution", () => {
    function mockConfirmationService() {
      jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation((confirmation: Confirmation) => {
          if (confirmation.accept) {
            return confirmation.accept();
          }
          return;
        });
    }

    it("should not display confirmation popup if scenario execution is not defined", () => {
      component.confirmAbortScenarioExecution(new Event("Event"), undefined);
      expect(confirmationService.confirm).not.toHaveBeenCalled();
    });

    it("should not abort if scenario execution is not defined", () => {
      component.confirmAbortScenarioExecution(new Event("Event"), undefined);
      expect(
        scenarioExecutionService.abortScenarioExecution
      ).not.toHaveBeenCalled();
    });

    it("should display confirmation popup with appropriate message when scenario is defined", () => {
      const event = new Event("Event");
      component.confirmAbortScenarioExecution(event, scenarioExecutionId);

      expect(confirmationService.confirm).toHaveBeenCalledWith({
        accept: expect.any(Function),
        acceptButtonStyleClass: "p-button-danger p-button-sm",
        icon: "pi pi-info-circle",
        message: "Are you sure you want to abort this scenario execution?",
        target: event.target,
      });
    });

    it("should abort scenario execution when confirmed", () => {
      mockConfirmationService();

      component.confirmAbortScenarioExecution(
        new Event("Event"),
        scenarioExecutionId
      );

      expect(
        scenarioExecutionService.abortScenarioExecution
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
    });

    it("should emit an abort requested event on successful triggering of abort", () => {
      const emitSpy = jest.spyOn(component.abortScenarioRequested, "emit");
      mockConfirmationService();

      component.confirmAbortScenarioExecution(
        new Event("Event"),
        scenarioExecutionId
      );

      expect(
        scenarioExecutionService.abortScenarioExecution
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
      expect(emitSpy).toHaveBeenCalledWith(abortRequestedMessage);
    });

    it("should emit an error message on failure to abort", () => {
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");
      jest
        .spyOn(scenarioExecutionService, "abortScenarioExecution")
        .mockReturnValueOnce(throwError(() => "ERROR"));
      mockConfirmationService();

      component.confirmAbortScenarioExecution(
        new Event("Event"),
        scenarioExecutionId
      );

      expect(
        scenarioExecutionService.abortScenarioExecution
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
      expect(emitSpy).toHaveBeenCalledWith("ERROR");
    });

    it("should evaluate whether enable the abort button based on the scenario execution status", () => {
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.UNDERWAY,
      });
      fixture.detectChanges();
      expect(disableAbortPipeTransform).toHaveBeenCalledWith(
        ScenarioExecutionStatus.UNDERWAY
      );
    });

    it("should enable abort button if status is UNDERWAY", () => {
      disableAbortPipeTransform.mockReturnValue(false);
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.UNDERWAY,
      });
      fixture.detectChanges();
      expect(getAbortButtonHarness().isDisabled()).toBe(false);
    });

    it("should disable abort button if status is not UNDERWAY", () => {
      disableAbortPipeTransform.mockReturnValue(true);
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.FAILED,
      });
      fixture.detectChanges();
      expect(getAbortButtonHarness().isDisabled()).toBe(true);
    });

    it("should determine whether to show termination message based on scenario execution status", () => {
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.FAILED,
      });
      fixture.detectChanges();
      expect(showTerminationMessagePipeTransform).toHaveBeenCalledWith(
        scenarioExecution
      );
    });

    it("should show termination message if showTerminationMessagePipe returns true", () => {
      showTerminationMessagePipeTransform.mockReturnValue(true);
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.FAILED,
      });
      fixture.detectChanges();
      expect(
        DomTestUtils.getElementByTestId(
          fixture,
          "termination-message"
        ).isRendered()
      ).toBe(true);
    });

    it("should hide termination message if showTerminationMessagePipe returns false", () => {
      showTerminationMessagePipeTransform.mockReturnValue(false);
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        status: ScenarioExecutionStatus.FAILED,
      });
      fixture.detectChanges();
      expect(
        DomTestUtils.getElementByTestId(
          fixture,
          "termination-message"
        ).isRendered()
      ).toBe(false);
    });
  });

  describe("kept execution", () => {
    it("should emit a kept execution toggled event when the scenario execution is defined", () => {
      const emitSpy = jest.spyOn(component.keptExecutionToggled, "emit");
      component.toggleKeptExecutionFlag();
      expect(emitSpy).toHaveBeenCalledWith(scenarioExecution.id);
    });

    it("should not emit a kept execution toggled event when the scenario execution is undefined", () => {
      stateService.scenarioExecution.set(undefined);
      const emitSpy = jest.spyOn(component.keptExecutionToggled, "emit");
      component.toggleKeptExecutionFlag();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should not show kept execution section when disable keep execution flag is true", () => {
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        disableKeepExecution: true,
      });
      fixture.detectChanges();

      const keepExecutionSection = fixture.debugElement.query(
        By.css("#keep-execution-section")
      );

      expect(keepExecutionSection).toBeNull();
    });

    it("should show kept execution section when disable keep execution flag is false", () => {
      stateService.testUnit.set({
        ...TEST_UNIT,
        disableKeepExecution: false,
      });
      fixture.detectChanges();

      const keepExecutionSection = fixture.debugElement.query(
        By.css("#kept-execution-section")
      );

      expect(keepExecutionSection).toBeTruthy();
    });
  });

  describe("show analysis object works", () => {
    it("should set incident linking state to true when opening the incident modal", () => {
      component.showIncidentsLinkingModal();
      expect(incidentLinkingStateService.setIsLinking).toHaveBeenCalledWith(
        true
      );
    });

    it("should set the incident linking state to false when closing the incident modal", () => {
      component.isModalVisibleChange(false);
      expect(incidentLinkingStateService.setIsLinking).toHaveBeenCalledWith(
        false
      );
    });

    it.each([
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.BINARY_IMPACT
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.BINARY_REGRESSION
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.CONFIGURATION_IMPACT
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.CONFIGURATION_REGRESSION
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.FAILURE_REASON
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showIncidentsLinkingModal();
      },
    ])(
      "should set isAnalysisObjectsLinkingModalVisible to true when any analysis object show method is called",
      (showAnalysisObject: (component: ExecutionDetailsComponent) => void) => {
        showAnalysisObject(component);
        expect(component.isAnalysisObjectsLinkingModalVisible).toBeTruthy();
      }
    );

    it.each([
      [
        (component: ExecutionDetailsComponent) => {
          component.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.BINARY_IMPACT
          );
        },
        AnalysisObjectType.BINARY_IMPACT,
      ],
      [
        (component: ExecutionDetailsComponent) => {
          component.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.CONFIGURATION_REGRESSION
          );
        },
        AnalysisObjectType.CONFIGURATION_REGRESSION,
      ],
      [
        (component: ExecutionDetailsComponent) => {
          component.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.BINARY_REGRESSION
          );
        },
        AnalysisObjectType.BINARY_REGRESSION,
      ],
      [
        (component: ExecutionDetailsComponent) => {
          component.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.CONFIGURATION_IMPACT
          );
        },
        AnalysisObjectType.CONFIGURATION_IMPACT,
      ],
      [
        (component: ExecutionDetailsComponent) => {
          component.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.FAILURE_REASON
          );
        },
        AnalysisObjectType.FAILURE_REASON,
      ],
      [
        (component: ExecutionDetailsComponent) => {
          component.showIncidentsLinkingModal();
        },
        AnalysisObjectType.INCIDENT,
      ],
    ])(
      "should set the analysis object type correctly",
      (
        showAnalysisObject: (component: ExecutionDetailsComponent) => void,
        analysisObjectType: AnalysisObjectType
      ) => {
        showAnalysisObject(component);
        expect(component.analysisObjectType).toEqual(analysisObjectType);
      }
    );

    it.each([
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.BINARY_IMPACT
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.BINARY_REGRESSION
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.CONFIGURATION_IMPACT
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.CONFIGURATION_REGRESSION
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showAnalysisObjectsLinkingModal(
          AnalysisObjectType.FAILURE_REASON
        );
      },
      (component: ExecutionDetailsComponent) => {
        component.showIncidentsLinkingModal();
      },
    ])(
      "should refresh the analysis object links",
      (showAnalysisObject: (component: ExecutionDetailsComponent) => void) => {
        showAnalysisObject(component);
        expect(
          stateService.getScenarioExecutionAnalysisObjectLinks$
        ).toHaveBeenCalled();
      }
    );
  });

  describe("onAnalysisObjectLinksChanged", () => {
    it("should be called when the analysis objects linking component emits a links changed event", () => {
      const handlerSpy = jest.spyOn(component, "onAnalysisObjectLinksChanged");
      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(handlerSpy).toHaveBeenCalled();
    });

    it("should set loading to true before refreshing", () => {
      jest.clearAllMocks();
      component.onAnalysisObjectLinksChanged();
      expect(stateService.setLoading).toHaveBeenCalledWith(true);
    });

    it("should set loading to false after refresh completes", () => {
      jest.clearAllMocks();
      component.onAnalysisObjectLinksChanged();
      expect(stateService.setLoading).toHaveBeenLastCalledWith(false);
    });

    it("should refresh the analysis object links from the state service", () => {
      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(stateService.refreshAnalysisObjectLinks$).toHaveBeenCalled();
    });

    it("should refresh the selected scenario execution", () => {
      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(stateService.refreshSelectedScenarioExecution$).toHaveBeenCalled();
    });

    it("should emit event to set analysis status to cancelled when waiting for failure reason link is set to true", () => {
      const mockLink: AnalysisObjectLink = {
        analysisObjectId: "",
        projectId: "",
        scenarioExecutionId: "",
        analysisObjectType: "FAILURE_REASON",
      };
      stateService.analysisObjectLinks.set([mockLink]);
      component.isWaitingForFailureReasonLinking = true;
      const emitSpy = jest.spyOn(component.updateAnalysisStatusEvent, "emit");
      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(emitSpy).toHaveBeenCalledWith(
        component.scenarioAnalysisStatus.CANCELLED
      );
    });

    it("should set is waiting for failure reason link to false after emitting event to set analysis status to cancelled successfully", () => {
      const mockLink: AnalysisObjectLink = {
        analysisObjectId: "",
        projectId: "",
        scenarioExecutionId: "",
        analysisObjectType: "FAILURE_REASON",
      };
      stateService.analysisObjectLinks.set([mockLink]);
      component.isWaitingForFailureReasonLinking = true;
      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(component.isWaitingForFailureReasonLinking).toBeFalsy();
    });

    it("should not emit event to set analysis status to cancelled when waiting for failure reason link is set to true but no failure reason is linked", () => {
      const mockLink: AnalysisObjectLink = {
        analysisObjectId: "",
        projectId: "",
        scenarioExecutionId: "",
        analysisObjectType: "BINARY_IMPACT",
      };
      stateService.analysisObjectLinks.set([mockLink]);
      component.isWaitingForFailureReasonLinking = true;
      const emitSpy = jest.spyOn(component.updateAnalysisStatusEvent, "emit");

      getComponent(
        AnalysisObjectLinkingComponent
      ).analysisObjectLinksChanged.emit();
      expect(emitSpy).not.toHaveBeenCalledWith();
    });
  });

  it("should display no env provided message when the scenario execution's environment id is not defined", () => {
    stateService.scenarioExecution.set({
      ...scenarioExecution,
      environmentId: undefined,
    });
    fixture.detectChanges();
    const viewEnvironmentLink = fixture.debugElement.query(
      By.css("[data-testid='view-environment-details']")
    );
    const emptyContent = fixture.debugElement.query(
      By.css("[data-testid='empty-content']")
    );
    expect(viewEnvironmentLink).toBeFalsy();
    expect(emptyContent).toBeTruthy();
  });

  it("should display the view environment details link when the scenario execution's environment is defined", () => {
    stateService.scenarioExecution.set(scenarioExecution);
    fixture.detectChanges();
    const viewEnvironmentLink = fixture.debugElement.query(
      By.css("[data-testid='view-environment-details']")
    );
    const emptyContent = fixture.debugElement.query(
      By.css("[data-testid='empty-content']")
    );
    expect(viewEnvironmentLink).toBeTruthy();
    expect(emptyContent).toBeFalsy();
  });

  it("should track validation scope clicks", () => {
    component.validationScopeEnabled = true;
    fixture.detectChanges();
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();
    const viewValidationScopeButton = new ButtonHarness(
      fixture,
      "viewValidationScopeButton"
    );
    viewValidationScopeButton.click();
    expect(analyticsTrackerService.trackValidationScope).toHaveBeenCalled();
  });

  function renderShowIfAuthorizedDirectives() {
    const showElementIfAuthorizedDirectives = ngMocks.findInstances(
      ShowElementIfAuthorizedDirective
    );
    showElementIfAuthorizedDirectives.forEach((authDirective) =>
      ngMocks.render(authDirective, authDirective)
    );
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }

  function getAbortButtonHarness() {
    return DomTestUtils.getButtonByTestId(fixture, "abort-button");
  }
});
