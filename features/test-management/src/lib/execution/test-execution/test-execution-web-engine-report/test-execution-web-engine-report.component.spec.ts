import { TestExecutionWebEngineReportComponent } from "./test-execution-web-engine-report.component";
import { delay, of, Subject, throwError } from "rxjs";
import {
  ScenarioExecution,
  TestExecution,
} from "../../scenario-execution/scenario-execution";
import { ScenarioExecutionHousekeepingStatus } from "@mxevolve/domains/test/model";
import { ScenarioExecutionService } from "../../scenario-execution/scenario-execution.service";
import { RunDetails, RunNodeType } from "@mxtest/reporting-data-models";
import {
  NodeDetails,
  ReportingTreeNodeData,
  RunNodeTypeDetails,
  RunTreeNodeModel,
} from "@mxtest/ui-tree";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { signal } from "@angular/core";
import { Environment, EnvironmentService } from "@mxflow/features/environment";
import { UpdateReferenceRepositoryPathMapper } from "../update-reference/update-reference-repository-path-mapper/update-reference-repository-path-mapper/update-reference-repository-path-mapper.service";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { TestCaseExecutionStatus } from "../../test-case-execution/status/test-case-execution-status";
import { UpdateReferenceModalComponent } from "../update-reference/update-reference-modal/update-reference-modal.component";
import { MockComponent, MockDirective, MockModule, ngMocks } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";
import { TransferToReconModalComponent } from "@mxevolve/domains/test/composite-widget";
import { ReconService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { render, screen, waitFor } from "@testing-library/angular";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ReportingComponent, ReportingModule } from "@mxtest/reporting";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { SkeletonModule } from "primeng/skeleton";

const projectId = "project id";
const scenarioExecutionId = "scenarioExecutionId";
const testExecutionId = "test execution id";
const testExecutionNameUponExecution = "test execution name upon execution";
const liveReportUrl = "live report url";
const completeReport = `http://repoting-service`;
const archivedReport = { key1: "123" } as unknown as RunDetails;
const getScenarioExecution = () => {
  return {
    branch: "branch",
    cleaningStatus: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
    environmentId: "environment id 1",
    rtpCommitId: "rtp commit",
    scenarioDefinitionId: "scenario-def-1",
    testExecutions: [
      {
        id: "non matching test execution id",
        nameUponExecution: "incorrect test execution",
      },
      {
        id: testExecutionId,
        nameUponExecution: testExecutionNameUponExecution,
        report: {
          completeReportUrl: completeReport,
          url: liveReportUrl,
        },
        isExecutionEnded: false,
      },
      {
        id: "non matching test execution id 2",
        nameUponExecution: "incorrect test execution 2",
      },
    ],
  } as ScenarioExecution;
};
const environmentTestDirectory = "test-directory-1";
const testDirectory = "test-directory-1/testRunner";
const expectedFilePathOnRepo = "common/mxtets/test_packages/batata";
const repositories = [
  {
    id: "id1",
    name: "name1",
    url: "url1",
    credentialsId: "credentialsId1",
    label: "label1",
    defaultBranch: "defaultBranch1",
  } as Repository,
  {
    id: "id2",
    name: "name2",
    url: "url2",
    credentialsId: "credentialsId2",
    label: "label2",
    defaultBranch: "defaultBranch2",
  } as Repository,
] as Repository[];
const TEST_CASE_EXECUTION_1 = {
  id: "testCaseExecutionId1",
  projectId: "proj-123",
  testExecutionId: "testExecutionId1",
  externalId: "ext-789",
  testCaseKey: "TC-001",
  functionalTestCaseId: "FTC-101",
  scenarioExecutionId: "SE-202",
  title: "Login Test",
  description: "Test for user login functionality",
  status: TestCaseExecutionStatus.UNDERWAY,
  startDate: "2025-04-08T13:57:47.345Z",
  endDate: "2025-04-08T14:00:00.000Z",
} as TestCaseExecution;

const TEST_CASE_EXECUTION_2 = {
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
} as TestCaseExecution;

