import { TableModule } from "primeng/table";
import { signal, WritableSignal } from "@angular/core";
import {
  projectId,
  scenarioExecution,
  scenarioExecutionId,
} from "../../../scenario-execution-test-utils";
import { Router, RouterModule } from "@angular/router";
import {
  TestExecution,
  TestExecutionMode,
  TestExecutionStatus,
} from "@mxflow/test-management";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution-state-management.service";
import { TestExecutionsGridComponent } from "./test-executions-grid.component";
import { Tooltip, TooltipModule } from "primeng/tooltip";
import { By } from "@angular/platform-browser";
import { TestExecutionStatusComponent } from "../../../test-result-status/test-execution-status.component";
import { SplitButton, SplitButtonModule } from "primeng/splitbutton";
import { MenuItemCommandEvent } from "primeng/api";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { TestExecutionHasReportMenuItemsPipe } from "./test-execution-has-report-menu-items.pipe";
import { NgClass, NgTemplateOutlet } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ProjectService } from "@mxflow/features/project";
import { of } from "rxjs";
import { DomTestUtils } from "@mxevolve/testing";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

const FIRST_TEST_EXECUTION = {
  id: "title",
  testPackageDefinitionName: "string",
  report: {
    url: "report",
    completeReportUrl: "bombardino",
    uploading: false,
  },
  testPackageRunLocation: "crocodilo",
  status: TestExecutionStatus.FAILED,
  startDate: "2025-04-14T08:38:42.105976Z",
  endDate: "2025-04-14T08:39:50.054953Z",
  isExecutionEnded: true,
  executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
  nameUponExecution: "",
  testSelectionNames: [],
  testPackageDefinitionId: "",
} as TestExecution;

const SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE = {
  id: "id",
  testPackageDefinitionName: "string",
  report: {
    url: "bombardino",
    completeReportUrl: "undefined",
    performanceReportUrl: "performanceReportUrl",
    uploading: false,
  },
  testPackageRunLocation: "crocodilo",
  status: TestExecutionStatus.PASSED,
  startDate: "2025-04-14T08:38:42.105976Z",
  endDate: "2025-04-14T08:39:50.054953Z",
  isExecutionEnded: true,
  executionMode: TestExecutionMode.WEB_TEST_ENGINE,
  nameUponExecution: "",
  testSelectionNames: [],
  testPackageDefinitionId: "",
} as TestExecution;

const THIRD_TEST_EXECUTION_PASSED_LEGACY = {
  id: "title",
  testPackageDefinitionName: "string",
  report: {
    url: "bombardino",
    completeReportUrl: "undefined",
    uploading: false,
  },
  testPackageRunLocation: "crocodilo",
  status: TestExecutionStatus.PASSED,
  startDate: "2025-04-14T08:38:42.105976Z",
  endDate: "2025-04-14T08:39:50.054953Z",
  isExecutionEnded: true,
  executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
  nameUponExecution: "",
  testSelectionNames: [],
  testPackageDefinitionId: "",
} as TestExecution;

const FOURTH_TEST_EXECUTION_UNDERWAY = {
  id: "title",
  testPackageDefinitionName: "string",
  report: {
    url: "report",
    completeReportUrl: "report",
    uploading: false,
  },
  testPackageRunLocation: "crocodilo",
  status: TestExecutionStatus.UNDERWAY,
  startDate: "2025-04-14T08:38:42.105976Z",
  endDate: "2025-04-14T08:39:50.054953Z",
  isExecutionEnded: true,
  executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
  nameUponExecution: "",
  testSelectionNames: [],
  testPackageDefinitionId: "",
} as TestExecution;

const TEST_EXECUTIONS = [FIRST_TEST_EXECUTION];

