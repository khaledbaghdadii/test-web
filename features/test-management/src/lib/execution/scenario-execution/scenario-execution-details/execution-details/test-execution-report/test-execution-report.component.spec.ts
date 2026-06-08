import {
  TestCaseExecutionAnalysisStatusDropdownComponent,
  TestExecutionReportComponent,
  TestExecutionWebEngineReportComponent,
  UpdateReferenceTableComponent,
} from "@mxflow/test-management";
import { TransferToReconProgressTableComponent } from "@mxevolve/domains/test/widget";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ToastMessageService } from "@mxflow/ui/alert";
import { screen, waitFor } from "@testing-library/angular";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { Provider, signal } from "@angular/core";
import { TestCaseExecutionStatus } from "../../../../test-case-execution/status/test-case-execution-status";
import { TestCaseExecution } from "../../../../test-case-execution/test-case-execution";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution-state-management.service";
import { ButtonModule } from "primeng/button";
import { HeaderTitleComponent } from "@mxflow/ui/header";
import { CardContainerModule } from "@mxflow/ui/container";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { DomTestUtils } from "@mxevolve/testing";
import { TabsModule } from "primeng/tabs";
import { ResizeObserver } from "@juggle/resize-observer";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

(
  window as unknown as { ResizeObserver: typeof ResizeObserver }
).ResizeObserver = ResizeObserver;

const projectId = "project id";
const scenarioExecutionId = "scenarioExecutionId";
const testExecutionId = "test execution id";
const routeParams = new Map(
  Object.entries({
    projectId: projectId,
    "scenario-execution-id": scenarioExecutionId,
    "test-execution-id": testExecutionId,
  })
);

