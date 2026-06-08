import { ScenarioExecutionDetailsComponent } from "./scenario-execution-details.component";
import { User, UserService } from "@mxflow/features/user";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecution } from "../scenario-execution";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { ScenarioExecutionStatus } from "../scenario-execution-status/scenario-execution-status";
import { ActivatedRoute } from "@angular/router";
import { CommonModule, Location } from "@angular/common";
import { BehaviorSubject, of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Store } from "@ngrx/store";
import {
  ValidationScope,
  ValidationScopeService,
} from "@mxflow/features/validation-management";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { fakeAsync, tick } from "@angular/core/testing";
import {
  CUSTOM_ELEMENTS_SCHEMA,
  DebugElement,
  signal,
  WritableSignal,
} from "@angular/core";
import { By } from "@angular/platform-browser";
import { ScenarioExecutionStateManagementService } from "./scenario-execution-state-management.service";
import {
  comment,
  jumpType,
  projectId,
  referenceFactoryProductId,
  requestedFactoryProductId,
  scenarioExecution,
  scenarioExecution2,
  scenarioExecutionId,
  scenarioExecutionId2,
} from "../scenario-execution-test-utils";
import {
  AnalysisStatusEligibility,
  AnalysisStatusUpdateIneligibilityReason,
} from "../scenario-analysis-status/analysis-status-eligibility";
import { Tab, TabPanel, Tabs, TabsModule } from "primeng/tabs";
import { TestUnitModel } from "../../test-unit/test-unit.model";
import { ProjectService } from "@mxflow/features/project";
import { DomTestUtils } from "@mxevolve/testing";

const errorMessage = "errorMessage";
const newComment = "newComment";
const assigneeId = "assigneeId";
const assigneeDisplayName = "assigneeDisplayName";
const assigneeMail = "assigneeMail";
const assignee = {
  id: assigneeId,
  displayName: assigneeDisplayName,
  mail: assigneeMail,
} as User;
const scenarioDefinitionId = "scenarioDefinitionId";
const validationScope: ValidationScope = {
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};
class MockedResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

