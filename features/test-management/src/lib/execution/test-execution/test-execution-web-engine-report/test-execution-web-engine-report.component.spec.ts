import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { TestExecutionWebEngineReportComponent } from "./test-execution-web-engine-report.component";
import { delay, of, Subject, throwError } from "rxjs";
import {
  ScenarioExecution,
  TestExecution,
} from "../../scenario-execution/scenario-execution";
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
import {
  MockComponent,
  MockDirective,
  MockDirectives,
  MockModule,
  ngMocks,
} from "ng-mocks";
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
    cleaningStatus: "NOT_LAUNCHED",
    environmentId: "environment id 1",
    rtpCommitId: "rtp commit",
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
  let component: TestExecutionWebEngineReportComponent;
  let scenarioExecutionService: ScenarioExecutionService;
  let authorizationService: AuthorizationService;
  let environmentService: EnvironmentService;
  let repositoryService: RepositoryService;
  let updateReferenceRepoPathMapper: UpdateReferenceRepositoryPathMapper;
  let errorMessageEmitter: jest.SpyInstance;
  let stateService: ScenarioExecutionStateManagementService;
  let reconService: ReconService;
  let toastMessageService: ToastMessageService;
  let fixture: ComponentFixture<TestExecutionWebEngineReportComponent>;
  let featureFlagResolver: FeatureFlagResolver;
  beforeEach(() => {
    scenarioExecutionService = {
      fetchArchivedReport: jest.fn(() => of(archivedReport)),
      getScenarioExecution: jest.fn(() => of(getScenarioExecution())),
    } as unknown as ScenarioExecutionService;

    authorizationService = {
      isAuthorized: jest.fn(() => of(true)),
    } as unknown as AuthorizationService;
    environmentService = {
      getEnvironmentExecutionById: jest.fn(() =>
        of({ tests: [{ directory: environmentTestDirectory }] })
      ),
    } as unknown as EnvironmentService;
    updateReferenceRepoPathMapper = {
      map: jest.fn(() => expectedFilePathOnRepo),
    } as unknown as UpdateReferenceRepositoryPathMapper;

    repositoryService = {
      getAllRepositories: jest.fn(() => of(repositories)),
    } as unknown as RepositoryService;

    reconService = {
      transferToRecon: jest.fn(() => of(undefined)),
    } as unknown as ReconService;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showWarning: jest.fn(),
    } as unknown as ToastMessageService;

    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    } as unknown as FeatureFlagResolver;

    stateService = {
      setWebReportSelectedTestCaseExecutions: jest.fn(),
      setWebReportCurrentlyViewedTestCaseExecution: jest.fn(),
      setCurrentlyViewedTestExecutionId: jest.fn(),
      analyzableTestCaseExecutions: signal<TestCaseExecution[]>([
        getFirstTestCaseExecution(),
        getSecondTestCaseExecution(),
      ]),
      validationScope: signal(undefined),
      validationScopeWarningMessage: signal(undefined),
    } as unknown as ScenarioExecutionStateManagementService;
    TestBed.configureTestingModule({
      imports: [
        TestExecutionWebEngineReportComponent,
        MockComponent(UpdateReferenceModalComponent),
        MockComponent(TransferToReconModalComponent),
      ],
      declarations: [MockDirectives(ShowElementIfAuthorizedDirective)],
    }).overrideComponent(TestExecutionWebEngineReportComponent, {
      set: {
        providers: [
          {
            provide: ScenarioExecutionService,
            useValue: scenarioExecutionService,
          },
          {
            provide: AuthorizationService,
            useValue: authorizationService,
          },
          {
            provide: EnvironmentService,
            useValue: environmentService,
          },
          {
            provide: UpdateReferenceRepositoryPathMapper,
            useValue: updateReferenceRepoPathMapper,
          },
          {
            provide: RepositoryService,
            useValue: repositoryService,
          },
          {
            provide: ScenarioExecutionStateManagementService,
            useValue: stateService,
          },
          {
            provide: ReconService,
            useValue: reconService,
          },
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
          {
            provide: FeatureFlagResolver,
            useValue: featureFlagResolver,
          },
        ],
      },
    });

    fixture = TestBed.createComponent(TestExecutionWebEngineReportComponent);

    component = fixture.componentInstance;

    errorMessageEmitter = jest.spyOn(component.errorMessage, "emit");

    component.projectId = projectId;
    component.scenarioExecutionId = scenarioExecutionId;
    component.testExecutionId = testExecutionId;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch the scenario execution", () => {
    component.ngOnInit();
    expect(scenarioExecutionService.getScenarioExecution).toHaveBeenCalledWith(
      projectId,
      scenarioExecutionId
    );
  });
  it("should throw error if failed to fetch scenario execution", fakeAsync(() => {
    const getScenarioExecutionSpy = jest.spyOn(
      scenarioExecutionService,
      "getScenarioExecution"
    );
    const message = "error message";
    getScenarioExecutionSpy.mockReturnValue(
      throwError(() => new Error(message))
    );
    component.ngOnInit();
    expect(errorMessageEmitter).toHaveBeenCalledWith(message);
  }));
  it("should display error toast in case the requested test execution does not belong to the scenario execution", fakeAsync(() => {
    const scenarioExecution = getScenarioExecution();
    scenarioExecution.testExecutions[1].id = "other id";
    const getScenarioExecutionSpy = jest.spyOn(
      scenarioExecutionService,
      "getScenarioExecution"
    );
    getScenarioExecutionSpy.mockReturnValue(of(scenarioExecution));
    component.ngOnInit();
    tick(1000);
    expect(errorMessageEmitter).toHaveBeenCalledWith(
      "The requested test execution does not exist on the provided scenario execution"
    );
  }));
  it("should set the package id correctly", fakeAsync(() => {
    component.ngOnInit();
    tick(1000);
    expect(component.packageId).toEqual(testExecutionNameUponExecution);
  }));
  it("should set the commit id correctly", fakeAsync(() => {
    component.ngOnInit();
    tick(1000);
    expect(component.commitId).toEqual(getScenarioExecution().rtpCommitId);
  }));

  it("should set testCaseExecutionId when a tree node with test case is selected", () => {
    const nodeData = {
      testCases: [{ uuid: getFirstTestCaseExecution().externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution?.id).toEqual(
      getFirstTestCaseExecution().id
    );
  });

  it("should set most recent testCaseExecutionId when multiple tree nodes with test cases are selected", () => {
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

    expect(component.testCaseExecution?.id).toEqual(TEST_CASE_EXECUTION_1.id);
  });

  it("should match selected test case against test execution id and external id", () => {
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

    expect(component.testCaseExecution?.id).toEqual(TEST_CASE_EXECUTION_1.id);
  });

  it("should set testCaseExecutionId to undefined when test case execution is not persisted yet", () => {
    const nodeData = {
      testCases: [{ uuid: "invalidId" }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(component.testCaseExecution?.id).not.toBeDefined();
  });

  describe("report during test execution", () => {
    it("should set the primary url to live report url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.primaryUrl).toEqual(liveReportUrl);
    }));
    it("should set the secondary url to the complete report url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.secondaryUrl).toEqual(completeReport);
    }));
    it("should have an empty archived report", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.archivedReport).toEqual(undefined);
      expect(
        scenarioExecutionService.fetchArchivedReport
      ).not.toHaveBeenCalled();
    }));
    it("should set is loading to false without fetching the archived report", fakeAsync(() => {
      let isLoadingBefore = false;
      const getScenarioExecutionSpy = jest.spyOn(
        scenarioExecutionService,
        "getScenarioExecution"
      );
      getScenarioExecutionSpy.mockImplementation(() => {
        isLoadingBefore = component.isLoading;
        return of(getScenarioExecution());
      });
      component.ngOnInit();
      tick(1000);
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    }));
  });

  describe("report after test execution completion before cleaning", () => {
    beforeEach(() => {
      const scenarioExecution = getScenarioExecution();
      scenarioExecution.testExecutions[1].isExecutionEnded = true;
      const getScenarioExecutionSpy = jest.spyOn(
        scenarioExecutionService,
        "getScenarioExecution"
      );
      getScenarioExecutionSpy.mockReturnValue(of(scenarioExecution));
    });
    it("should set the primary url to complete report url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.primaryUrl).toEqual(completeReport);
    }));
    it("should not set the secondary url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.secondaryUrl).toEqual(undefined);
    }));
    it("should have a archived report", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.archivedReport).toEqual(archivedReport);
      expect(scenarioExecutionService.fetchArchivedReport).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId,
        testExecutionId
      );
    }));
    it("should throw an error if failed to fetch archived report", fakeAsync(() => {
      const fetchArchivedReportSpy = jest.spyOn(
        scenarioExecutionService,
        "fetchArchivedReport"
      );
      const message = "error message";
      fetchArchivedReportSpy.mockReturnValue(
        throwError(() => new Error(message))
      );
      component.ngOnInit();
      tick(1000);
      expect(errorMessageEmitter).toHaveBeenCalledWith(message);
    }));
    it("should set is loading to false after fetching the archived report", fakeAsync(() => {
      let isLoadingBefore = false;
      const fetchArchivedReportSpy = jest.spyOn(
        scenarioExecutionService,
        "fetchArchivedReport"
      );
      fetchArchivedReportSpy.mockImplementation(() => {
        isLoadingBefore = component.isLoading;
        return of(archivedReport);
      });
      component.ngOnInit();
      tick(1000);
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    }));
  });

  describe("report after test execution completion and after scenario cleaning", () => {
    beforeEach(() => {
      const scenarioExecution = getScenarioExecution();
      scenarioExecution.cleaningStatus = "PASSED";
      scenarioExecution.testExecutions[1].isExecutionEnded = true;
      const getScenarioExecutionSpy = jest.spyOn(
        scenarioExecutionService,
        "getScenarioExecution"
      );
      getScenarioExecutionSpy.mockReturnValue(of(scenarioExecution));
    });
    it("should not set the primary url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.primaryUrl).toEqual(undefined);
    }));
    it("should not set the secondary url", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.secondaryUrl).toEqual(undefined);
    }));
    it("should have a archived report", fakeAsync(() => {
      component.ngOnInit();
      tick(1000);
      expect(component.archivedReport).toEqual(archivedReport);
      expect(scenarioExecutionService.fetchArchivedReport).toHaveBeenCalledWith(
        projectId,
        scenarioExecutionId,
        testExecutionId
      );
    }));
    it("should throw an error if failed to fetch archived report", fakeAsync(() => {
      const fetchArchivedReportSpy = jest.spyOn(
        scenarioExecutionService,
        "fetchArchivedReport"
      );
      const message = "error message";
      fetchArchivedReportSpy.mockReturnValue(
        throwError(() => new Error(message))
      );
      component.ngOnInit();
      tick(1000);
      expect(errorMessageEmitter).toHaveBeenCalledWith(message);
    }));
    it("should set is loading to false after fetching the archived report", fakeAsync(() => {
      let isLoadingBefore = false;
      const fetchArchivedReportSpy = jest.spyOn(
        scenarioExecutionService,
        "fetchArchivedReport"
      );
      fetchArchivedReportSpy.mockImplementation(() => {
        isLoadingBefore = component.isLoading;
        return of(archivedReport);
      });
      component.ngOnInit();
      tick(1000);
      expect(isLoadingBefore).toBeTruthy();
      expect(component.isLoading).toBeFalsy();
    }));
  });
  describe("should set update reference button correctly", () => {
    it("should fetch the first test directory from the environment deployed in the scenario", () => {
      environmentService.getEnvironmentExecutionById = jest.fn(() =>
        of({
          tests: [
            { directory: environmentTestDirectory },
            { directory: "batata" },
          ],
        } as unknown as Environment)
      );
      component.ngOnInit();
      expect(
        environmentService.getEnvironmentExecutionById
      ).toHaveBeenCalledWith(projectId, getScenarioExecution().environmentId);
      expect(component.testDirectory).toEqual(environmentTestDirectory);
    });
    it("should emit an error in case failed to fetch environment", () => {
      const errorMessage = "error message";
      environmentService.getEnvironmentExecutionById = jest.fn(() =>
        throwError(() => new Error(errorMessage))
      );
      component.ngOnInit();
      expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
    });
    it("should fetch all repositories and use the first element", () => {
      component.ngOnInit();
      expect(repositoryService.getAllRepositories).toHaveBeenCalledWith(
        projectId
      );
      expect(component.repoId).toEqual(repositories[0].id);
    });
    it("should emit an error in case failed to fetch all repositories", () => {
      const errorMessage = "failed to fetch all repositories";
      repositoryService.getAllRepositories = jest.fn(() =>
        throwError(() => new Error(errorMessage))
      );
      component.ngOnInit();
      expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
    });
    it("should check if the user is authorized to update reference", () => {
      component.ngOnInit();
      expect(authorizationService.isAuthorized).toHaveBeenCalledWith({
        action: "trigger",
        attributes: {},
        package: "test",
        resource: "update_reference",
      });
    });

    it("should not initialize update reference menu items in case user is not authorized to update referemce", () => {
      authorizationService.isAuthorized = jest.fn(() => of(false));
      component.ngOnInit();
      expect(component.updateReferenceMenuItems).toEqual([]);
    });

    it("should init update reference buttons after initializing the test execution and environment", () => {
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
      component.ngOnInit();
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

    describe("user is authorized to update reference", () => {
      beforeEach(() => {
        component.ngOnInit();
        expect(component.updateReferenceMenuItems.length).toEqual(6);
      });

      it("should set the button label to update reference", () => {
        component.updateReferenceMenuItems.forEach((item) => {
          expect(item.label).toEqual("Update reference");
        });
      });

      it("should set the repository id correctly", () => {
        expect(component.repoId).toEqual(repositories[0].id);
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
        (nodeType: RunNodeType) => {
          expect(
            component.updateReferenceMenuItems.filter(
              (item) => item.nodeType === nodeType
            ).length
          ).toEqual(1);
        }
      );

      it("should enable update reference button in case of failed test", () => {
        component.updateReferenceMenuItems.forEach((item) => {
          expect(
            item.enabled?.({ status: "FAILED" } as unknown as RunTreeNodeModel)
          ).toBeTruthy();
        });
      });

      it("should disable update reference button in case scenario housekeeping is launched even if the test node failed", () => {
        jest
          .spyOn(scenarioExecutionService, "getScenarioExecution")
          .mockReturnValue(
            of({
              ...getScenarioExecution(),
              cleaningStatus: "PASSED",
            } as ScenarioExecution)
          );
        component.ngOnInit();
        component.updateReferenceMenuItems.forEach((item) => {
          expect(
            item.enabled?.({ status: "FAILED" } as unknown as RunTreeNodeModel)
          ).toBeFalsy();
        });
      });

      it.each(["batata", "DONE"])(
        "should disable update reference button in case of non failing test",
        (status: string) => {
          component.updateReferenceMenuItems.forEach((item) => {
            expect(
              item.enabled?.({ status: status } as unknown as RunTreeNodeModel)
            ).toBeFalsy();
          });
        }
      );

      it("should map the expected path on applicative to the applicative path on repo", () => {
        component.updateReferenceMenuItems.forEach((item) => {
          const reachedFilePath = "reached";
          const expectedFilePath = "expected";
          item.onClick?.("nodeId", {
            metadata: {
              reachedFilePath: reachedFilePath,
              expectedFilePath: expectedFilePath,
            },
          } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
          expect(updateReferenceRepoPathMapper.map).toHaveBeenCalledWith({
            pathOnApplicative: expectedFilePath,
            testName: component.testExecution.nameUponExecution,
            testDirectory: testDirectory,
          });
        });
      });

      it("should show an error message if tried to update reference on a non existing reached file", () => {
        component.updateReferenceMenuItems.forEach((item) => {
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
          expect(component.isUpdateReferenceModalVisible).toBeFalsy();
        });
      });

      it("should set update reference modal visible on click", () => {
        component.updateReferenceMenuItems.forEach((item) => {
          const reachedFilePath = "reached";
          const expectedFilePath = "expected";
          item.onClick?.("nodeId", {
            metadata: {
              reachedFilePath: reachedFilePath,
              expectedFilePath: expectedFilePath,
            },
          } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
          expect(component.isUpdateReferenceModalVisible).toBeTruthy();
        });
      });

      it("should emit error in case failed to map applicative path to path on repo", () => {
        component.updateReferenceMenuItems.forEach((item) => {
          const reachedFilePath = "reached";
          const expectedFilePath = "expected";
          const errorMessage = "error message";
          updateReferenceRepoPathMapper.map = jest.fn(() => {
            throw new Error(errorMessage);
          });
          item.onClick?.("nodeId", {
            metadata: {
              reachedFilePath: reachedFilePath,
              expectedFilePath: expectedFilePath,
            },
          } as unknown as RunNodeTypeDetails[typeof item.nodeType]);
          expect(errorMessageEmitter).toHaveBeenCalledWith(errorMessage);
        });
      });
    });
  });

  it("should set the web report selected test case executions to empty list on destroy", () => {
    component.ngOnDestroy();
    expect(
      stateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([]);
  });

  it("should set the web report selected test case executions to the values of test case executions selected inside the report if both test cases belong to the same test execution and match the external ids", () => {
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
      stateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith(getTestCaseExecutions());
  });
  it("should set the web report selected test case executions to the values of test case executions selected inside the report if test cases belong to the different test executions", () => {
    const externalId = "123";
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
      stateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([firstTestCaseExecution]);
  });

  it("should set the web report selected test case executions without the test cases executions that dont exist", () => {
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
      stateService.setWebReportSelectedTestCaseExecutions
    ).toHaveBeenCalledWith([]);
  });

  it("should set the test execution id on init of the test execution currently being viewed in the report", () => {
    component.ngOnInit();
    expect(stateService.setCurrentlyViewedTestExecutionId).toHaveBeenCalledWith(
      testExecutionId
    );
  });

  it("should set the test execution id to undefined when the test execution report is closed", () => {
    component.ngOnDestroy();
    expect(stateService.setCurrentlyViewedTestExecutionId).toHaveBeenCalledWith(
      undefined
    );
  });

  it("should set the currently viewed test case execution to undefined on init", () => {
    component.ngOnInit();
    expect(
      stateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  it("should set the currently viewed test case execution to undefined on destroy", () => {
    component.ngOnDestroy();
    expect(
      stateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  it("should set the web report currently viewed test case execution to the test case execution selected inside the report if it matches the external id", () => {
    component.testExecution = {
      id: testExecutionId,
    } as unknown as TestExecution;
    const nodeData = {
      testCases: [{ uuid: getFirstTestCaseExecution().externalId }],
    } as unknown as ReportingTreeNodeData;
    const onSelectChange = component.onSelectTreeNodeChange();

    onSelectChange.action(nodeData);

    expect(
      stateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(getFirstTestCaseExecution());
  });

  it("should set the web report currently viewed test case execution to the most recently selected test case execution inside the report if it matches the external id", () => {
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
      stateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(getSecondTestCaseExecution());
  });

  it("should set the web report currently viewed test case execution undefined for a test case execution that does not exist", () => {
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
      stateService.setWebReportCurrentlyViewedTestCaseExecution
    ).toHaveBeenCalledWith(undefined);
  });

  describe("authorization", () => {
    beforeEach(() => {
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      fixture.detectChanges();
    });

    it("update reference modal should be authorized with correct configuration", () => {
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

describe("Transfer To Recon", () => {
  const mockScenarioService = {
    getScenarioExecution: jest.fn(),
    fetchArchivedReport: jest.fn(),
  };
  const mockAuthService = { isAuthorized: jest.fn() };
  const mockEnvService = { getEnvironmentExecutionById: jest.fn() };
  const mockRepoService = { getAllRepositories: jest.fn() };
  const mockStateService = {
    setWebReportSelectedTestCaseExecutions: jest.fn(),
    setWebReportCurrentlyViewedTestCaseExecution: jest.fn(),
    setCurrentlyViewedTestExecutionId: jest.fn(),
    analyzableTestCaseExecutions: signal<TestCaseExecution[]>([]),
    validationScope: signal(undefined),
    validationScopeWarningMessage: signal(undefined),
  };
  const mockReconService = { transferToRecon: jest.fn() };
  const mockToastService = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
  };
  const mockUpdateRefMapper = { map: jest.fn() };
  const mockFeatureFlagResolver = { isFeatureEnabled: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
    mockScenarioService.getScenarioExecution.mockReturnValue(
      of({ ...getScenarioExecution(), supportReconActivities: true })
    );
    mockScenarioService.fetchArchivedReport.mockReturnValue(of(undefined));
    mockAuthService.isAuthorized.mockReturnValue(of(true));
    mockEnvService.getEnvironmentExecutionById.mockReturnValue(
      of({ tests: [{ directory: environmentTestDirectory }] })
    );
    mockRepoService.getAllRepositories.mockReturnValue(of(repositories));
    mockReconService.transferToRecon.mockReturnValue(of(undefined));
  });

  async function renderComponent() {
    return render(TestExecutionWebEngineReportComponent, {
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
        { provide: ScenarioExecutionService, useValue: mockScenarioService },
        { provide: AuthorizationService, useValue: mockAuthService },
        { provide: EnvironmentService, useValue: mockEnvService },
        { provide: RepositoryService, useValue: mockRepoService },
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: mockStateService,
        },
        { provide: ReconService, useValue: mockReconService },
        { provide: ToastMessageService, useValue: mockToastService },
        {
          provide: UpdateReferenceRepositoryPathMapper,
          useValue: mockUpdateRefMapper,
        },
        { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
      ],
    });
  }

  const cycleId = "cycle-42";
  const exportPath = "/reports/a.csv";

  function getReportComponent(
    fixture: Awaited<ReturnType<typeof renderComponent>>["fixture"]
  ) {
    return ngMocks.find(fixture, ReportingComponent).componentInstance;
  }

  function getTransferToReconModal(
    fixture: Awaited<ReturnType<typeof renderComponent>>["fixture"]
  ) {
    return ngMocks.find(fixture, TransferToReconModalComponent)
      .componentInstance;
  }

  async function renderAndTriggerTransfer(cycleIdToEmit = cycleId) {
    const { fixture } = await renderComponent();
    await waitFor(() =>
      expect(getReportComponent(fixture).treeItems?.length).toBe(1)
    );
    getReportComponent(fixture).treeItems![0].onClick?.([
      { details: { metadata: { exportPath } } } as unknown as NodeDetails,
    ]);
    getTransferToReconModal(fixture).transfer.emit(cycleIdToEmit);
  }

  it("should check the transfer-to-recon feature flag if recon activity is supported on the scenario", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalledWith(
        projectId,
        "transfer-to-recon"
      );
    });
  });

  it("should not add transfer to recon menu items when feature flag is disabled", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalled()
    );
    expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
  });
  it("should check if the user is authorized to transfer to recon", async () => {
    await renderComponent();

    expect(mockAuthService.isAuthorized).toHaveBeenCalledWith({
      action: "transfer_to_recon",
      attributes: {},
      package: "test",
      resource: "scenario_execution",
    });
  });

  it("should not check transfer to recon authorization and not add menu items when supportReconActivities is false", async () => {
    mockScenarioService.getScenarioExecution.mockReturnValue(
      of({ ...getScenarioExecution(), supportReconActivities: false })
    );
    const { fixture } = await renderComponent();

    expect(mockAuthService.isAuthorized).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "transfer_to_recon" })
    );
    expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
  });

  it("should not show transfer to recon menu item when user is not authorized", async () => {
    mockAuthService.isAuthorized.mockReturnValue(of(false));
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems ?? []).toEqual([]);
    });
  });

  it("should show transfer to recon menu item when user is authorized", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems?.length).toBe(1);
    });
  });

  it("should set the label to Transfer To Recon", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems![0].label).toEqual(
        "Transfer To Recon"
      );
    });
  });

  it("should only allow table assertion nodes to Transfer to Recon", async () => {
    const { fixture } = await renderComponent();

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
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        getReportComponent(fixture).treeItems![0].enabled?.([])
      ).toBeTruthy();
    });
  });

  it("should be disabled when housekeeping has been launched", async () => {
    mockScenarioService.getScenarioExecution.mockReturnValue(
      of({
        ...getScenarioExecution(),
        supportReconActivities: true,
        cleaningStatus: "PASSED",
      } as ScenarioExecution)
    );
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        getReportComponent(fixture).treeItems![0].enabled?.([])
      ).toBeFalsy();
    });
  });

  it("should open the modal with the correct paths when onClick is called with valid paths", async () => {
    const transferPath = "/reports/comparison.csv";
    const { fixture } = await renderComponent();
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
    const { fixture } = await renderComponent();
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
    const { fixture } = await renderComponent();
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
    const { fixture } = await renderComponent();
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
    const { fixture } = await renderComponent();
    await waitFor(() =>
      expect(getReportComponent(fixture).treeItems?.length).toBe(1)
    );

    getReportComponent(fixture).treeItems![0].onClick?.([
      {
        details: { metadata: { exportPath: validPath } },
      } as unknown as NodeDetails,
      { details: { metadata: { exportPath: null } } } as unknown as NodeDetails,
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
    const { fixture } = await renderComponent();
    await waitFor(() =>
      expect(getReportComponent(fixture).treeItems?.length).toBe(1)
    );

    getReportComponent(fixture).treeItems![0].onClick?.([
      { details: { metadata: { exportPath: null } } } as unknown as NodeDetails,
      {
        details: { metadata: { exportPath: undefined } },
      } as unknown as NodeDetails,
    ]);

    await waitFor(() => {
      expect(getTransferToReconModal(fixture).isVisible).toBe(false);
      expect(mockToastService.showWarning).toHaveBeenCalledWith(
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
      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
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
      expect(mockToastService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should still load the report with other menu items if the transfer to recon authorization check throws an error", async () => {
    mockAuthService.isAuthorized.mockImplementation(
      (params: { action: string }) => {
        if (params.action === "transfer_to_recon") {
          return throwError(() => new Error("auth service unavailable"));
        }
        return of(true).pipe(delay(100));
      }
    );

    const { fixture } = await renderComponent();

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

    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems!.length).toBe(0);
      expect(
        getReportComponent(fixture).detailsActionItems!.length
      ).toBeGreaterThan(0);
    });
  });

  it("should still load the report with other menu items if the update reference authorization check throws an error", async () => {
    mockAuthService.isAuthorized.mockImplementation(
      (params: { resource: string }) => {
        if (params.resource === "update_reference") {
          return throwError(() => new Error("auth service unavailable"));
        }
        return of(true);
      }
    );

    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(0);
      expect(getReportComponent(fixture).detailsActionItems!.length).toBe(0);
    });
  });

  it("should keep loading if fetching the authorization of the mxtest menu items is still in progress", async () => {
    const isAuthorizedToAccessMenuItems = new Subject<boolean>();
    mockAuthService.isAuthorized.mockReturnValue(
      isAuthorizedToAccessMenuItems.asObservable()
    );

    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("loading-skeleton")).toBeTruthy();
    });

    isAuthorizedToAccessMenuItems.next(true);

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(0);
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

    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("loading-skeleton")).toBeTruthy();
    });

    featureFlagSubject.next(true);
    featureFlagSubject.complete();

    await waitFor(() => {
      expect(getReportComponent(fixture).treeItems!.length).toBeGreaterThan(0);
      expect(
        getReportComponent(fixture).detailsActionItems!.length
      ).toBeGreaterThan(0);
    });
  });
});