describe("TestExecutionReportComponent", () => {
  let component: TestExecutionReportComponent;
  let activatedRoute: ActivatedRoute;
  let activatedRouteParams: jest.SpyInstance;
  let router: Router;
  let toastMessageService: ToastMessageService;
  let stateServiceMockProvider: Provider;
  let authorizationServiceMock: jest.Mocked<AuthorizationService>;
  let fixture: MockedComponentFixture<TestExecutionReportComponent>;
  let featureFlagResolverMock: { isFeatureEnabled: jest.Mock };

  beforeEach(async () => {
    featureFlagResolverMock = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    };
    stateServiceMockProvider = {
      provide: ScenarioExecutionStateManagementService,
      useValue: {
        webReportCurrentlyViewedTestCaseExecution: signal({
          id: "testCaseExecutionId2",
          projectId: "proj-124",
          testExecutionId: "exec-457",
          externalId: "ext-790",
          testCaseKey: "TC-002",
          functionalTestCaseId: "FTC-102",
          scenarioExecutionId: "SE-203",
          title: "Signup Test",
          description: "Test for user signup functionality",
          status: TestCaseExecutionStatus.FAILED,
          startDate: "2025-04-08T14:10:00.000Z",
          endDate: "2025-04-08T14:15:00.000Z",
        } as TestCaseExecution),
        getTestCaseExecutions$: jest.fn().mockReturnValue(of([])),
        refreshAnalysisObjectLinks$: jest.fn().mockReturnValue(of(undefined)),
      },
    };

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn().mockReturnValue({}),
        },
      },
    } as unknown as ActivatedRoute;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;
    router = {
      navigate: jest.fn(),
    } as unknown as Router;
    activatedRouteParams = jest.spyOn(activatedRoute.snapshot.paramMap, "get");
    activatedRouteParams.mockImplementation((input) => routeParams.get(input));
    authorizationServiceMock = {
      isAuthorized: jest.fn(() => of(true)),
    } as unknown as jest.Mocked<AuthorizationService>;

    await MockBuilder(TestExecutionReportComponent)
      .provide(stateServiceMockProvider)
      .provide({
        provide: AuthorizationService,
        useValue: authorizationServiceMock,
      })
      .keep(TabsModule)
      .keep(RouterModule.forRoot([]))
      .mock(Router, router)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ToastMessageService, toastMessageService)
      .keep(ShowElementIfAuthorizedDirective)
      .mock(HeaderTitleComponent)
      .mock(TestCaseExecutionAnalysisStatusDropdownComponent)
      .mock(TestExecutionWebEngineReportComponent)
      .mock(UpdateReferenceTableComponent)
      .mock(TransferToReconProgressTableComponent)
      .keep(CardContainerModule)
      .keep(ButtonModule)
      .provide({
        provide: FeatureFlagResolver,
        useValue: featureFlagResolverMock,
      });

    fixture = MockRender(TestExecutionReportComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should read route params correctly", () => {
    expect(component.projectId).toEqual(projectId);
    expect(component.scenarioExecutionId).toEqual(scenarioExecutionId);
    expect(component.testExecutionId).toEqual(testExecutionId);
  });

  it("should have empty route params if they were not set", async () => {
    activatedRouteParams = jest.spyOn(activatedRoute.snapshot.paramMap, "get");
    activatedRouteParams.mockImplementation(() => undefined);

    fixture = MockRender(TestExecutionReportComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    expect(component.projectId).toEqual("");
    expect(component.scenarioExecutionId).toEqual("");
    expect(component.testExecutionId).toEqual("");
  });

  it("handle error delegates to toast message service error method", () => {
    const errorMessage = "error message";
    component.handleError(errorMessage);
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should reload test case executions from state service when the status updated event is triggered", () => {
    component.onStatusUpdated();
    expect(component.stateService.getTestCaseExecutions$).toHaveBeenCalled();
  });

  it("should reload analysis object links from state service when the status updated event is triggered", () => {
    component.onStatusUpdated();
    expect(
      component.stateService.refreshAnalysisObjectLinks$
    ).toHaveBeenCalled();
  });

  it("should navigate back correctly", () => {
    component.back();
    expect(router.navigate).toHaveBeenCalledWith(
      [`/app/${projectId}/test/execution/details/${scenarioExecutionId}`],
      { replaceUrl: true }
    );
  });

  it("test case analysis status dropdown should be rendered if authorized", () => {
    fixture.detectChanges();
    const dropdown = fixture.debugElement.query(
      By.css('[data-testid="update-test-case-analysis-status"]')
    );
    const showElementDirective = ngMocks.get(
      dropdown,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "update_analysis_status",
      attributes: {},
      package: "test",
      resource: "test_case_execution",
    });
  });

  it("should pass test case execution from state service to analysis status dropdown component", () => {
    fixture.detectChanges();
    const expectedTestCaseExecution =
      component.stateService.webReportCurrentlyViewedTestCaseExecution();
    expect(
      DomTestUtils.getElementByType(
        fixture,
        TestCaseExecutionAnalysisStatusDropdownComponent
      ).getInstance().testCaseExecution
    ).toEqual(expectedTestCaseExecution);
  });

  it("renders the Update Reference tab when authorized", async () => {
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: /Update Reference/i })
      ).toBeTruthy()
    );
    const transferToReconTab = fixture.debugElement.query(
      By.css('p-tab[value="update-reference"]')
    );
    const showElementDirective = ngMocks.get(
      transferToReconTab,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "read",
      attributes: {},
      package: "test",
      resource: "update_reference",
    });
  });

  it("renders the Transfer to Recon Progress tab when authorized", async () => {
    fixture.detectChanges();

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /Transfer to Recon Progress/i })
      ).toBeTruthy();
    });

    const transferToReconTab = fixture.debugElement.query(
      By.css('p-tab[value="transfer-progress"]')
    );
    const showElementDirective = ngMocks.get(
      transferToReconTab,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "fetch_recon_report_transfer_progress",
      attributes: {},
      package: "test",
      resource: "scenario_execution",
    });
  });

  it("hides the Transfer to Recon Progress tab when not authorized", async () => {
    authorizationServiceMock.isAuthorized.mockImplementation(() => of(false));

    MockRender(TestExecutionReportComponent);
    fixture.detectChanges();

    await waitFor(() =>
      expect(
        screen.queryByRole("tab", { name: /Transfer to Recon Progress/i })
      ).toBeNull()
    );
  });

  it("hides the Transfer to Recon Progress tab when the transfer-to-recon feature flag is disabled", async () => {
    featureFlagResolverMock.isFeatureEnabled.mockResolvedValue(false);

    const newFixture = MockRender(TestExecutionReportComponent);
    newFixture.detectChanges();

    await waitFor(() => {
      expect(featureFlagResolverMock.isFeatureEnabled).toHaveBeenCalledWith(
        projectId,
        "transfer-to-recon"
      );
    });
    expect(
      screen.queryByRole("tab", { name: /Transfer to Recon Progress/i })
    ).toBeNull();
  });
  it("hides the Update Reference tab when not authorized", async () => {
    authorizationServiceMock.isAuthorized.mockImplementation(() => of(false));

    MockRender(TestExecutionReportComponent);
    fixture.detectChanges();

    await waitFor(() =>
      expect(
        screen.queryByRole("tab", { name: /Update Reference/i })
      ).toBeNull()
    );
  });

  it("should render the transfer to recon with the needed inputs", () => {
    const reconProgressTable = ngMocks.find(
      TransferToReconProgressTableComponent
    );

    expect(reconProgressTable.componentInstance.projectId).toEqual(projectId);
    expect(reconProgressTable.componentInstance.testExecutionId).toEqual(
      testExecutionId
    );
    expect(reconProgressTable.componentInstance.scenarioExecutionId).toEqual(
      scenarioExecutionId
    );
  });

  it("should authorize the Update Reference tab panel with the correct configuration", async () => {
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: /Update Reference/i })
      ).toBeTruthy()
    );

    const tabPanel = fixture.debugElement.query(
      By.css('p-tabpanel[value="update-reference"]')
    );
    const showElementDirective = ngMocks.get(
      tabPanel,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "read",
      attributes: {},
      package: "test",
      resource: "update_reference",
    });
  });

  it("should authorize the Transfer to Recon Progress tab panel with the correct configuration", async () => {
    fixture.detectChanges();

    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: /Transfer to Recon Progress/i })
      ).toBeTruthy()
    );

    const tabPanel = fixture.debugElement.query(
      By.css('p-tabpanel[value="transfer-progress"]')
    );
    const showElementDirective = ngMocks.get(
      tabPanel,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "fetch_recon_report_transfer_progress",
      attributes: {},
      package: "test",
      resource: "scenario_execution",
    });
  });

  it("should hide the Update Reference tab panel when not authorized", async () => {
    authorizationServiceMock.isAuthorized.mockImplementation(() => of(false));

    MockRender(TestExecutionReportComponent);
    fixture.detectChanges();

    await waitFor(() =>
      expect(screen.queryByTestId("update-reference-table")).toBeNull()
    );
  });

  it("should hide the Transfer to Recon Progress tab panel when not authorized", async () => {
    authorizationServiceMock.isAuthorized.mockImplementation(() => of(false));

    MockRender(TestExecutionReportComponent);
    fixture.detectChanges();

    await waitFor(() =>
      expect(
        screen.queryByTestId("transfer-to-recon-progress-table")
      ).toBeNull()
    );
  });
});