describe("TestExecutionWebEngineReportComponent", () => {
  const mockScenarioExecutionService = {
    fetchArchivedReport: jest.fn(),
    getScenarioExecution: jest.fn(),
  };
  const mockAuthorizationService = {
    isAuthorized: jest.fn(),
  };
  const mockEnvironmentService = {
    getEnvironmentExecutionById: jest.fn(),
  };
  const mockRepositoryService = {
    getAllRepositories: jest.fn(),
  };
  const mockUpdateReferenceRepoPathMapper = {
    map: jest.fn(),
  };
  const mockStateService = {
    setWebReportSelectedTestCaseExecutions: jest.fn(),
    setWebReportCurrentlyViewedTestCaseExecution: jest.fn(),
    setCurrentlyViewedTestExecutionId: jest.fn(),
    analyzableTestCaseExecutions: signal<TestCaseExecution[]>([
      getFirstTestCaseExecution(),
      getSecondTestCaseExecution(),
    ]),
    validationScope: signal(undefined),
    validationScopeWarningMessage: signal(undefined),
  };
  const mockReconService = {
    transferToRecon: jest.fn(),
  };
  const mockToastMessageService = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
  };
  const mockFeatureFlagResolver = {
    isFeatureEnabled: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
      of(getScenarioExecution())
    );
    mockScenarioExecutionService.fetchArchivedReport.mockReturnValue(
      of(archivedReport)
    );
    mockAuthorizationService.isAuthorized.mockReturnValue(of(true));
    mockEnvironmentService.getEnvironmentExecutionById.mockReturnValue(
      of({ tests: [{ directory: environmentTestDirectory }] })
    );
    mockRepositoryService.getAllRepositories.mockReturnValue(of(repositories));
    mockUpdateReferenceRepoPathMapper.map.mockReturnValue(
      expectedFilePathOnRepo
    );
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
  });

  async function renderComponent() {
    return render(TestExecutionWebEngineReportComponent, {
      detectChangesOnRender: false,
      inputs: { projectId, scenarioExecutionId, testExecutionId },
      componentImports: [
        MockModule(ReportingModule),
        MockModule(CardContainerModule),
        MockModule(HeaderTitleModule),
        MockModule(SkeletonModule),
        MockComponent(UpdateReferenceModalComponent),
        MockDirective(ShowElementIfAuthorizedDirective),
        MockComponent(TransferToReconModalComponent),
      ],
      componentProviders: [
        {
          provide: ScenarioExecutionService,
          useValue: mockScenarioExecutionService,
        },
        {
          provide: AuthorizationService,
          useValue: mockAuthorizationService,
        },
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
        {
          provide: UpdateReferenceRepositoryPathMapper,
          useValue: mockUpdateReferenceRepoPathMapper,
        },
        {
          provide: RepositoryService,
          useValue: mockRepositoryService,
        },
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: mockStateService,
        },
        {
          provide: ReconService,
          useValue: mockReconService,
        },
        {
          provide: ToastMessageService,
          useValue: mockToastMessageService,
        },
        {
          provide: FeatureFlagResolver,
          useValue: mockFeatureFlagResolver,
        },
      ],
    });
  }

  it("should create", async () => {
    const { fixture } = await renderComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should fetch the scenario execution", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    expect(
      mockScenarioExecutionService.getScenarioExecution
    ).toHaveBeenCalledWith(projectId, scenarioExecutionId);
  });

  it("should throw error if failed to fetch scenario execution", async () => {
    const message = "error message";
    mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
      throwError(() => new Error(message))
    );
    const { fixture } = await renderComponent();
    const errorMessageEmitter = jest.spyOn(
      fixture.componentInstance.errorMessage,
      "emit"
    );
    fixture.detectChanges();
    expect(errorMessageEmitter).toHaveBeenCalledWith(message);
  });

  it("should display error toast in case the requested test execution does not belong to the scenario execution", async () => {
    const scenarioExecution = getScenarioExecution();
    scenarioExecution.testExecutions[1].id = "other id";
    mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
      of(scenarioExecution)
    );
    const { fixture } = await renderComponent();
    const errorMessageEmitter = jest.spyOn(
      fixture.componentInstance.errorMessage,
      "emit"
    );
    fixture.detectChanges();
    await waitFor(() =>
      expect(errorMessageEmitter).toHaveBeenCalledWith(
        "The requested test execution does not exist on the provided scenario execution"
      )
    );
  });

  it("should set the package id correctly", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    await waitFor(() =>
      expect(fixture.componentInstance.packageId).toEqual(
        testExecutionNameUponExecution
      )
    );
  });

  it("should set the commit id correctly", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    await waitFor(() =>
      expect(fixture.componentInstance.commitId).toEqual(
        getScenarioExecution().rtpCommitId
      )
    );
  });

  it("should build the previously linked filter from the selected test case execution and scenario definition", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    const reportComponent = ngMocks.find(
      fixture,
      ReportingComponent
    ).componentInstance;

    ngMocks
      .findInstances(fixture, ShowElementIfAuthorizedDirective)
      .forEach((authDirective) => ngMocks.render(authDirective, authDirective));
    fixture.detectChanges();

    reportComponent.onSelectTreeNodes?.action({
      testCases: [{ uuid: getFirstTestCaseExecution().externalId }],
    } as unknown as ReportingTreeNodeData);
    fixture.detectChanges();

    const updateReferenceModal = ngMocks.find(
      fixture,
      UpdateReferenceModalComponent
    ).componentInstance;
    expect(updateReferenceModal.previouslyLinkedFilter).toEqual({
      testCaseExternalIds: [getFirstTestCaseExecution().externalId],
      scenarioDefinitionId: getScenarioExecution().scenarioDefinitionId,
    });
  });

  it("should build the previously linked filter with no external ids when no test case execution is selected", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();

    ngMocks
      .findInstances(fixture, ShowElementIfAuthorizedDirective)
      .forEach((authDirective) => ngMocks.render(authDirective, authDirective));
    fixture.detectChanges();

    const updateReferenceModal = ngMocks.find(
      fixture,
      UpdateReferenceModalComponent
    ).componentInstance;
    expect(updateReferenceModal.previouslyLinkedFilter).toEqual({
      testCaseExternalIds: [],
      scenarioDefinitionId: getScenarioExecution().scenarioDefinitionId,
    });
  });

  it("should set testCaseExecutionId when a tree node with test case is selected", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    const nodeData = {
      testCases: [{ uuid: getFirstTestCaseExecution().externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution()?.id).toEqual(
      getFirstTestCaseExecution().id
    );
  });

  it("should set most recent testCaseExecutionId when multiple tree nodes with test cases are selected", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testExecution = {
      id: TEST_CASE_EXECUTION_1.testExecutionId,
    } as unknown as TestExecution;
    const nodeData = {
      testCases: [
        { uuid: TEST_CASE_EXECUTION_2.externalId },
        { uuid: TEST_CASE_EXECUTION_1.externalId },
      ],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution()?.id).toEqual(TEST_CASE_EXECUTION_1.id);
  });

  it("should match selected test case against test execution id and external id", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testExecutionId = TEST_CASE_EXECUTION_1.testExecutionId;
    component.testCaseExecutions = signal([
      {
        id: TEST_CASE_EXECUTION_1.id,
        testExecutionId: TEST_CASE_EXECUTION_1.testExecutionId,
        externalId: TEST_CASE_EXECUTION_1.externalId,
      } as unknown as TestCaseExecution,
      {
        id: TEST_CASE_EXECUTION_2.id,
        testExecutionId: TEST_CASE_EXECUTION_2.testExecutionId,
        externalId: TEST_CASE_EXECUTION_1.externalId,
      } as unknown as TestCaseExecution,
    ]);
    const nodeData = {
      testCases: [{ uuid: TEST_CASE_EXECUTION_1.externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution()?.id).toEqual(TEST_CASE_EXECUTION_1.id);
  });

  it("should set testCaseExecutionId to undefined when test case execution is not persisted yet", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    const nodeData = {
      testCases: [{ uuid: "invalidId" }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution()?.id).not.toBeDefined();
  });

  describe("report during test execution", () => {
    it("should set the primary url to live report url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.primaryUrl).toEqual(liveReportUrl)
      );
    });

    it("should set the secondary url to the complete report url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.secondaryUrl).toEqual(completeReport)
      );
    });

    it("should have an empty archived report", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.isLoading).toBeFalsy()
      );
      expect(fixture.componentInstance.archivedReport).toEqual(undefined);
      expect(
        mockScenarioExecutionService.fetchArchivedReport
      ).not.toHaveBeenCalled();
    });

    it("should set is loading to false without fetching the archived report", async () => {
      const { fixture } = await renderComponent();
      const component = fixture.componentInstance;
      let isLoadingBefore = false;
      mockScenarioExecutionService.getScenarioExecution.mockImplementation(
        () => {
          isLoadingBefore = component.isLoading;
          return of(getScenarioExecution());
        }
      );
      fixture.detectChanges();
      await waitFor(() => expect(component.isLoading).toBeFalsy());
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("report after test execution completion before cleaning", () => {
    beforeEach(() => {
      const scenarioExecution = getScenarioExecution();
      scenarioExecution.testExecutions[1].isExecutionEnded = true;
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of(scenarioExecution)
      );
    });

    it("should set the primary url to complete report url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.primaryUrl).toEqual(completeReport)
      );
    });

    it("should not set the secondary url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.isLoading).toBeFalsy()
      );
      expect(fixture.componentInstance.secondaryUrl).toEqual(undefined);
    });

    it("should have a archived report", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(fixture.componentInstance.archivedReport).toEqual(
          archivedReport
        );
        expect(
          mockScenarioExecutionService.fetchArchivedReport
        ).toHaveBeenCalledWith(projectId, scenarioExecutionId, testExecutionId);
      });
    });

    it("should throw an error if failed to fetch archived report", async () => {
      const message = "error message";
      mockScenarioExecutionService.fetchArchivedReport.mockReturnValue(
        throwError(() => new Error(message))
      );
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      await waitFor(() =>
        expect(errorMessageEmitter).toHaveBeenCalledWith(message)
      );
    });

    it("should set is loading to false after fetching the archived report", async () => {
      const { fixture } = await renderComponent();
      const component = fixture.componentInstance;
      let isLoadingBefore = false;
      mockScenarioExecutionService.fetchArchivedReport.mockImplementation(
        () => {
          isLoadingBefore = component.isLoading;
          return of(archivedReport);
        }
      );
      fixture.detectChanges();
      await waitFor(() => expect(component.isLoading).toBeFalsy());
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("report after test execution completion and after scenario cleaning", () => {
    beforeEach(() => {
      const scenarioExecution = getScenarioExecution();
      scenarioExecution.cleaningStatus =
        ScenarioExecutionHousekeepingStatus.PASSED;
      scenarioExecution.testExecutions[1].isExecutionEnded = true;
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of(scenarioExecution)
      );
    });

    it("should not set the primary url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.isLoading).toBeFalsy()
      );
      expect(fixture.componentInstance.primaryUrl).toEqual(undefined);
    });

    it("should not set the secondary url", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.isLoading).toBeFalsy()
      );
      expect(fixture.componentInstance.secondaryUrl).toEqual(undefined);
    });

    it("should have a archived report", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(fixture.componentInstance.archivedReport).toEqual(
          archivedReport
        );
        expect(
          mockScenarioExecutionService.fetchArchivedReport
        ).toHaveBeenCalledWith(projectId, scenarioExecutionId, testExecutionId);
      });
    });

    it("should throw an error if failed to fetch archived report", async () => {
      const message = "error message";
      mockScenarioExecutionService.fetchArchivedReport.mockReturnValue(
        throwError(() => new Error(message))
      );
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      await waitFor(() =>
        expect(errorMessageEmitter).toHaveBeenCalledWith(message)
      );
    });

    it("should set is loading to false after fetching the archived report", async () => {
      const { fixture } = await renderComponent();
      const component = fixture.componentInstance;
      let isLoadingBefore = false;
      mockScenarioExecutionService.fetchArchivedReport.mockImplementation(
        () => {
          isLoadingBefore = component.isLoading;
          return of(archivedReport);
        }
      );
      fixture.detectChanges();
      await waitFor(() => expect(component.isLoading).toBeFalsy());
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe("should set update reference button correctly", () => {
    it("should fetch the first test directory from the environment deployed in the scenario", async () => {
      mockEnvironmentService.getEnvironmentExecutionById.mockReturnValue(
        of({
          tests: [
            { directory: environmentTestDirectory },
            { directory: "batata" },
          ],
        } as unknown as Environment)
      );
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(
          mockEnvironmentService.getEnvironmentExecutionById
        ).toHaveBeenCalledWith(projectId, getScenarioExecution().environmentId);
        expect(fixture.componentInstance.testDirectory).toEqual(
          environmentTestDirectory
        );
      });
    });

    it("should emit an error in case failed to fetch environment", async () => {
      const errorMessage = "error message";
      mockEnvironmentService.getEnvironmentExecutionById.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
    });

    it("should fetch all repositories and use the first element", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(mockRepositoryService.getAllRepositories).toHaveBeenCalledWith(
          projectId
        );
        expect(fixture.componentInstance.repoId).toEqual(repositories[0].id);
      });
    });

    it("should emit an error in case failed to fetch all repositories", async () => {
      const errorMessage = "failed to fetch all repositories";
      mockRepositoryService.getAllRepositories.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
    });

    it("should check if the user is authorized to update reference", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(mockAuthorizationService.isAuthorized).toHaveBeenCalledWith({
          action: "trigger",
          attributes: {},
          package: "test",
          resource: "update_reference",
        })
      );
    });

    it("should not initialize update reference menu items in case user is not authorized to update referemce", async () => {
      mockAuthorizationService.isAuthorized.mockReturnValue(of(false));
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.updateReferenceMenuItems).toEqual([])
      );
    });

    it("should init update reference buttons after initializing the test execution and environment", async () => {
      const { fixture } = await renderComponent();
      const component = fixture.componentInstance;
      const setComponentTestDirectorySpy = jest.fn();
      Object.defineProperty(component, "testDirectory", {
        set: setComponentTestDirectorySpy,
        configurable: true,
      });
      const setComponentTestExecutionSpy = jest.fn();
      Object.defineProperty(component, "testExecution", {
        set: setComponentTestExecutionSpy,
        configurable: true,
      });
      const addUpdateReferenceMenuItemsSpy = jest.spyOn(
        component,
        "addMenuItems"
      );
      fixture.detectChanges();
      expect(
        setComponentTestDirectorySpy.mock.invocationCallOrder[0]
      ).toBeLessThan(
        addUpdateReferenceMenuItemsSpy.mock.invocationCallOrder[0]
      );
      expect(
        setComponentTestExecutionSpy.mock.invocationCallOrder[0]
      ).toBeLessThan(
        addUpdateReferenceMenuItemsSpy.mock.invocationCallOrder[0]
      );
    });
    it("should initialize update reference menu items", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toEqual(6)
      );
    });

    it("should set the button label to update reference", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0);
        for (const item of fixture.componentInstance.updateReferenceMenuItems) {
          expect(item.label).toEqual("Update reference");
        }
      });
    });

    it("should set the repository id correctly", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(fixture.componentInstance.repoId).toEqual(repositories[0].id)
      );
    });

    it.each([
      RunNodeType.CSV_ASSERTION,
      RunNodeType.CSV_TABLE_ASSERTION,
      RunNodeType.JSON_ASSERTION,
      RunNodeType.XML_ASSERTION,
      RunNodeType.TEXT_ASSERTION,
      RunNodeType.EXCEL_ASSERTION,
    ])(
      "should add update reference to node of type %s",
      async (nodeType: RunNodeType) => {
        const { fixture } = await renderComponent();
        fixture.detectChanges();
        const nodes = fixture.componentInstance.updateReferenceMenuItems.filter(
          (item) => item.nodeType === nodeType
        );
        await waitFor(() => expect(nodes.length).toEqual(1));
      }
    );

    it("should enable update reference button in case of failed test", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0);
        for (const item of fixture.componentInstance.updateReferenceMenuItems) {
          expect(
            item.enabled?.({
              status: "FAILED",
            } as unknown as RunTreeNodeModel)
          ).toBeTruthy();
        }
      });
    });

    it("should disable update reference button in case scenario housekeeping is launched even if the test node failed", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({
          ...getScenarioExecution(),
          cleaningStatus: ScenarioExecutionHousekeepingStatus.PASSED,
        } as ScenarioExecution)
      );
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0);
        for (const item of fixture.componentInstance.updateReferenceMenuItems) {
          expect(
            item.enabled?.({
              status: "FAILED",
            } as unknown as RunTreeNodeModel)
          ).toBeFalsy();
        }
      });
    });

    it("should disable update reference button in case the scenario does not have a branch even if the test node failed", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({
          ...getScenarioExecution(),
          branch: undefined,
        } as ScenarioExecution)
      );
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() => {
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0);
        for (const item of fixture.componentInstance.updateReferenceMenuItems) {
          expect(
            item.enabled?.({
              status: "FAILED",
            } as unknown as RunTreeNodeModel)
          ).toBeFalsy();
        }
      });
    });

    it.each(["batata", "DONE"])(
      "should disable update reference button in case of non failing test",
      async (status: string) => {
        const { fixture } = await renderComponent();
        fixture.detectChanges();
        await waitFor(() => {
          expect(
            fixture.componentInstance.updateReferenceMenuItems.length
          ).toBeGreaterThan(0);
          for (const item of fixture.componentInstance
            .updateReferenceMenuItems) {
            expect(
              item.enabled?.({ status } as unknown as RunTreeNodeModel)
            ).toBeFalsy();
          }
        });
      }
    );

    it("should map the expected path on applicative to the applicative path on repo", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0)
      );
      for (const item of fixture.componentInstance.updateReferenceMenuItems) {
        const reachedFilePath = "reached";
        const expectedFilePath = "expected";
        item.onClick?.("nodeId", {
          metadata: {
            reachedFilePath: reachedFilePath,
            expectedFilePath: expectedFilePath,
          },
        } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
        expect(mockUpdateReferenceRepoPathMapper.map).toHaveBeenCalledWith({
          pathOnApplicative: expectedFilePath,
          testName: fixture.componentInstance.testExecution.nameUponExecution,
          testDirectory: testDirectory,
        });
      }
    });

    it("should show an error message if tried to update reference on a non existing reached file", async () => {
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0)
      );
      for (const item of fixture.componentInstance.updateReferenceMenuItems) {
        const reachedFilePath = null;
        const expectedFilePath = "expected";
        item.onClick?.("nodeId", {
          metadata: {
            reachedFilePath: reachedFilePath,
            expectedFilePath: expectedFilePath,
          },
        } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
        expect(errorMessageEmitter).toHaveBeenCalledWith(
          "Cannot update reference if the reached file does not exist."
        );
        expect(
          fixture.componentInstance.isUpdateReferenceModalVisible
        ).toBeFalsy();
      }
    });

    it("should set update reference modal visible on click", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0)
      );
      for (const item of fixture.componentInstance.updateReferenceMenuItems) {
        const reachedFilePath = "reached";
        const expectedFilePath = "expected";
        item.onClick?.("nodeId", {
          metadata: {
            reachedFilePath: reachedFilePath,
            expectedFilePath: expectedFilePath,
          },
        } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
        expect(
          fixture.componentInstance.isUpdateReferenceModalVisible
        ).toBeTruthy();
      }
    });

    it("should emit error in case failed to map applicative path to path on repo", async () => {
      const { fixture } = await renderComponent();
      const errorMessageEmitter = jest.spyOn(
        fixture.componentInstance.errorMessage,
        "emit"
      );
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0)
      );
      for (const item of fixture.componentInstance.updateReferenceMenuItems) {
        const reachedFilePath = "reached";
        const expectedFilePath = "expected";
        const errorMessage = "error message";
        mockUpdateReferenceRepoPathMapper.map.mockImplementation(() => {
          throw new Error(errorMessage);
        });
        item.onClick?.("nodeId", {
          metadata: {
            reachedFilePath: reachedFilePath,
            expectedFilePath: expectedFilePath,
          },
        } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
        expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
      }
    });
  });

  it("should set the web report selected test case executions to empty list on destroy", async () => {
    const { fixture } = await renderComponent();
    fixture.componentInstance.ngOnDestroy();
    expect(
      mockStateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([]);
  });

  it("should set the web report selected test case executions to the values of test case executions selected inside the report if both test cases belong to the same test execution and match the external ids", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testExecution = {
      id: testExecutionId,
    } as unknown as TestExecution;
    const nodeData = {
      testCases: [
        { uuid: getFirstTestCaseExecution().externalId },
        { uuid: getSecondTestCaseExecution().externalId },
      ],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith(getTestCaseExecutions());
  });

  it("should set the web report selected test case executions to the values of test case executions selected inside the report if test cases belong to the different test executions", async () => {
    const externalId = "123";
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    const firstTestCaseExecution = {
      ...getFirstTestCaseExecution(),
      externalId: externalId,
    } as unknown as TestCaseExecution;
    component.testCaseExecutions = signal([
      firstTestCaseExecution,
      {
        ...getSecondTestCaseExecution,
        testExecutionId: "another test execution id",
        externalId: externalId,
      } as unknown as TestCaseExecution,
    ]);
    const nodeData = {
      testCases: [{ uuid: externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([firstTestCaseExecution]);
  });

  it("should set the web report selected test case executions without the test cases executions that dont exist", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testCaseExecutions = signal([
      getFirstTestCaseExecution(),
      getSecondTestCaseExecution(),
    ]);
    const nodeData = {
      testCases: [
        {
          uuid: "some random id different from external ids of existing test cases",
        },
      ],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([]);
  });

  it("should set the test execution id on init of the test execution currently being viewed in the report", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    expect(
      mockStateService.setCurrentlyViewedTestExecutionId
    ).toHaveBeenCalledWith(testExecutionId);
  });

  it("should set the test execution id to undefined when the test execution report is closed", async () => {
    const { fixture } = await renderComponent();
    fixture.componentInstance.ngOnDestroy();
    expect(
      mockStateService.setCurrentlyViewedTestExecutionId
    ).toHaveBeenCalledWith(undefined);
  });

  it("should set the currently viewed test case execution to undefined on init", async () => {
    const { fixture } = await renderComponent();
    fixture.detectChanges();
    expect(
      mockStateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  it("should set the currently viewed test case execution to undefined on destroy", async () => {
    const { fixture } = await renderComponent();
    fixture.componentInstance.ngOnDestroy();
    expect(
      mockStateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  it("should set the web report currently viewed test case execution to the test case execution selected inside the report if it matches the external id", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testExecution = {
      id: testExecutionId,
    } as unknown as TestExecution;
    const nodeData = {
      testCases: [{ uuid: getFirstTestCaseExecution().externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(getFirstTestCaseExecution());
  });

  it("should set the web report currently viewed test case execution to the most recently selected test case execution inside the report if it matches the external id", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testExecution = {
      id: testExecutionId,
    } as unknown as TestExecution;
    const nodeData = {
      testCases: [
        { uuid: getFirstTestCaseExecution().externalId },
        { uuid: getSecondTestCaseExecution().externalId },
      ],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(getSecondTestCaseExecution());
  });

  it("should set the web report currently viewed test case execution undefined for a test case execution that does not exist", async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    component.testCaseExecutions = signal([getFirstTestCaseExecution()]);
    const nodeData = {
      testCases: [
        {
          uuid: "fun fact: dates come from the palm tree",
        },
      ],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      mockStateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  describe("authorization", () => {
    it("update reference modal should be authorized with correct configuration", async () => {
      const { fixture } = await renderComponent();
      fixture.detectChanges();
      await waitFor(() =>
        expect(
          fixture.componentInstance.updateReferenceMenuItems.length
        ).toBeGreaterThan(0)
      );
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      fixture.detectChanges();
      const updateReferenceModal = DomTestUtils.getElementByTestId(
        fixture,
        "update-reference-modal"
      ).getDebugElement();
      const showElementIfAuthorizedDirective = ngMocks.findInstance(
        updateReferenceModal,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementIfAuthorizedDirective.showElementIfAuthorized).toEqual({
        action: "trigger",
        attributes: {},
        package: "test",
        resource: "update_reference",
      });
    });
  });

  describe("Transfer To Recon", () => {
    const cycleId = "cycle-42";
    const exportPath = "/reports/a.csv";

    beforeEach(() => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({ ...getScenarioExecution(), supportReconActivities: true })
      );
      mockScenarioExecutionService.fetchArchivedReport.mockReturnValue(
        of(undefined)
      );
      mockReconService.transferToRecon.mockReturnValue(of(undefined));
    });

    async function renderTransferToReconComponent() {
      const rendered = await renderComponent();
      rendered.fixture.detectChanges();
      return rendered;
    }

    function getReportComponent(
      fixture: Awaited<
        ReturnType<typeof renderTransferToReconComponent>
      >["fixture"]
    ) {
      return ngMocks.find(fixture, ReportingComponent).componentInstance;
    }

    function getTransferToReconModal(
      fixture: Awaited<
        ReturnType<typeof renderTransferToReconComponent>
      >["fixture"]
    ) {
      return ngMocks.find(fixture, TransferToReconModalComponent)
        .componentInstance;
    }

    async function renderAndTriggerTransfer(cycleIdToEmit = cycleId) {
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );
      getReportComponent(fixture).treeItems![0].onClick?.([
        { details: { metadata: { exportPath } } } as unknown as NodeDetails,
      ]);
      getTransferToReconModal(fixture).transfer.emit(cycleIdToEmit);
    }

    it("should check the transfer-to-recon feature flag if recon activity is supported on the scenario", async () => {
      await renderTransferToReconComponent();

      await waitFor(() => {
        expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalledWith(
          projectId,
          "transfer-to-recon"
        );
      });
    });

    it("should not add transfer to recon menu items when feature flag is disabled", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() =>
        expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalled()
      );
      expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
    });

    it("should check if the user is authorized to transfer to recon", async () => {
      await renderTransferToReconComponent();

      expect(mockAuthorizationService.isAuthorized).toHaveBeenCalledWith({
        action: "transfer_to_recon",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });

    it("should not check transfer to recon authorization and not add menu items when supportReconActivities is false", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({ ...getScenarioExecution(), supportReconActivities: false })
      );
      const { fixture } = await renderTransferToReconComponent();

      expect(mockAuthorizationService.isAuthorized).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: "transfer_to_recon" })
      );
      expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
    });

    it("should not show transfer to recon menu item when user is not authorized", async () => {
      mockAuthorizationService.isAuthorized.mockReturnValue(of(false));
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
      });
    });

    it("should show transfer to recon menu item when user is authorized", async () => {
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems?.length).toBe(1);
      });
    });

    it("should set the label to Transfer To Recon", async () => {
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems![0].label).toEqual(
          "Transfer To Recon"
        );
      });
    });

    it("should only allow table assertion nodes to Transfer to Recon", async () => {
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(
          getReportComponent(fixture).treeItems![0].nodeTypes as RunNodeType[]
        ).toEqual([
          RunNodeType.TABLE_ASSERTION,
          RunNodeType.CSV_TABLE_ASSERTION,
          RunNodeType.CSV_ASSERTION,
          RunNodeType.EXCEL_ASSERTION,
        ]);
      });
    });

    it("should be enabled when housekeeping has not been launched", async () => {
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(
          getReportComponent(fixture).treeItems![0].enabled?.([])
        ).toBeTruthy();
      });
    });

    it("should be disabled when housekeeping has been launched", async () => {
      mockScenarioExecutionService.getScenarioExecution.mockReturnValue(
        of({
          ...getScenarioExecution(),
          supportReconActivities: true,
          cleaningStatus: ScenarioExecutionHousekeepingStatus.PASSED,
        } as ScenarioExecution)
      );
      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(
          getReportComponent(fixture).treeItems![0].enabled?.([])
        ).toBeFalsy();
      });
    });

    it("should open the modal with the correct paths when onClick is called with valid paths", async () => {
      const transferPath = "/reports/comparison.csv";
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: transferPath } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        expect(getTransferToReconModal(fixture).pathsToTransfer).toEqual([
          transferPath,
        ]);
        expect(getTransferToReconModal(fixture).isVisible).toBe(true);
      });
    });

    it("should pass the correct inputs to the transfer to recon modal", async () => {
      const transferPath = "/reports/comparison.csv";
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: transferPath } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        const modal = getTransferToReconModal(fixture);
        expect(modal.projectId).toBe(projectId);
        expect(modal.pathsToTransfer).toEqual([transferPath]);
        expect(modal.isVisible).toBe(true);
      });
    });

    it("should collect paths from multiple nodes", async () => {
      const path1 = "/reports/a.csv";
      const path2 = "/reports/b.csv";
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: path1 } },
        } as unknown as NodeDetails,
        {
          details: { metadata: { exportPath: path2 } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        expect(getTransferToReconModal(fixture).pathsToTransfer).toEqual([
          path1,
          path2,
        ]);
      });
    });

    it("should strip the test directory prefix from paths to produce relative paths", async () => {
      const absolutePath = `${environmentTestDirectory}/reports/comparison.csv`;
      const expectedRelativePath = "/reports/comparison.csv";
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: absolutePath } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        expect(getTransferToReconModal(fixture).pathsToTransfer).toEqual([
          expectedRelativePath,
        ]);
      });
    });

    it("should filter out nodes without a valid export path", async () => {
      const validPath = "/reports/valid.csv";
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: validPath } },
        } as unknown as NodeDetails,
        {
          details: { metadata: { exportPath: null } },
        } as unknown as NodeDetails,
        {
          details: { metadata: { exportPath: undefined } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        expect(getTransferToReconModal(fixture).pathsToTransfer).toEqual([
          validPath,
        ]);
      });
    });

    it("should show a warning and keep the modal closed when no valid paths are found", async () => {
      const { fixture } = await renderTransferToReconComponent();
      await waitFor(() =>
        expect(getReportComponent(fixture).treeItems?.length).toBe(1)
      );

      getReportComponent(fixture).treeItems![0].onClick?.([
        {
          details: { metadata: { exportPath: null } },
        } as unknown as NodeDetails,
        {
          details: { metadata: { exportPath: undefined } },
        } as unknown as NodeDetails,
      ]);

      await waitFor(() => {
        expect(getTransferToReconModal(fixture).isVisible).toBe(false);
        expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
          "The current node selection does not contain any valid reports. Missing reports may be due to an unsupported MXtest version, an invalid node, or an incomplete configuration."
        );
      });
    });

    it("should trigger a transfer to recon upon an event from the transfer to recon modal", async () => {
      await renderAndTriggerTransfer();

      await waitFor(() => {
        expect(mockReconService.transferToRecon).toHaveBeenCalledWith({
          projectId,
          scenarioExecutionId,
          testExecutionId,
          cycleId,
          folderPaths: [exportPath],
        });
      });
    });

    it("should show a success toast after a successful transfer", async () => {
      await renderAndTriggerTransfer();

      await waitFor(() => {
        expect(mockToastMessageService.showSuccess).toHaveBeenCalledWith(
          "Transfer triggered successfully"
        );
      });
    });

    it("should show an error toast when the transfer fails", async () => {
      const errorMessage = "Transfer failed";
      mockReconService.transferToRecon.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      await renderAndTriggerTransfer();

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          errorMessage
        );
      });
    });

    it("should still load the report with other menu items if the transfer to recon authorization check throws an error", async () => {
      mockAuthorizationService.isAuthorized.mockImplementation(
        (params: { action: string }) => {
          if (params.action === "transfer_to_recon") {
            return throwError(() => new Error("auth service unavailable"));
          }
          return of(true).pipe(delay(100));
        }
      );

      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems!.length).toBe(0);
        expect(
          getReportComponent(fixture).detailsActionItems!.length
        ).toBeGreaterThan(0);
      });
    });

    it("should still load the report with other menu items if fetching the transfer to recon feature flag throws an error", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockImplementation(() =>
        throwError(() => new Error("auth service unavailable"))
      );

      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems!.length).toBe(0);
        expect(
          getReportComponent(fixture).detailsActionItems!.length
        ).toBeGreaterThan(0);
      });
    });

    it("should still load the report with other menu items if the update reference authorization check throws an error", async () => {
      mockAuthorizationService.isAuthorized.mockImplementation(
        (params: { resource: string }) => {
          if (params.resource === "update_reference") {
            return throwError(() => new Error("auth service unavailable"));
          }
          return of(true);
        }
      );

      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(
          0
        );
        expect(getReportComponent(fixture).detailsActionItems!.length).toBe(0);
      });
    });

    it("should keep loading if fetching the authorization of the mxtest menu items is still in progress", async () => {
      const isAuthorizedToAccessMenuItems = new Subject<boolean>();
      mockAuthorizationService.isAuthorized.mockReturnValue(
        isAuthorizedToAccessMenuItems.asObservable()
      );

      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(screen.getByTestId("loading-skeleton")).toBeTruthy();
      });

      isAuthorizedToAccessMenuItems.next(true);

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(
          0
        );
        expect(
          getReportComponent(fixture).detailsActionItems!.length
        ).toBeGreaterThan(0);
      });
    });

    it("should keep loading if fetching the feature flag value of the mxtest menu items is still in progress", async () => {
      const featureFlagSubject = new Subject<boolean>();
      mockFeatureFlagResolver.isFeatureEnabled.mockImplementation(() =>
        featureFlagSubject.asObservable()
      );

      const { fixture } = await renderTransferToReconComponent();

      await waitFor(() => {
        expect(screen.getByTestId("loading-skeleton")).toBeTruthy();
      });

      featureFlagSubject.next(true);
      featureFlagSubject.complete();

      await waitFor(() => {
        expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(
          0
        );
        expect(
          getReportComponent(fixture).detailsActionItems!.length
        ).toBeGreaterThan(0);
      });
    });
  });

  function getTestCaseExecutions() {
    return [getFirstTestCaseExecution(), getSecondTestCaseExecution()];
  }

  function getFirstTestCaseExecution() {
    return { ...TEST_CASE_EXECUTION_1, testExecutionId };
  }

  function getSecondTestCaseExecution() {
    return { ...TEST_CASE_EXECUTION_2, testExecutionId };
  }
});