describe("test result table", () => {
  let component: TestExecutionsGridComponent;
  let fixture: MockedComponentFixture<TestExecutionsGridComponent>;
  let stateServiceMock: any;
  let router: Router;
  let isLoading: WritableSignal<boolean>;
  let projectService: ProjectService;
  let analyticsTrackerService: {
    trackDownloadConfiguration: jest.Mock;
    trackAccessHardwareMonitoringReport: jest.Mock;
    trackAccessPerformanceReport: jest.Mock;
    trackAccessTestCaseSummary: jest.Mock;
  };
  const testExecutionHasReportMenuItemsPipeTransform = jest
    .fn()
    .mockReturnValue(true);

  beforeEach(async () => {
    isLoading = signal(false);
    stateServiceMock = {
      projectId: signal(projectId),
      scenarioExecutionId: signal(scenarioExecutionId),
      scenarioExecution: signal(scenarioExecution),
      isScenarioExecutionDetailsLoading: isLoading,
    };

    router = {
      navigate: jest.fn(),
    } as unknown as Router;

    projectService = {
      getFeatureToggle: jest.fn(() =>
        of({
          id: "hardware-monitoring",
          toggledOn: false,
        })
      ),
    } as unknown as ProjectService;

    analyticsTrackerService = {
      trackDownloadConfiguration: jest.fn(),
      trackAccessHardwareMonitoringReport: jest.fn(),
      trackAccessPerformanceReport: jest.fn(),
      trackAccessTestCaseSummary: jest.fn(),
    };

    await MockBuilder(TestExecutionsGridComponent)
      .keep(Tooltip)
      .keep(TooltipModule)
      .keep(TableModule)
      .keep(NgTemplateOutlet)
      .keep(TestExecutionStatusComponent)
      .keep(NgClass)
      .keep(SplitButtonModule)
      .keep(ButtonModule)
      .keep(RouterModule.forRoot([]))
      .mock(ScenarioExecutionStateManagementService, stateServiceMock)
      .mock(Router, router)
      .mock(
        TestExecutionHasReportMenuItemsPipe,
        testExecutionHasReportMenuItemsPipeTransform
      )
      .mock(ProjectService, projectService)
      .mock(TestManagementAnalyticsTrackerService, analyticsTrackerService);

    fixture = MockRender(TestExecutionsGridComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize the project id correctly", () => {
    expect(component.projectId()).toEqual(projectId);
  });

  it("should initialize the scenario execution correctly", () => {
    expect(component.scenarioExecution()).toEqual(scenarioExecution);
  });

  it("should initialize the report menu items to an empty list", () => {
    expect(component.reportMenuItems).toEqual([]);
  });

  it("should display correct template while loading", () => {
    isLoading.set(true);

    fixture.detectChanges();

    const loadingTemplate = fixture.debugElement.query(
      By.css('[id="loadingTemplateBody"]')
    );
    expect(loadingTemplate).toBeTruthy();
  });

  it("should display correct template when executions are empty", () => {
    component.scenarioExecution().testExecutions = [];
    fixture.detectChanges();
    const emptyMessage = fixture.debugElement.query(
      By.css("mxflow-table-empty-message")
    );
    expect(emptyMessage).toBeTruthy();
  });

  it("should display correct template when executions exist", () => {
    component.scenarioExecution().testExecutions = TEST_EXECUTIONS;

    fixture.detectChanges();

    const testExecutionsCards = fixture.debugElement.query(
      By.css('[id="testExecutionsCards"]')
    );
    expect(testExecutionsCards).toBeTruthy();
  });

  it("should display correct tooltip when downloading run", () => {
    component.scenarioExecution().testExecutions = [
      THIRD_TEST_EXECUTION_PASSED_LEGACY,
    ];

    fixture.detectChanges();

    const downloadLink = fixture.debugElement.query(
      By.css('a[rel="noopener"]')
    );
    const event = new Event("mouseenter");
    downloadLink.nativeElement.dispatchEvent(event);

    const tooltipContent = fixture.debugElement.query(
      By.css('[id="tooltipContentLegacy"]')
    );
    expect(tooltipContent).toBeTruthy();
  });

  it("should display correct tooltip when downloading test configuration", () => {
    component.scenarioExecution().testExecutions = [
      SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
    ];

    fixture.detectChanges();

    const downloadLink = fixture.debugElement.query(
      By.css('a[rel="noopener"]')
    );
    const event = new Event("mouseenter");
    downloadLink.nativeElement.dispatchEvent(event);

    const tooltipContent = fixture.debugElement.query(
      By.css('[id="tooltipContentWebEngine"]')
    );
    expect(tooltipContent).toBeTruthy();
  });

  it.each(Object.values(TestExecutionStatus))(
    "should display correct status",
    (statusValue) => {
      const TEST_EXECUTION_VARIABLE_STATUS = {
        id: "title",
        testPackageDefinitionName: "string",
        report: {
          url: "report",
          completeReportUrl: "report",
          uploading: false,
        },
        testPackageRunLocation: "crocodilo",
        status: statusValue,
        startDate: "2025-04-14T08:38:42.105976Z",
        endDate: "2025-04-14T08:39:50.054953Z",
        isExecutionEnded: true,
        executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
        nameUponExecution: "",
        testSelectionNames: [],
        testPackageDefinitionId: "",
      } as TestExecution;
      component.scenarioExecution().testExecutions = [
        TEST_EXECUTION_VARIABLE_STATUS,
      ];
      expect(
        DomTestUtils.getElementByType(
          fixture,
          TestExecutionStatusComponent
        ).getInstance().status
      ).toBe(statusValue);
    }
  );

  it("should disable download when underway", () => {
    component.scenarioExecution().testExecutions = [
      FOURTH_TEST_EXECUTION_UNDERWAY,
    ];

    fixture.detectChanges();

    const downloadLink = fixture.debugElement.query(
      By.css('a[rel="noopener"]')
    );
    expect(downloadLink.nativeElement.classList).toContain("p-disabled");
    expect(downloadLink.nativeElement.classList).toContain("opacity-30");
  });

  it("should display dash when start date is null", () => {
    component.scenarioExecution().testExecutions = [
      {
        id: "title",
        testPackageDefinitionName: "string",
        report: {
          url: "ballerina",
          completeReportUrl: "report",
          uploading: false,
        },
        testPackageRunLocation: "crocodilo",
        status: TestExecutionStatus.UNDERWAY,
        startDate: null,
        endDate: "2025-04-14T08:39:50.054953Z",
        isExecutionEnded: true,
        executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
        nameUponExecution: "",
        testSelectionNames: [],
        testPackageDefinitionId: "",
      } as unknown as TestExecution,
    ];

    fixture.detectChanges();

    const startDate = fixture.debugElement.query(By.css('[id="startDate"]'));

    expect(startDate.nativeElement.textContent).toContain("-");
  });

  it("should display dash when end date is null", () => {
    component.scenarioExecution().testExecutions = [
      {
        id: "title",
        testPackageDefinitionName: "string",
        report: {
          url: "ballerina",
          completeReportUrl: "report",
          uploading: false,
        },
        testPackageRunLocation: "crocodilo",
        status: TestExecutionStatus.UNDERWAY,
        endDate: null,
        startDate: "2025-04-14T08:39:50.054953Z",
        isExecutionEnded: true,
        executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
        nameUponExecution: "",
        testSelectionNames: [],
        testPackageDefinitionId: "",
      } as unknown as TestExecution,
    ];

    fixture.detectChanges();

    const endDate = fixture.debugElement.query(By.css('[id="endDate"]'));
    expect(endDate.nativeElement.textContent).toContain("-");
  });

  it("should navigate to the test case executions summary report when the user clicks the button", () => {
    stateServiceMock.scenarioExecution.set({
      ...scenarioExecution,
      testExecutions: [
        {
          ...TEST_EXECUTIONS[0],
          executionMode: TestExecutionMode.WEB_TEST_ENGINE,
        },
      ],
    });
    getViewSummaryReportButtonHarness().click();
    expect(router.navigate).toHaveBeenCalledWith(
      [
        `/app/${projectId}/test/execution/details/${scenarioExecution.id}/${TEST_EXECUTIONS[0].id}/test-case-executions-summary-report`,
      ],
      { replaceUrl: true }
    );
  });

  it("should display the view summary report button if the test was executed using the web test engine", () => {
    stateServiceMock.scenarioExecution.set({
      ...scenarioExecution,
      testExecutions: [
        FIRST_TEST_EXECUTION,
        SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
      ],
    });
    fixture.detectChanges();
    const summaryReportButton = fixture.debugElement.query(
      By.css(
        `[data-testid=view-test-case-executions-button-${SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.id}]`
      )
    );
    expect(summaryReportButton).toBeTruthy();
  });

  it("should hide the view summary report button if the test was executed using the legacy test engine", () => {
    stateServiceMock.scenarioExecution.set({
      ...scenarioExecution,
      testExecutions: [
        FIRST_TEST_EXECUTION,
        SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
      ],
    });
    fixture.detectChanges();
    const summaryReportButton = fixture.debugElement.query(
      By.css(
        `[data-testid=view-test-case-executions-button-${FIRST_TEST_EXECUTION.id}]`
      )
    );
    expect(summaryReportButton).toBeFalsy();
  });

  it("should set the hardware monitoring flag to false and not fetch hardware monitoring feature flag if project id is not provided", () => {
    jest
      .spyOn(projectService, "getFeatureToggle")
      .mockClear()
      .mockReturnValue(of({ toggledOn: true, id: "" }));
    stateServiceMock.projectId.set(undefined);
    fixture.detectChanges();
    expect(projectService.getFeatureToggle).not.toHaveBeenCalled();
    expect(component.isHardwareMonitoringFeatureEnabled).toBeFalsy();
  });

  it.each([true, false])(
    "should set the hardware monitoring feature enabled flag to %o upon setting the project id",
    (toggledOn: boolean) => {
      jest
        .spyOn(projectService, "getFeatureToggle")
        .mockReturnValueOnce(
          of({ id: "hardware-monitoring", toggledOn: toggledOn })
        );
      stateServiceMock.projectId.set(undefined);
      fixture.detectChanges();
      stateServiceMock.projectId.set(projectId);
      fixture.detectChanges();
      expect(projectService.getFeatureToggle).toHaveBeenCalledWith(
        projectId,
        "hardware-monitoring"
      );
      expect(component.isHardwareMonitoringFeatureEnabled).toBe(toggledOn);
    }
  );

  describe("showReportOptions", () => {
    const mockEvent = {} as MenuItemCommandEvent;

    it("should set the view performance report menu item label", () => {
      component.showReportOptions(SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE);
      expect(component.reportMenuItems[0].label).toBe("Performance Report");
    });

    it("Should navigate to performance report when the command is executed", () => {
      const windowSpy = jest.spyOn(window, "open");
      const performanceReportUrl = "performanceReportUrl";
      const testExecutionWithPerformanceReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          performanceReportUrl: performanceReportUrl,
        },
      };
      component.showReportOptions(testExecutionWithPerformanceReport);
      component.reportMenuItems[0].command?.(mockEvent);
      expect(windowSpy).toHaveBeenCalledWith(performanceReportUrl, "_blank");
    });

    it("should track access performance report when the command is executed", () => {
      const performanceReportUrl = "performanceReportUrl";
      const testExecutionWithPerformanceReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          performanceReportUrl: performanceReportUrl,
        },
      };
      component.showReportOptions(testExecutionWithPerformanceReport);
      component.reportMenuItems[0].command?.(mockEvent);
      expect(
        analyticsTrackerService.trackAccessPerformanceReport
      ).toHaveBeenCalled();
    });

    it("should not navigate to performance report when the command is executed and performance report url is undefined", () => {
      const windowSpy = jest.spyOn(window, "open");
      windowSpy.mockClear();
      const testExecutionWithoutPerformanceReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          performanceReportUrl: undefined,
        },
      };
      component.showReportOptions(testExecutionWithoutPerformanceReport);
      component.reportMenuItems[0].command?.(mockEvent);
      expect(windowSpy).not.toHaveBeenCalled();
    });

    it("should display the performance report menu item if the execution is an nft run and execution mode is WEB_TEST_ENGINE", () => {
      component.showReportOptions(SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE);
      expect(component.reportMenuItems[0].visible).toBeTruthy();
    });

    it("should not display the performance report menu item if the execution is not an nft run", () => {
      const testExecutionWithoutPerformanceReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          performanceReportUrl: undefined,
        },
      };
      component.showReportOptions(testExecutionWithoutPerformanceReport);
      expect(component.reportMenuItems[0].visible).toBeFalsy();
    });

    it("should not display the performance report menu item if the execution mode is a legacy execution", () => {
      const testExecutionWithLegacyMode = {
        ...FIRST_TEST_EXECUTION,
        executionMode: TestExecutionMode.LEGACY_TEST_ENGINE,
        report: {
          ...FIRST_TEST_EXECUTION.report,
          performanceReportUrl: "someUrl",
        },
      };
      component.showReportOptions(testExecutionWithLegacyMode);
      expect(component.reportMenuItems[0].visible).toBeFalsy();
    });

    it("should set the view hardware monitoring report menu item label", () => {
      component.showReportOptions({
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: "hardwareMonitoringReportUrl",
        },
      });
      expect(component.reportMenuItems[1].label).toBe(
        "Hardware Monitoring Report"
      );
    });

    it("should navigate to the hardware monitoring report when the command is executed", () => {
      const windowSpy = jest.spyOn(window, "open");
      const hardwareMonitoringReportUrl = "hardwareMonitoringReportUrl";
      component.showReportOptions({
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: hardwareMonitoringReportUrl,
        },
      });
      component.reportMenuItems[1].command?.(mockEvent);
      expect(windowSpy).toHaveBeenCalledWith(
        hardwareMonitoringReportUrl,
        "_blank"
      );
    });

    it("should track access hardware monitoring report when the command is executed", () => {
      const hardwareMonitoringReportUrl = "hardwareMonitoringReportUrl";
      component.showReportOptions({
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: hardwareMonitoringReportUrl,
        },
      });
      component.reportMenuItems[1].command?.(mockEvent);
      expect(
        analyticsTrackerService.trackAccessHardwareMonitoringReport
      ).toHaveBeenCalled();
    });

    it("should not navigate to the hardware monitoring report when the command is executed and hardware monitoring report url is undefined", () => {
      const windowSpy = jest.spyOn(window, "open");
      windowSpy.mockClear();
      const testExecutionWithoutHardwareMonitoringReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: undefined,
        },
      };
      component.showReportOptions(testExecutionWithoutHardwareMonitoringReport);
      component.reportMenuItems[1].command?.(mockEvent);
      expect(windowSpy).not.toHaveBeenCalled();
    });

    it("should not display the hardware monitoring report menu item if the hardware monitoring report url is undefined", () => {
      const testExecutionWithoutHardwareMonitoringReport = {
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: undefined,
        },
      };
      component.showReportOptions(testExecutionWithoutHardwareMonitoringReport);
      expect(component.reportMenuItems[1].visible).toBeFalsy();
    });

    it("should not display the hardware monitoring report menu item if the hardware monitoring report url is present but the feature is disabled", () => {
      component.isHardwareMonitoringFeatureEnabled = false;
      component.showReportOptions({
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: "hardwareMonitoringReportUrl",
        },
      });

      expect(component.reportMenuItems[1].visible).toBeFalsy();
    });

    it("should display the hardware monitoring report menu item if hardware monitoring report url is present and feature is toggled on", () => {
      component.isHardwareMonitoringFeatureEnabled = true;
      component.showReportOptions({
        ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE,
        report: {
          ...SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.report,
          hardwareMonitoringReportUrl: "hardwareMonitoringReportUrl",
        },
      });
      expect(component.reportMenuItems[1].visible).toBeTruthy();
    });
  });

  describe("navigateToReport", () => {
    it("should navigate to the legacy engine test execution report", () => {
      const windowsOpenSpy = jest.spyOn(window, "open");
      component.navigateToReport(FIRST_TEST_EXECUTION);
      expect(windowsOpenSpy).toHaveBeenCalledWith(
        FIRST_TEST_EXECUTION.report.url,
        "_blank"
      );
    });

    it("should navigate to the web engine test execution report", () => {
      component.navigateToReport(SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE);
      expect(router.navigate).toHaveBeenCalledWith(
        [
          `/app/${projectId}/test/execution/details/${scenarioExecution.id}/${SECOND_TEST_EXECUTION_PASSED_WEB_ENGINE.id}/report`,
        ],
        { replaceUrl: true }
      );
    });
  });

  describe("view report button", () => {
    it.each([true, false])(
      "should call the testExecutionHasReportMenuItems pipe to check which button to display",
      (isHardwareMonitoringToggledOn) => {
        component.isHardwareMonitoringFeatureEnabled =
          isHardwareMonitoringToggledOn;
        stateServiceMock.scenarioExecution.set({
          ...scenarioExecution,
          testExecutions: TEST_EXECUTIONS,
        });
        fixture.detectChanges();
        expect(
          testExecutionHasReportMenuItemsPipeTransform
        ).toHaveBeenCalledWith(
          FIRST_TEST_EXECUTION,
          component.isHardwareMonitoringFeatureEnabled
        );
      }
    );

    it("should display the normal view report button only when the test execution has neither hardware monitoring nor performance reports", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(false);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportButton = fixture.debugElement.query(
        By.css(
          `[data-testid=view-test-result-button-${FIRST_TEST_EXECUTION.id}]`
        )
      );
      expect(viewReportButton).toBeTruthy();
    });

    it("should not display the view report split button when the test execution has neither hardware monitoring nor performance reports", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(false);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      );
      expect(viewReportSplitButton).toBeFalsy();
    });

    it("should display the view report split button only when the test execution has hardware monitoring or performance reports", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      );
      expect(viewReportSplitButton).toBeTruthy();
    });

    it("should not display the view report button when the test execution has hardware monitoring or performance reports", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportButton = fixture.debugElement.query(
        By.css(
          `[data-testid=view-test-result-button${FIRST_TEST_EXECUTION.id}]`
        )
      );
      expect(viewReportButton).toBeFalsy();
    });

    it("should disable the view report button if the test execution has no report url", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(false);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: [{ ...FIRST_TEST_EXECUTION, report: { url: null } }],
      });
      expect(getViewResultButtonHarness().isDisabled()).toBeTruthy();
    });

    it("should enable the view report button if the test execution has a report url", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(false);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      expect(getViewResultButtonHarness().isDisabled()).toBeFalsy();
    });

    it("should navigate to the report url when the user clicks the view report button", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(false);
      jest.spyOn(component, "navigateToReport");
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      getViewResultButtonHarness().click();
      expect(component.navigateToReport).toHaveBeenCalledWith(
        FIRST_TEST_EXECUTION
      );
    });

    it("should navigate to the report url when the user clicks the split button", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      jest.spyOn(component, "navigateToReport");
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      ).componentInstance as SplitButton;
      viewReportSplitButton.onClick.emit();
      expect(component.navigateToReport).toHaveBeenCalledWith(
        FIRST_TEST_EXECUTION
      );
    });

    it("should populate the view report split button menu items when the dropdown is clicked", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      jest.spyOn(component, "showReportOptions");
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: TEST_EXECUTIONS,
      });
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      ).componentInstance as SplitButton;
      viewReportSplitButton.onDropdownClick.emit();
      expect(component.showReportOptions).toHaveBeenCalledWith(
        FIRST_TEST_EXECUTION
      );
    });

    it("should enable the view report split button if the report url is available", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      ).nativeElement;
      expect(viewReportSplitButton).toBeTruthy();
      expect(viewReportSplitButton.disabled).toBeFalsy();
    });

    it("should disable the view report split button if the report url is not available", () => {
      testExecutionHasReportMenuItemsPipeTransform.mockReturnValue(true);
      stateServiceMock.scenarioExecution.set({
        ...scenarioExecution,
        testExecutions: [{ ...FIRST_TEST_EXECUTION, report: { url: null } }],
      });
      fixture.detectChanges();
      const viewReportSplitButton = fixture.debugElement.query(
        By.directive(SplitButton)
      ).componentInstance as SplitButton;
      expect(viewReportSplitButton).toBeTruthy();
      expect(viewReportSplitButton.disabled).toBeTruthy();
    });
  });

  it("should display the test selection names if present", () => {
    component.scenarioExecution().testExecutions = [
      {
        ...FIRST_TEST_EXECUTION,
        testSelectionNames: ["Test Selection 1", "Test Selection 2"],
      },
    ];
    fixture.detectChanges();
    const testSelectionNames = fixture.debugElement.query(
      By.css('[id="testSelectionNames"]')
    );
    expect(testSelectionNames).toBeTruthy();
    expect(testSelectionNames.nativeElement.textContent).toContain(
      "Test Selection 1, Test Selection 2"
    );
  });

  it("should not display test selection names if not present", () => {
    component.scenarioExecution().testExecutions = [
      {
        ...FIRST_TEST_EXECUTION,
        testSelectionNames: [],
      },
    ];
    fixture.detectChanges();
    const testSelectionNames = fixture.debugElement.query(
      By.css('[id="testSelectionNames"]')
    );
    expect(testSelectionNames).toBeFalsy();
  });

  it("should track download configuration", () => {
    component.trackDownloadRun();
    expect(
      analyticsTrackerService.trackDownloadConfiguration
    ).toHaveBeenCalled();
  });

  it("should track access user action when navigating to the test case summary screen", () => {
    stateServiceMock.scenarioExecution.set({
      ...scenarioExecution,
      testExecutions: [
        {
          ...TEST_EXECUTIONS[0],
          executionMode: TestExecutionMode.WEB_TEST_ENGINE,
        },
      ],
    });
    getViewSummaryReportButtonHarness().click();
    expect(
      analyticsTrackerService.trackAccessTestCaseSummary
    ).toHaveBeenCalled();
  });

  function getViewResultButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      `view-test-result-button-${FIRST_TEST_EXECUTION.id}`
    );
  }

  function getViewSummaryReportButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      `view-test-case-executions-button-${TEST_EXECUTIONS[0].id}`
    );
  }
});