describe("scenario execution details component", () => {
  let component: ScenarioExecutionDetailsComponent;
  let fixture: MockedComponentFixture<ScenarioExecutionDetailsComponent>;
  let userService: UserService;
  let scenarioExecutionService: ScenarioExecutionService;
  let route: ActivatedRoute;
  const routeParams$ = new BehaviorSubject({
    projectId: projectId,
    "scenario-execution-id": scenarioExecutionId,
  });
  const queryParams$ = new BehaviorSubject<Record<string, string>>({});
  let location: Location;
  let toastMessageService: ToastMessageService;
  let validationScopeService: ValidationScopeService;
  let authorizationService: AuthorizationService;
  let stateService: any;
  let isLoading: WritableSignal<boolean>;
  let projectService: ProjectService;

  beforeEach(async () => {
    global.ResizeObserver = MockedResizeObserver;
    isLoading = signal(false);
    userService = {
      getUserById: jest.fn(() => of(getUser())),
    } as unknown as UserService;
    scenarioExecutionService = {
      checkAnalysisStatusesEligibility: jest.fn(),
      updateComment: jest.fn(() => of(null)),
      updateAnalysisStatus: jest.fn(() => of(null)),
      toggleKeptExecutionFlag: jest.fn(() => of(undefined)),
    } as unknown as ScenarioExecutionService;
    route = {
      params: routeParams$.asObservable(),
      queryParams: queryParams$.asObservable(),
      snapshot: { queryParams: {} },
    } as unknown as ActivatedRoute;
    location = {
      back: jest.fn(),
    } as unknown as Location;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;
    validationScopeService = {
      getValidationScope: jest.fn(() => of(validationScope)),
    } as unknown as ValidationScopeService;
    authorizationService = {
      isAuthorized: jest.fn(() => of(true)),
    } as unknown as AuthorizationService;
    projectService = {
      getProjectById: jest.fn(() => of({ name: "Mock Project" })),
    } as unknown as ProjectService;
    const storeMock = {
      select: jest.fn(() => of({ name: "Mock Project" })),
      dispatch: jest.fn(),
    } as unknown as Store;
    stateService = {
      projectId: signal<string>(projectId),
      scenarioExecution: signal<ScenarioExecution>(scenarioExecution),
      scenarioExecutionId: signal<string>(scenarioExecutionId),
      initialize: jest.fn(() => of(scenarioExecution)),
      refreshSelectedScenarioExecution$: jest.fn(() => of(undefined)),
      setAnalysisStatus: jest.fn(),
      setComment: jest.fn(),
      isScenarioExecutionDetailsLoading: isLoading,
      testUnit: signal<TestUnitModel | undefined>({
        assignee: "Assignee 1",
      } as unknown as TestUnitModel),
      setLoading: jest.fn(),
      setValidationScope: jest.fn(),
      setValidationScopeWarningMessage: jest.fn(),
      setKeptExecution: jest.fn(),
      setKeptExecutionForTestUnitScenarioExecution: jest.fn(),
    };

    await MockBuilder(ScenarioExecutionDetailsComponent)
      .mock(UserService, userService)
      .mock(ScenarioExecutionService, scenarioExecutionService)
      .mock(ActivatedRoute, route)
      .mock(Location, location)
      .mock(ToastMessageService, toastMessageService)
      .mock(ValidationScopeService, validationScopeService)
      .mock(AuthorizationService, authorizationService)
      .mock(ProjectService, projectService)
      .keep(CommonModule)
      .keep(Tabs)
      .keep(TabsModule)
      .keep(TabPanel)
      .mock(ShowElementIfAuthorizedDirective, { render: true })
      .mock(ScenarioExecutionStateManagementService, stateService)
      .mock(Store, storeMock)
      .beforeCompileComponents((testBed) => {
        testBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
      });

    fixture = MockRender(ScenarioExecutionDetailsComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  describe("scenarioExecutionHistory", () => {
    it("should return scenario executions of the test unit", fakeAsync(() => {
      stateService.testUnit.set({
        scenarioExecutions: [scenarioExecution, scenarioExecution2],
      });
      expect(component.scenarioExecutionHistory()).toEqual([
        scenarioExecution,
        scenarioExecution2,
      ]);
    }));

    it("should return empty list if test unit is undefined", fakeAsync(() => {
      stateService.testUnit.set(undefined);
      expect(component.scenarioExecutionHistory()).toEqual([]);
    }));
  });

  describe("validationScopeEnabled", () => {
    it("should return true when test unit has validationScopeEnabled set to true", fakeAsync(() => {
      stateService.testUnit.set({
        validationScopeEnabled: true,
      } as TestUnitModel);
      expect(component.validationScopeEnabled()).toBe(true);
    }));

    it("should return false when test unit has validationScopeEnabled set to false", fakeAsync(() => {
      stateService.testUnit.set({
        validationScopeEnabled: false,
      } as TestUnitModel);
      expect(component.validationScopeEnabled()).toBe(false);
    }));

    it("should default to false when test unit is undefined", fakeAsync(() => {
      stateService.testUnit.set(undefined);
      expect(component.validationScopeEnabled()).toBe(false);
    }));
  });

  describe("incidentEnabled", () => {
    it("should return true when test unit has incidentEnabled set to true", fakeAsync(() => {
      stateService.testUnit.set({ incidentEnabled: true } as TestUnitModel);
      expect(component.incidentEnabled()).toBe(true);
    }));

    it("should return false when test unit has incidentEnabled set to false", fakeAsync(() => {
      stateService.testUnit.set({ incidentEnabled: false } as TestUnitModel);
      expect(component.incidentEnabled()).toBe(false);
    }));

    it("should default to false when test unit is undefined", fakeAsync(() => {
      stateService.testUnit.set(undefined);
      expect(component.incidentEnabled()).toBe(false);
    }));
  });

  describe("incidents tab", () => {
    it("should disable incidents tab when incidentEnabled is false", fakeAsync(() => {
      stateService.testUnit.set({ incidentEnabled: false } as TestUnitModel);
      fixture.detectChanges();
      const incidentsTab = DomTestUtils.getElementByTestId(
        fixture,
        "incidents"
      ).getInstance() as Tab;
      expect(incidentsTab?.disabled()).toBeTruthy();
    }));

    it("should enable incidents tab when incidentEnabled is true", fakeAsync(() => {
      stateService.testUnit.set({ incidentEnabled: true } as TestUnitModel);
      fixture.detectChanges();
      const incidentsTab = DomTestUtils.getElementByTestId(
        fixture,
        "incidents"
      ).getInstance() as Tab;
      expect(incidentsTab?.disabled()).toBeFalsy();
    }));
  });

  describe("ngOnInit", () => {
    it("should initialize state service with scenario execution id fetched from the route", () => {
      component.ngOnInit();
      expect(stateService.initialize).toHaveBeenCalledWith(scenarioExecutionId);
    });

    it("should navigate to main tab on successfully initializing the state", () => {
      component.tabIndex = 1;
      component.ngOnInit();
      expect(component.tabIndex).toEqual(0);
    });

    it("should show error on failure to initialize the state", () => {
      jest
        .spyOn(stateService, "initialize")
        .mockImplementation(() => throwError(() => errorMessage));
      component.ngOnInit();
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should get the project id on init", () => {
      component.ngOnInit();
      expect(component.projectId()).toEqual(projectId);
    });

    it("should get the scenario execution id on init", () => {
      component.ngOnInit();
      expect(component.selectedScenarioExecutionId()).toEqual(
        scenarioExecutionId
      );
    });

    it("should set the validation scope", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      component.ngOnInit();
      expect(stateService.setValidationScope).toHaveBeenCalledWith(
        validationScope
      );
    });

    it("should get the validation scope correctly", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      component.ngOnInit();
      expect(validationScopeService.getValidationScope).toHaveBeenCalledWith(
        projectId,
        requestedFactoryProductId,
        referenceFactoryProductId
      );
    });

    it("should set an empty validation scope on failure to fetch it", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(validationScopeService, "getValidationScope")
        .mockReturnValueOnce(throwError(() => errorMessage));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      component.ngOnInit();
      expect(stateService.setValidationScope).toHaveBeenCalledWith({});
    });

    it("should set the warning message on failure to fetch the validation scope", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(validationScopeService, "getValidationScope")
        .mockReturnValueOnce(throwError(() => errorMessage));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      component.ngOnInit();
      expect(
        stateService.setValidationScopeWarningMessage
      ).toHaveBeenCalledWith(errorMessage);
    });

    it("should get the analysis statuses eligibility on init", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      component.ngOnInit();
      expect(
        scenarioExecutionService.checkAnalysisStatusesEligibility
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
      expect(component.analysisStatusEligibility).toEqual(
        getAnalysisStatusEligibility()
      );
    });

    it("should not call the check analysis status eligibility if not authorized", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(authorizationService, "isAuthorized")
        .mockReturnValue(of(false));
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));

      (
        scenarioExecutionService.checkAnalysisStatusesEligibility as jest.Mock
      ).mockClear();

      component.ngOnInit();
      expect(
        scenarioExecutionService.checkAnalysisStatusesEligibility
      ).not.toHaveBeenCalled();
      expect(component.analysisStatusEligibility).toBeUndefined();
    });

    it("should set the scenario execution finished flag to false if the scenario execution is not done", () => {
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        isFinished: false,
      });
      component.ngOnInit();
      expect(component.isScenarioExecutionFinished).toBe(false);
    });

    it("should set the scenario execution finished flag to true if the scenario execution is done", () => {
      stateService.scenarioExecution.set({
        ...scenarioExecution,
        isFinished: true,
      });
      component.ngOnInit();
      expect(component.isScenarioExecutionFinished).toBe(true);
    });

    it("should get the assignee details on init", () => {
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(assignee));
      component.ngOnInit();
      expect(component.assignee).toEqual(assignee);
    });

    it("should handle the error on init", () => {
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution));
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(throwError(() => errorMessage));
      component.ngOnInit();
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
      expect(component.isLoading()).toBeFalsy();
    });

    it("should fetch the project name again on route param changes", () => {
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(projectService.getProjectById).toHaveBeenCalledTimes(2);
    });

    it("should reinitialize the component again on route param changes", () => {
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(stateService.initialize).toHaveBeenCalledTimes(2);
    });

    it("should fetch the assignee again on route param changes", () => {
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(userService.getUserById).toHaveBeenCalledTimes(2);
    });

    it("should fetch the validation scope again on route param changes", () => {
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution2));
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(validationScopeService.getValidationScope).toHaveBeenCalledTimes(
        2
      );
    });

    it("should fetch the analysis status eligibilities again on route param changes", () => {
      jest
        .spyOn(stateService, "initialize")
        .mockReturnValue(of(scenarioExecution2));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(getUser()));
      jest
        .spyOn(validationScopeService, "getValidationScope")
        .mockReturnValue(of(validationScope));
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(
        scenarioExecutionService.checkAnalysisStatusesEligibility
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("tab selection from query params", () => {
    it("should set tabIndex from tab query param when route params change", () => {
      route.snapshot.queryParams = { tab: "history" };
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(component.tabIndex).toEqual(3);
    });

    it("should default tabIndex to 0 when no tab query param is present on route change", () => {
      component.tabIndex = 3;
      route.snapshot.queryParams = {};
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(component.tabIndex).toEqual(0);
    });

    it("should reset tab to details when navigating to a different scenario from history tab", () => {
      component.tabIndex = 3;
      route.snapshot.queryParams = { tab: "details" };
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(component.tabIndex).toEqual(0);
    });

    it("should update tabIndex when query params change to a valid tab", () => {
      queryParams$.next({ tab: "history" });
      expect(component.tabIndex).toEqual(3);
    });

    it("should not change tabIndex when query params contain an invalid tab name", () => {
      component.tabIndex = 0;
      queryParams$.next({ tab: "nonexistent" });
      expect(component.tabIndex).toEqual(0);
    });
  });

  describe("clicking View on a different scenario from the history tab", () => {
    it("should navigate to the new scenario and reset to the details tab", () => {
      component.tabIndex = 3;
      route.snapshot.queryParams = { tab: "details" };
      routeParams$.next({
        projectId: projectId,
        "scenario-execution-id": scenarioExecutionId2,
      });
      expect(stateService.initialize).toHaveBeenCalledWith(
        scenarioExecutionId2
      );
      expect(component.tabIndex).toEqual(0);
    });
  });

  it("should destroy", () => {
    const destroyNextMock = jest.spyOn(component.destroy$, "next");
    const destroyCompleteMock = jest.spyOn(component.destroy$, "complete");
    component.ngOnDestroy();
    expect(destroyCompleteMock).toHaveBeenCalled();
    expect(destroyNextMock).toHaveBeenCalled();
  });

  describe("updateAnalysisStatus", () => {
    beforeEach(fakeAsync(() => {
      jest.clearAllMocks();
      stateService.scenarioExecution.set(scenarioExecution);
      tick();
    }));

    it("should set loading to true before updating the analysis status", () => {
      jest.clearAllMocks();
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(stateService.setLoading).toHaveBeenCalledWith(true);
    });

    it("should update the analysis status with the correct parameters", () => {
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(
        scenarioExecutionService.updateAnalysisStatus
      ).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId,
        ScenarioAnalysisStatus.PASSED
      );
    });

    it("should refresh the scenario execution after updating the analysis status", () => {
      stateService.testUnit.set({
        scenarioExecutions: [scenarioExecution, scenarioExecution2],
      });
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(stateService.refreshSelectedScenarioExecution$).toHaveBeenCalled();
    });

    it("should set loading to false after the operation completes", () => {
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(stateService.setLoading).toHaveBeenLastCalledWith(false);
    });

    it("should handle failure of updating the analysis status", () => {
      jest
        .spyOn(scenarioExecutionService, "updateAnalysisStatus")
        .mockReturnValue(throwError(() => errorMessage));
      stateService.testUnit.set({
        scenarioExecutions: [scenarioExecution, scenarioExecution2],
      });
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should set loading to false on failure", () => {
      jest
        .spyOn(scenarioExecutionService, "updateAnalysisStatus")
        .mockReturnValue(throwError(() => errorMessage));
      component.updateAnalysisStatus(ScenarioAnalysisStatus.PASSED);
      expect(stateService.setLoading).toHaveBeenLastCalledWith(false);
    });
  });

  describe("setAssignee", () => {
    beforeEach(fakeAsync(() => {
      jest.clearAllMocks();
      stateService.scenarioExecution.set(scenarioExecution);
      tick();
    }));

    it("should fetch user by id when assigneeId is provided", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(assignee));
      component.setAssignee(assigneeId);
      expect(userService.getUserById).toHaveBeenCalledWith(
        assigneeId,
        projectId
      );
      expect(component.assignee).toEqual(assignee);
    });

    it("should set loading to true before refreshing scenario execution", () => {
      component.setAssignee(assigneeId);
      expect(stateService.setLoading).toHaveBeenCalledWith(true);
    });

    it("should set loading to false after refresh completes", () => {
      component.setAssignee(assigneeId);
      expect(stateService.setLoading).toHaveBeenLastCalledWith(false);
    });

    it("should set assignee to null when assigneeId is empty", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest.spyOn(userService, "getUserById").mockReturnValue(of(assignee));
      component.setAssignee("");
      expect(component.assignee).toBeNull();
    });

    it("should handle error when fetching user fails", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      jest
        .spyOn(userService, "getUserById")
        .mockReturnValue(throwError(() => errorMessage));
      component.setAssignee(assigneeId);
      expect(userService.getUserById).toHaveBeenCalledWith(
        assigneeId,
        projectId
      );
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should not refresh if scenario execution is undefined", () => {
      stateService.scenarioExecution.set(undefined);
      jest.clearAllMocks();
      component.setAssignee(assigneeId);
      expect(
        stateService.refreshSelectedScenarioExecution$
      ).not.toHaveBeenCalled();
    });
  });

  it("should handle the error correctly", () => {
    component.handleError(errorMessage);
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should handle updating the comment correctly", () => {
    component.updateComment(newComment);
    expect(stateService.setComment).toHaveBeenCalledWith(newComment);
  });

  describe("saveComment", () => {
    beforeEach(fakeAsync(() => {
      stateService.scenarioExecution.set(scenarioExecution);
      tick();
    }));

    it("should handle saving the comment correctly", () => {
      component.fetchedComment = comment;
      component.saveComment(newComment);
      expect(scenarioExecutionService.updateComment).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId,
        newComment
      );
      expect(component.fetchedComment).toEqual(newComment);
    });

    it("should not save comment if scenario execution is undefined", () => {
      component.fetchedComment = comment;
      stateService.scenarioExecution.set(undefined);
      component.saveComment(newComment);
      expect(scenarioExecutionService.updateComment).not.toHaveBeenCalled();
      expect(component.fetchedComment).toEqual(comment);
    });

    it("should handle saving the comment if it was not changed", () => {
      component.fetchedComment = comment;
      component.saveComment(comment);
      expect(scenarioExecutionService.updateComment).not.toHaveBeenCalled();
      expect(component.fetchedComment).toEqual(comment);
    });

    it("should handle failing to save the comment", () => {
      jest
        .spyOn(scenarioExecutionService, "updateComment")
        .mockReturnValue(throwError(() => errorMessage));
      component.fetchedComment = comment;
      component.saveComment(newComment);
      expect(scenarioExecutionService.updateComment).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId,
        newComment
      );
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should handle cancelling updating the comment", () => {
    component.fetchedComment = comment;
    component.cancelComment();
    expect(stateService.setComment).toHaveBeenCalledWith(comment);
  });

  it("should go back", () => {
    const locationBackMock = jest.spyOn(location, "back");
    component.back();
    expect(locationBackMock).toHaveBeenCalled();
  });

  describe("detection tab", () => {
    let tab: DebugElement;

    beforeEach(() => {
      tab = fixture.debugElement.query(By.css("[data-testid=detections]"));
    });

    it("should exist", async () => {
      tab = fixture.debugElement.query(By.css("[data-testid=detections]"));
      expect(tab).toBeTruthy();
    });

    it("should be authorized", async () => {
      await fixture.whenStable();

      const showElementIfAuthorizedDirective = ngMocks.findInstance(
        tab,
        ShowElementIfAuthorizedDirective
      );

      expect(showElementIfAuthorizedDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("should select the detection tab", () => {
      component.detectionTabClick();
      expect(component.isDetectionsSelected).toBeTruthy();
    });

    it("should deselect the detection tab", () => {
      component.detectionTabDeselected();
      expect(component.isDetectionsSelected).toBeFalsy();
    });
  });

  describe("incident tab", () => {
    let tab: DebugElement;

    beforeEach(() => {
      tab = fixture.debugElement.query(By.css("[data-testid=incidents]"));
    });

    it("should exist", () => {
      expect(tab).toBeTruthy();
    });

    it("should be authorized", async () => {
      await fixture.whenStable();
      const showElementIfAuthorizedDirective = ngMocks.findInstance(
        tab,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementIfAuthorizedDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });
  });

  describe("handleRefreshAnalysisStatusEvent", () => {
    it("should set default value while fetching the eligibility", () => {
      component.handleRefreshAnalysisStatusEvent();
      expect(component.analysisStatusEligibility).toEqual({
        nextAnalysisStatuses: [],
        isUpdateEligible: false,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.LOADING,
      });
    });

    it("should check the analysis status eligibility", () => {
      component.handleRefreshAnalysisStatusEvent();
      expect(
        scenarioExecutionService.checkAnalysisStatusesEligibility
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
    });

    it("should set the analysis status eligibility to the one fetched from the service", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(of(getAnalysisStatusEligibility()));
      component.handleRefreshAnalysisStatusEvent();
      expect(component.analysisStatusEligibility).toEqual(
        getAnalysisStatusEligibility()
      );
    });

    it("should handle failing to refresh the analysis status eligibility", () => {
      jest
        .spyOn(scenarioExecutionService, "checkAnalysisStatusesEligibility")
        .mockReturnValue(throwError(() => errorMessage));
      component.handleRefreshAnalysisStatusEvent();
      expect(
        scenarioExecutionService.checkAnalysisStatusesEligibility
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
      expect(component.isLoading()).toBeFalsy();
    });
  });

  describe("handleAbortScenarioRequested", () => {
    it("should display message on request to abort scenario", () => {
      component.handleAbortScenarioRequested("abortRequestedMessage");
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "abortRequestedMessage"
      );
    });

    it("should refresh scenario execution details", () => {
      const initializeSpy = jest.spyOn(
        ScenarioExecutionDetailsComponent.prototype as any,
        "initializeScenarioExecutionDetails"
      );
      component.handleAbortScenarioRequested("abortRequestedMessage");
      expect(initializeSpy).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId
      );
    });
  });

  describe("handle kept execution toggled", () => {
    beforeEach(fakeAsync(() => {
      stateService.testUnit.set({
        scenarioExecutions: [
          getUnkeptScenarioExecution(),
          {
            ...scenarioExecution2,
            keptExecution: false,
          },
        ],
      });
      stateService.scenarioExecution.set(getUnkeptScenarioExecution());
      tick();
      jest
        .spyOn(scenarioExecutionService, "toggleKeptExecutionFlag")
        .mockReturnValue(of(undefined));
    }));

    it("should delegate call to scenario execution service", () => {
      component.handleKeptExecutionToggled(scenarioExecutionId);
      expect(
        scenarioExecutionService.toggleKeptExecutionFlag
      ).toHaveBeenCalledWith(projectId, scenarioExecutionId, true);
    });

    it("should update the keptExecution flag of the scenario execution in the history if its keep execution is toggled", () => {
      component.handleKeptExecutionToggled(scenarioExecution2.id);
      expect(
        stateService.setKeptExecutionForTestUnitScenarioExecution
      ).toHaveBeenCalledWith(scenarioExecution2.id, true);
    });

    it("should update the keptExecution flag of the scenario execution in the execution details if it is currently being viewed", () => {
      component.handleKeptExecutionToggled(scenarioExecutionId);
      expect(stateService.setKeptExecution).toHaveBeenCalledWith(true);
    });

    it("should display message on successfully updating kept execution flag to true", () => {
      stateService.testUnit.set({
        scenarioExecutions: [getUnkeptScenarioExecution()],
      });
      stateService.scenarioExecution.set(getUnkeptScenarioExecution());
      component.handleKeptExecutionToggled(scenarioExecutionId);
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The execution has been marked as kept."
      );
    });

    it("should display message on successfully updating kept execution flag to false", () => {
      const keptExecution = {
        ...getUnkeptScenarioExecution(),
        keptExecution: true,
      };
      stateService.testUnit.set({
        scenarioExecutions: [keptExecution],
      });
      stateService.scenarioExecution.set(keptExecution);
      component.handleKeptExecutionToggled(scenarioExecutionId);
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The execution has been marked as not kept."
      );
    });

    it("should revert kept execution flag for the scenario execution in the history on failure to update its kept execution flag", () => {
      jest
        .spyOn(scenarioExecutionService, "toggleKeptExecutionFlag")
        .mockReturnValue(throwError(() => errorMessage));
      component.handleKeptExecutionToggled(scenarioExecution2.id);
      expect(
        scenarioExecutionService.toggleKeptExecutionFlag
      ).toHaveBeenCalledWith(projectId, scenarioExecution2.id, true);
      expect(
        stateService.setKeptExecutionForTestUnitScenarioExecution
      ).toHaveBeenCalledTimes(2);
      expect(
        stateService.setKeptExecutionForTestUnitScenarioExecution
      ).toHaveBeenCalledWith(scenarioExecution2.id, true);
      expect(
        stateService.setKeptExecutionForTestUnitScenarioExecution
      ).toHaveBeenCalledWith(scenarioExecution2.id, false);
    });

    it("should revert kept execution for the scenario execution in the execution details if it is currently viewed on failure to update its kept execution flag", () => {
      jest
        .spyOn(scenarioExecutionService, "toggleKeptExecutionFlag")
        .mockReturnValue(throwError(() => errorMessage));
      component.handleKeptExecutionToggled(scenarioExecution.id);
      expect(
        scenarioExecutionService.toggleKeptExecutionFlag
      ).toHaveBeenCalledWith(projectId, scenarioExecution.id, true);
      expect(stateService.setKeptExecution).toHaveBeenCalledTimes(2);
      expect(stateService.setKeptExecution).toHaveBeenCalledWith(true);
      expect(stateService.setKeptExecution).toHaveBeenCalledWith(false);
    });

    it("should display error toast message on failure to update kept execution flag", () => {
      jest
        .spyOn(scenarioExecutionService, "toggleKeptExecutionFlag")
        .mockReturnValue(throwError(() => errorMessage));
      component.handleKeptExecutionToggled(scenarioExecution.id);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should not update the keptExecution flag of other executions in history when call to scenario execution service returns an error", () => {
      jest
        .spyOn(scenarioExecutionService, "toggleKeptExecutionFlag")
        .mockReturnValue(throwError(() => errorMessage));
      stateService.testUnit.set({
        scenarioExecutions: [scenarioExecution, scenarioExecution2],
      });
      component.handleKeptExecutionToggled(scenarioExecution.id);
      stateService.setKeptExecutionForTestUnitScenarioExecution.mock.calls.forEach(
        (call: [string, boolean]) => {
          expect(call[0]).toBe(scenarioExecutionId);
        }
      );
    });

    it("should not update the keptExecution flag of other executions in history when call to scenario execution service is successful", () => {
      stateService.testUnit.set({
        scenarioExecutions: [getUnkeptScenarioExecution(), scenarioExecution2],
      });
      component.handleKeptExecutionToggled(scenarioExecutionId);
      stateService.setKeptExecutionForTestUnitScenarioExecution.mock.calls.forEach(
        (call: [string, boolean]) => {
          expect(call[0]).toBe(scenarioExecutionId);
        }
      );
    });
  });

  function getAnalysisStatusEligibility(): AnalysisStatusEligibility {
    return {
      isUpdateEligible: true,
      updateIneligibilityReason:
        AnalysisStatusUpdateIneligibilityReason.SCENARIO_EXECUTION_PASSED,
      nextAnalysisStatuses: [
        {
          analysisStatus: ScenarioAnalysisStatus.NA,
          isEligible: true,
        },
        {
          analysisStatus: ScenarioAnalysisStatus.FAILED,
          isEligible: false,
        },
        {
          analysisStatus: ScenarioAnalysisStatus.PASSED,
          isEligible: false,
        },
        {
          analysisStatus: ScenarioAnalysisStatus.CANCELLED,
          isEligible: false,
        },
      ],
    };
  }

  function getUnkeptScenarioExecution() {
    return {
      id: scenarioExecutionId,
      comment: comment,
      status: ScenarioExecutionStatus.PASSED,
      assignee: assignee,
      scenarioDefinitionId: scenarioDefinitionId,
      validation: {
        scope: {
          referenceFactoryProductId: referenceFactoryProductId,
          requestedFactoryProductId: requestedFactoryProductId,
        },
        jumpType: jumpType,
      },
      keptExecution: false,
    } as unknown as ScenarioExecution;
  }

  function getUser() {
    return {
      id: "id",
      displayName: "displayName",
      mail: "mail",
    };
  }
});
