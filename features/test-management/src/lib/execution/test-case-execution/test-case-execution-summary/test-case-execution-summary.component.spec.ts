import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { TestCaseExecutionSummaryComponent } from "./test-case-execution-summary.component";
import {
  TestCaseExecutionStatus,
  TestCaseExecutionStatusDisplayValue,
} from "../status/test-case-execution-status";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { signal, WritableSignal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import * as rxjs from "rxjs";
import { of, throwError } from "rxjs";
import { DatePipe } from "@angular/common";
import { TestCaseExecution } from "../test-case-execution";
import { DurationFormatterPipe, DurationPipe } from "@mxflow/pipe";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  BinaryImpactService,
  BinaryRegressionDataService,
  ConfigurationImpactService,
  ConfigurationRegressionService,
  DetectionType,
  LiteBinaryImpact,
  LiteBinaryRegression,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import {
  Incident,
  IncidentService,
} from "@mxflow/features/incident-management";
import { MockComponent, MockDirectives, ngMocks } from "ng-mocks";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { TestUnitAnalysisObjectLink } from "../../analysis-object-link/analysis-object-link";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import {
  TestCaseExecutionAnalysisStatus,
  TestCaseExecutionAnalysisStatusDisplayValue,
} from "../analysis-status/test-case-execution-analysis-status";
import { TestCaseExecutionSummaryData } from "../test-case-execution-with-linked-analysis-objects";
import { AnalysisObjectLink } from "@mxflow/test-management";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TestCaseExecutionAnalyzabilityService } from "../test-case-execution-analyzability.service";
import {
  applyTextFilterByTestId,
  DomTestUtils,
  getTooltipTextByTestId,
} from "@mxevolve/testing";
import { TestCaseTestUnitLinksDrawerComponent } from "../test-case-test-unit-links-drawer/test-case-test-unit-links-drawer.component";

const projectId = "projectId";
const scenarioExecutionId = "scenario-execution-1";
const testCaseExecutionId1 = "testCaseExecutionId1";
const testCaseExecutionId2 = "testCaseExecutionId2";
const testCaseExecutionId3 = "testCaseExecutionId3";
const testExecutionId1 = "exec-456";
const incidentId2 = "incidentId2";
const binaryRegressionType = AnalysisObjectType.BINARY_REGRESSION;
const testCaseExecution1 = {
  id: testCaseExecutionId1,
  projectId: "proj-123",
  testExecutionId: testExecutionId1,
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

const testCaseExecution2 = {
  id: testCaseExecutionId2,
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

const testCaseExecution3 = {
  id: testCaseExecutionId3,
  projectId: "proj-125",
  testExecutionId: "exec-458",
  externalId: "ext-791",
  testCaseKey: "TC-003",
  functionalTestCaseId: "FTC-103",
  scenarioExecutionId: "SE-204",
  title: "Logout Test",
  description: "Test for user logout functionality",
  status: TestCaseExecutionStatus.PASSED,
  startDate: "2025-04-08T14:20:00.000Z",
  endDate: "2025-04-08T14:25:00.000Z",
} as TestCaseExecution;
const configurationRegressionId = "123";
const configurationRegressionId2 = "padel";
const binaryRegressionId = "binaryRegressionId";
const binaryRegressionId2 = "binaryRegressionId2";
const configurationImpactId = "configurationImpactId";
const configurationImpactId2 = "configurationImpactId2";
const binaryImpactId = "binaryImpactId";
const binaryImpactId2 = "binaryImpactId2";
const binaryImpactType = AnalysisObjectType.BINARY_IMPACT;
const incidentId = "incidentId";
const analysisObjectId3 = "analysisObjectId3";
const incidentType = AnalysisObjectType.INCIDENT;
const configurationRegressionType = AnalysisObjectType.CONFIGURATION_REGRESSION;
const configurationImpactType = AnalysisObjectType.CONFIGURATION_IMPACT;

const LITE_BINARY_IMPACT_1 = {
  id: binaryImpactId,
  title: "title1",
  owner: "owner",
  mxVersion: "mxVersion",
  projectId: "projectId",
  upgradeImpact: {
    id: "upgradeImpactId",
    externalIssue: {
      id: "upgradeImpactExternalIssueId",
      link: "upgradeImpactExternalIssueLink",
    },
  },
};
const LITE_BINARY_IMPACT_2 = {
  id: binaryImpactId2,
  title: "title2",
  owner: "owner",
  mxVersion: "mxVersion",
  projectId: "projectId",
  upgradeImpact: {
    id: "upgradeImpactId",
    externalIssue: {
      id: "upgradeImpactExternalIssueId",
      link: "upgradeImpactExternalIssueLink",
    },
  },
};

const LITE_CONFIGURATION_REGRESSION_1 = {
  id: configurationRegressionId,
  title: "Regression 1 Title",
  guiltyChange: "Guilty Change for Regression 1",
  owner: "Owner 1",
  fix: "",
  projectId: "",
};
const LITE_CONFIGURATION_REGRESSION_2 = {
  id: configurationRegressionId2,
  title: "Regression 2 Title",
  guiltyChange: "Guilty Change for Regression 2",
  owner: "Owner 2",
  fix: "",
  projectId: "",
};

const LITE_BINARY_REGRESSION_2 = {
  id: binaryRegressionId2,
  title: "Binary Regression 2 Title",
  mxVersion: "Binary mx version 2",
  defect: {
    id: "id",
    link: "link",
  },
  owner: "Binary Owner 2",
  fix: "Binary fix 2",
  projectId: "Binary project 2",
};
const LITE_BINARY_REGRESSION_1 = {
  id: binaryRegressionId,
  title: "Binary Regression 1 Title",
  mxVersion: "Binary mx version 1",
  defect: {
    id: "id",
    link: "link",
  },
  owner: "Binary Owner 1",
  fix: "Binary fix 1",
  projectId: "Binary project 1",
};

const analysisObjectId1 = "analysisObjectId1";
const analysisObjectId2 = "analysisObjectId2";

function getBinaryRegressions(): LiteBinaryRegression[] {
  return [getFirstBinaryRegression(), getSecondBinaryRegression()];
}

function getFirstBinaryRegression(): LiteBinaryRegression {
  return {
    ...LITE_BINARY_REGRESSION_1,
    id: binaryRegressionId,
  } as unknown as LiteBinaryRegression;
}

function getSecondBinaryRegression(): LiteBinaryRegression {
  return {
    ...LITE_BINARY_REGRESSION_2,
    id: binaryRegressionId2,
  } as unknown as LiteBinaryRegression;
}

function getConfigurationImpacts() {
  return [
    getConfigurationImpact(),
    {
      ...getConfigurationImpact(),
      id: configurationImpactId2,
      title: "title2",
      owner: "owner2",
      creationDate: new Date("2024-03-22T07:42:18.196Z"),
    },
  ];
}

function getConfigurationImpact() {
  return {
    id: configurationImpactId,
    title: "title1",
    description: "description1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}

function getConfigurationRegressions(): LiteConfigurationRegression[] {
  return [
    {
      ...LITE_CONFIGURATION_REGRESSION_1,
      id: configurationRegressionId,
    } as unknown as LiteConfigurationRegression,
    {
      ...LITE_CONFIGURATION_REGRESSION_2,
      id: configurationRegressionId2,
      title: "title2",
      owner: "owner2",
    },
  ];
}

const INCIDENT_1 = {
  id: incidentId,
  title: "title1",
  status: "status1",
  externalIssue: {
    id: "ext id 1",
    origin: "ext origin 1",
    link: "ext link 1",
  },
} as unknown as Incident;

const INCIDENT_2 = {
  id: incidentId2,
  title: "title2",
  status: "status2",
  externalIssue: {
    id: "ext id 2",
    origin: "ext origin 2",
    link: "ext link 2",
  },
} as unknown as Incident;

function getIncidents() {
  return [
    { ...INCIDENT_1, id: analysisObjectId1 },
    {
      ...INCIDENT_2,
      id: analysisObjectId2,
    },
  ];
}

function getTestCaseExecutionWithLinkedAnalysisObject1(): TestCaseExecutionSummaryData {
  return {
    testCaseExecution: testCaseExecution1,
    hasTestUnitAnalysisObjectLinks: false,
    linkedRegressions: [
      {
        ...LITE_BINARY_REGRESSION_1,
        id: binaryRegressionId,
        analysisObjectType: DetectionType.Binary,
      },
      {
        ...LITE_CONFIGURATION_REGRESSION_1,
        id: configurationRegressionId,
        analysisObjectType: DetectionType.Configuration,
      },
    ],
    linkedImpacts: [
      {
        ...LITE_BINARY_IMPACT_1,
        id: binaryImpactId,
        analysisObjectType: DetectionType.Binary,
      },
      {
        ...getConfigurationImpact(),
        id: configurationImpactId,
        analysisObjectType: DetectionType.Configuration,
      },
    ],
    linkedIncidents: [
      {
        ...INCIDENT_1,
        id: analysisObjectId1,
      },
    ],
  } as unknown as TestCaseExecutionSummaryData;
}

function getTestCaseExecutionWithLinkedAnalysisObject2(): TestCaseExecutionSummaryData {
  return {
    testCaseExecution: {
      ...testCaseExecution2,
      testExecutionId: testExecutionId1,
    },
    hasTestUnitAnalysisObjectLinks: false,
    linkedRegressions: [
      {
        ...LITE_BINARY_REGRESSION_2,
        id: binaryRegressionId2,
        analysisObjectType: DetectionType.Binary,
      },
      {
        ...LITE_CONFIGURATION_REGRESSION_2,
        id: configurationRegressionId2,
        owner: "owner2",
        title: "title2",
        analysisObjectType: DetectionType.Configuration,
      },
    ],
    linkedImpacts: [
      {
        ...LITE_BINARY_IMPACT_2,
        id: binaryImpactId2,
        title: "title2",
        analysisObjectType: DetectionType.Binary,
      },
      {
        ...getConfigurationImpact(),
        id: configurationImpactId2,
        owner: "owner2",
        title: "title2",
        analysisObjectType: DetectionType.Configuration,
      },
    ],
    linkedIncidents: [
      {
        ...INCIDENT_2,
        id: analysisObjectId2,
      },
    ],
  } as unknown as TestCaseExecutionSummaryData;
}

function getAnalysisObjectLink1(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: testCaseExecutionId1,
    analysisObjectId: analysisObjectId1,
    analysisObjectType: analysisObjectType,
  };
}

function getAnalysisObjectLink2(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: testCaseExecutionId2,
    analysisObjectId: analysisObjectId2,
    analysisObjectType: analysisObjectType,
  };
}

function getAnalysisObjectLinkWithEmptyTestCaseExecution(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: undefined,
    analysisObjectId: analysisObjectId1,
    analysisObjectType: analysisObjectType,
  };
}

function getBinaryImpactLinks() {
  return [
    {
      ...getAnalysisObjectLink1(binaryImpactType),
      analysisObjectId: binaryImpactId,
    },
    {
      ...getAnalysisObjectLink2(binaryImpactType),
      testCaseExecutionId: testCaseExecutionId2,
      analysisObjectId: binaryImpactId2,
    },
    {
      ...getAnalysisObjectLinkWithEmptyTestCaseExecution(binaryImpactType),
      testCaseExecutionId: testCaseExecutionId3,
      analysisObjectId: analysisObjectId3,
    },
    getAnalysisObjectLinkWithEmptyTestCaseExecution(binaryImpactType),
  ];
}

function getBinaryRegressionLinks() {
  return [
    {
      ...getAnalysisObjectLink1(binaryRegressionType),
      analysisObjectId: binaryRegressionId,
    },
    {
      ...getAnalysisObjectLink2(binaryRegressionType),
      testCaseExecutionId: testCaseExecutionId2,
      analysisObjectId: binaryRegressionId2,
    },
    {
      ...getAnalysisObjectLinkWithEmptyTestCaseExecution(binaryRegressionType),
      testCaseExecutionId: testCaseExecutionId3,
      analysisObjectId: analysisObjectId3,
    },
    getAnalysisObjectLinkWithEmptyTestCaseExecution(binaryRegressionType),
  ];
}

function getConfigurationImpactLinks() {
  return [
    {
      ...getAnalysisObjectLink1(configurationImpactType),
      analysisObjectId: configurationImpactId,
    },
    {
      ...getAnalysisObjectLink2(configurationImpactType),
      testCaseExecutionId: testCaseExecutionId2,
      analysisObjectId: configurationImpactId2,
    },
    {
      ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
        configurationImpactType
      ),
      testCaseExecutionId: testCaseExecutionId3,
      analysisObjectId: analysisObjectId3,
    },
    getAnalysisObjectLinkWithEmptyTestCaseExecution(configurationImpactType),
  ];
}

function getConfigurationRegressionLinks() {
  return [
    {
      ...getAnalysisObjectLink1(configurationRegressionType),
      analysisObjectId: configurationRegressionId,
    },
    {
      ...getAnalysisObjectLink2(configurationRegressionType),
      testCaseExecutionId: testCaseExecutionId2,
      analysisObjectId: configurationRegressionId2,
    },
    {
      ...getAnalysisObjectLinkWithEmptyTestCaseExecution(
        configurationRegressionType
      ),
      testCaseExecutionId: testCaseExecutionId3,
      analysisObjectId: analysisObjectId3,
    },
    getAnalysisObjectLinkWithEmptyTestCaseExecution(
      configurationRegressionType
    ),
  ];
}

function getIncidentLinks() {
  return [
    getAnalysisObjectLink1(incidentType),
    {
      ...getAnalysisObjectLink2(incidentType),
      testCaseExecutionId: testCaseExecutionId2,
    },
    {
      ...getAnalysisObjectLinkWithEmptyTestCaseExecution(incidentType),
      testCaseExecutionId: testCaseExecutionId3,
      analysisObjectId: analysisObjectId3,
    },
    getAnalysisObjectLinkWithEmptyTestCaseExecution(incidentType),
  ];
}

function getTestCaseExecutionCountElementText(
  fixture: ComponentFixture<TestCaseExecutionSummaryComponent>
) {
  return (
    fixture.debugElement.query(
      By.css('[data-testId="test-case-execution-count"]')
    ).nativeElement as HTMLDivElement
  ).textContent?.trim();
}

function authMockSetup(
  fixture: ComponentFixture<TestCaseExecutionSummaryComponent>
) {
  ngMocks
    .findInstances(ShowElementIfAuthorizedDirective)
    .forEach((authDirective) => ngMocks.render(authDirective, authDirective));
  fixture.detectChanges();
}

describe("Test Case Executions Summary", () => {
  let route: ActivatedRoute;
  let router: Router;
  let stateService: ScenarioExecutionStateManagementService;
  let toastMessageService: ToastMessageService;
  let incidentService: IncidentService;
  let binaryImpactService: BinaryImpactService;
  let binaryRegressionService: BinaryRegressionDataService;
  let configurationImpactService: ConfigurationImpactService;
  let configurationRegressionService: ConfigurationRegressionService;
  let testCaseExecutionAnalyzabilityService: TestCaseExecutionAnalyzabilityService;
  let jiraConfig: JiraConfig;
  let datePipe: DatePipe;
  let durationPipe: DurationPipe;
  let testCaseExecutions: WritableSignal<TestCaseExecution[]>;
  let isLoading: WritableSignal<boolean>;
  let component: TestCaseExecutionSummaryComponent;
  let fixture: ComponentFixture<TestCaseExecutionSummaryComponent>;
  let testCaseTestUnitAnalysisObjectLinksMapMock: WritableSignal<
    Map<string, TestUnitAnalysisObjectLink[]>
  >;

  beforeEach(() => {
    testCaseTestUnitAnalysisObjectLinksMapMock = signal<
      Map<string, TestUnitAnalysisObjectLink[]>
    >(new Map<string, TestUnitAnalysisObjectLink[]>());
    isLoading = signal(false);
    datePipe = new DatePipe("en-US");
    durationPipe = new DurationPipe(new DurationFormatterPipe());
    testCaseExecutions = signal([
      testCaseExecution1,
      { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      testCaseExecution3,
    ]);
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;
    binaryImpactService = {
      fetchByIds: jest.fn(() =>
        of([
          {
            ...LITE_BINARY_IMPACT_1,
            id: binaryImpactId,
          } as unknown as LiteBinaryImpact,
          {
            ...LITE_BINARY_IMPACT_2,
            id: binaryImpactId2,
          } as unknown as LiteBinaryImpact,
        ])
      ),
    } as unknown as BinaryImpactService;
    binaryRegressionService = {
      fetchByIds: jest.fn(() => of(getBinaryRegressions())),
    } as unknown as BinaryRegressionDataService;
    configurationImpactService = {
      fetchByIds: jest.fn(() => of(getConfigurationImpacts())),
    } as unknown as ConfigurationImpactService;
    configurationRegressionService = {
      fetchByIds: jest.fn(() => of(getConfigurationRegressions())),
    } as unknown as ConfigurationRegressionService;
    incidentService = {
      fetchIncidentsByIds: jest.fn(() => of(getIncidents())),
    } as unknown as IncidentService;
    testCaseExecutionAnalyzabilityService = {
      isUnmapped: jest.fn(() => false),
      isAnalyzable: jest.fn(() => true),
    } as unknown as TestCaseExecutionAnalyzabilityService;

    jiraConfig = {
      functionalTestCaseBaseUrl: "https://jira.example.com/",
    } as unknown as JiraConfig;
    stateService = {
      setCurrentlyViewedTestExecutionId: jest.fn(),
      testCaseExecutions: testCaseExecutions,
      projectId: signal(projectId),
      scenarioExecutionId: signal(scenarioExecutionId),
      isScenarioExecutionDetailsLoading: isLoading,
      analysisObjectLinks: signal([
        ...getBinaryImpactLinks(),
        ...getBinaryRegressionLinks(),
        ...getConfigurationImpactLinks(),
        ...getConfigurationRegressionLinks(),
        ...getIncidentLinks(),
      ]),
      getTestCaseExecutions$: jest.fn(() =>
        of([
          testCaseExecution1,
          { ...testCaseExecution2, testExecutionId: testExecutionId1 },
          testCaseExecution3,
        ])
      ),
      getScenarioExecutionAnalysisObjectLinks$: jest.fn(() => of([])),
      binaryImpactLinks: signal<any[]>(getBinaryImpactLinks()),
      binaryRegressionLinks: signal<any[]>(getBinaryRegressionLinks()),
      configurationImpactLinks: signal<any[]>(getConfigurationImpactLinks()),
      configurationRegressionLinks: signal<any[]>(
        getConfigurationRegressionLinks()
      ),
      incidentLinks: signal<any[]>(getIncidentLinks()),
      testCaseTestUnitAnalysisObjectLinksMap:
        testCaseTestUnitAnalysisObjectLinksMapMock,
    } as unknown as ScenarioExecutionStateManagementService;
    route = {
      params: of({ "test-execution-id": testExecutionId1 }),
    } as unknown as ActivatedRoute;
    TestBed.configureTestingModule({
      imports: [TestCaseExecutionSummaryComponent, RouterModule.forRoot([])],
      declarations: [MockDirectives(ShowElementIfAuthorizedDirective)],
      providers: [
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
        {
          provide: ActivatedRoute,
          useValue: route,
        },
        {
          provide: ToastMessageService,
          useValue: toastMessageService,
        },
        {
          provide: BinaryImpactService,
          useValue: binaryImpactService,
        },
        {
          provide: BinaryRegressionDataService,
          useValue: binaryRegressionService,
        },
        {
          provide: ConfigurationImpactService,
          useValue: configurationImpactService,
        },
        {
          provide: ConfigurationRegressionService,
          useValue: configurationRegressionService,
        },
        {
          provide: IncidentService,
          useValue: incidentService,
        },
        {
          provide: TestCaseExecutionAnalyzabilityService,
          useValue: testCaseExecutionAnalyzabilityService,
        },
        {
          provide: JIRA_CONFIG,
          useValue: jiraConfig,
        },
        provideAnimations(),
      ],
    })
      .overrideComponent(TestCaseExecutionSummaryComponent, {
        remove: { imports: [TestCaseTestUnitLinksDrawerComponent] },
        add: { imports: [MockComponent(TestCaseTestUnitLinksDrawerComponent)] },
      })
      .compileComponents();
    router = TestBed.inject(Router);
    jest
      .spyOn(router, "navigate")
      .mockImplementation(() => Promise.resolve(true));
    fixture = TestBed.createComponent(TestCaseExecutionSummaryComponent);
    component = fixture.componentInstance;
    component.isTestCaseExecutionsLoading.set(false);
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should initialize test case executions correctly filtering on the test execution id", () => {
      expect(component.testCaseExecutionsOfATestExecution()).toEqual([
        testCaseExecution1,
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
    });

    it("should filter out test case executions that are not analyzable", () => {
      testCaseExecutions.set([
        { ...testCaseExecution1, testExecutionId: testExecutionId1 },
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
        { ...testCaseExecution3, testExecutionId: testExecutionId1 },
      ]);
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isAnalyzable")
        .mockImplementation(
          (tce: TestCaseExecution) => tce.id != testCaseExecution1.id
        );
      fixture.detectChanges();

      expect(component.testCaseExecutionsOfATestExecution()).toEqual([
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
        { ...testCaseExecution3, testExecutionId: testExecutionId1 },
      ]);
    });

    it("should initialize the unmapped test case executions exist flag to true if test case executions with no functional test case id exist", () => {
      testCaseExecutions.set([testCaseExecution1, testCaseExecution2]);
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isUnmapped")
        .mockImplementation(
          (tce: TestCaseExecution) => tce.id == testCaseExecution1.id
        );
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(true);
    });

    it("should initialize the unmapped test case executions exist flag to false if all test case executions have a functional test case id", () => {
      testCaseExecutions.set([
        testCaseExecution1,
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(false);
    });

    it("should reset the unmapped test case executions exist flag to false if test case executions changed and all of them have a functional test case id", () => {
      testCaseExecutions.set([
        { ...testCaseExecution1, testExecutionId: testExecutionId1 },
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isUnmapped")
        .mockImplementation(
          (tce: TestCaseExecution) => tce.id == testCaseExecution1.id
        );
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(true);

      testCaseExecutions.set([
        testCaseExecution1,
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isUnmapped")
        .mockImplementation(() => false);
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(false);
    });

    it("should set the unmapped test case executions exist flag to true if test case executions changed and some of them do not have a functional test case id", () => {
      testCaseExecutions.set([
        { ...testCaseExecution1, testExecutionId: testExecutionId1 },
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(false);

      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isUnmapped")
        .mockImplementation(
          (tce: TestCaseExecution) => tce.id == testCaseExecution1.id
        );
      testCaseExecutions.set([
        { ...testCaseExecution1, testExecutionId: testExecutionId1 },
        { ...testCaseExecution2, testExecutionId: testExecutionId1 },
      ]);
      fixture.detectChanges();

      expect(component.unmappedTestCaseExecutionsExist).toBe(true);
    });

    it("should initialize the test execution id correctly", () => {
      expect(component.testExecutionId()).toEqual(testExecutionId1);
    });

    it("should initialize the functional test case base url", () => {
      expect(component.functionalTestCaseBaseUrl).toEqual(
        jiraConfig.functionalTestCaseBaseUrl
      );
    });

    it("should build the functional test case link correctly in the DOM", () => {
      const functionalTestcaseIdUrl = fixture.debugElement.query(
        By.css(`#functional-test-case-id-link-${testCaseExecution1.id}`)
      ).nativeElement as HTMLAnchorElement;
      expect(functionalTestcaseIdUrl.href).toBe(
        `${jiraConfig.functionalTestCaseBaseUrl}${testCaseExecution1.functionalTestCaseId}`
      );
      expect(functionalTestcaseIdUrl.textContent).toContain(
        testCaseExecution1.functionalTestCaseId
      );
    });

    it("should fetch the binary impacts details linked to the test case executions", () => {
      expect(binaryImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        binaryImpactId,
        binaryImpactId2,
      ]);
      expect(component.binaryImpacts()).toEqual([
        {
          ...LITE_BINARY_IMPACT_1,
          id: binaryImpactId,
        },
        {
          ...LITE_BINARY_IMPACT_2,
          id: binaryImpactId2,
        },
      ]);
    });

    it("should handle errors when fetching binary impacts details", () => {
      jest
        .spyOn(binaryImpactService, "fetchByIds")
        .mockReturnValue(throwError(() => "error"));
      component.ngOnInit();
      fixture.detectChanges();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should set the binary impacts to an empty array if no links are present", () => {
      jest.spyOn(binaryImpactService, "fetchByIds").mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.binaryImpacts()).toEqual([]);
    });

    it("should fetch the binary regressions details linked to the test case executions", () => {
      const binaryRegressionIds = [binaryRegressionId, binaryRegressionId2];
      expect(binaryRegressionService.fetchByIds).toHaveBeenCalledWith(
        binaryRegressionIds
      );
      expect(component.binaryRegressions()).toEqual([
        getFirstBinaryRegression(),
        getSecondBinaryRegression(),
      ]);
    });

    it("should handle errors when fetching binary regression details", () => {
      jest
        .spyOn(binaryRegressionService, "fetchByIds")
        .mockReturnValue(throwError(() => "error"));
      component.ngOnInit();
      fixture.detectChanges();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should set the binary regressions to an empty array if no links are present", () => {
      jest.spyOn(binaryRegressionService, "fetchByIds").mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.binaryRegressions()).toEqual([]);
    });

    it("should fetch the configuration impacts details linked to the test case executions", () => {
      expect(configurationImpactService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationImpactId, configurationImpactId2]
      );
      expect(component.configurationImpacts()).toEqual(
        getConfigurationImpacts()
      );
    });

    it("should handle errors when fetching configuration impacts details", () => {
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValue(throwError(() => "error"));
      component.ngOnInit();
      fixture.detectChanges();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should set the configuration impacts to an empty array if no links are present", () => {
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.configurationImpacts()).toEqual([]);
    });

    it("should fetch the configuration regressions details linked to the test case executions", () => {
      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationRegressionId, configurationRegressionId2]
      );
      expect(component.configurationRegressions()).toEqual(
        getConfigurationRegressions()
      );
    });

    it("should handle errors when fetching configuration regressions details", () => {
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValue(throwError(() => "error"));
      component.ngOnInit();
      fixture.detectChanges();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should set the configuration regressions to an empty array if no links are present", () => {
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.configurationRegressions()).toEqual([]);
    });

    it("should fetch the incidents details linked to the test case executions", () => {
      expect(incidentService.fetchIncidentsByIds).toHaveBeenCalledWith([
        analysisObjectId1,
        analysisObjectId2,
      ]);
      expect(component.incidents()).toEqual(getIncidents());
    });

    it("should handle errors when fetching incidents details", () => {
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(throwError(() => "error"));
      component.ngOnInit();
      fixture.detectChanges();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should set the incidents to an empty array if no links are present", () => {
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.incidents()).toEqual([]);
    });

    describe("combine latest", () => {
      let combineLatestSpy: jest.SpyInstance;

      beforeEach(() => {
        combineLatestSpy = jest.spyOn(rxjs, "combineLatest");

        component.ngOnInit();
        fixture.detectChanges();
      });

      afterEach(() => {
        combineLatestSpy.mockRestore();
      });

      it("should call combineLatest to combine all analysis object links", () => {
        expect(combineLatestSpy).toHaveBeenCalledWith([
          component["testCaseExecutions$"],
          component["configurationImpactLinks$"],
          component["configurationRegressionLinks$"],
          component["binaryImpactLinks$"],
          component["binaryRegressionLinks$"],
          component["incidentLinks$"],
        ]);
      });

      it("should retrigger combineLatest when test case executions change", () => {
        const newTestCaseExecutions = [
          testCaseExecution1,
          { ...testCaseExecution2, testExecutionId: "new-exec-id" },
        ];
        jest
          .spyOn(stateService, "getTestCaseExecutions$")
          .mockReturnValue(of(newTestCaseExecutions));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });

      it("should retrigger combineLatest when configuration impact links change", () => {
        const newConfigurationImpactLinks = [
          getAnalysisObjectLink1(configurationImpactType),
          {
            ...getAnalysisObjectLink2(configurationImpactType),
            testCaseExecutionId: testCaseExecutionId2,
          },
        ];
        jest
          .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
          .mockReturnValue(of(newConfigurationImpactLinks));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });

      it("should retrigger combineLatest when binary impact links change", () => {
        const newBinaryImpactLinks = [
          getAnalysisObjectLink1(binaryImpactType),
          {
            ...getAnalysisObjectLink2(binaryImpactType),
            testCaseExecutionId: testCaseExecutionId2,
          },
        ];
        jest
          .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
          .mockReturnValue(of(newBinaryImpactLinks));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });

      it("should retrigger combineLatest when binary regression links change", () => {
        const newBinaryRegressionLinks = [
          getAnalysisObjectLink1(binaryRegressionType),
          {
            ...getAnalysisObjectLink2(binaryRegressionType),
            testCaseExecutionId: testCaseExecutionId2,
          },
        ];
        jest
          .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
          .mockReturnValue(of(newBinaryRegressionLinks));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });

      it("should retrigger combineLatest when configuration regression links change", () => {
        const newConfigurationRegressionLinks = [
          getAnalysisObjectLink1(configurationRegressionType),
          {
            ...getAnalysisObjectLink2(configurationRegressionType),
            testCaseExecutionId: testCaseExecutionId2,
          },
        ];
        jest
          .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
          .mockReturnValue(of(newConfigurationRegressionLinks));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });

      it("should retrigger combineLatest when incident links change", () => {
        const newIncidentLinks = [
          getAnalysisObjectLink1(incidentType),
          {
            ...getAnalysisObjectLink2(incidentType),
            testCaseExecutionId: testCaseExecutionId2,
          },
        ];
        jest
          .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
          .mockReturnValue(of(newIncidentLinks));
        fixture.detectChanges();
        expect(combineLatestSpy).toHaveBeenCalled();
      });
    });
  });

  describe("ngOnDestroy", () => {
    it("should call next and complete on destroy$", () => {
      const destroyNextMock = jest.spyOn(component.destroy$, "next");
      const destroyCompleteMock = jest.spyOn(component.destroy$, "complete");
      component.ngOnDestroy();
      expect(destroyCompleteMock).toHaveBeenCalled();
      expect(destroyNextMock).toHaveBeenCalled();
    });
  });

  describe("test case executions with linked analysis objects", () => {
    it("should return the test case execution with linked analysis objects", () => {
      const testCaseExecutionWithLinkedAnalysisObjects =
        component.testCaseExecutionsSummaryData;
      expect(testCaseExecutionWithLinkedAnalysisObjects().length).toBe(2);
      expect(testCaseExecutionWithLinkedAnalysisObjects()).toEqual([
        getTestCaseExecutionWithLinkedAnalysisObject1(),
        getTestCaseExecutionWithLinkedAnalysisObject2(),
      ]);
    });

    it("should return an empty array of linked analysis objects if no links are present", () => {
      jest
        .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
        .mockReturnValue(of([]));
      jest.spyOn(binaryImpactService, "fetchByIds").mockReturnValue(of([]));
      jest.spyOn(binaryRegressionService, "fetchByIds").mockReturnValue(of([]));
      jest
        .spyOn(configurationImpactService, "fetchByIds")
        .mockReturnValue(of([]));
      jest
        .spyOn(configurationRegressionService, "fetchByIds")
        .mockReturnValue(of([]));
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();
      const testCaseExecutionWithLinks =
        component.testCaseExecutionsSummaryData;
      expect(testCaseExecutionWithLinks().length).toBe(2);
      expect(testCaseExecutionWithLinks()).toEqual([
        {
          ...getTestCaseExecutionWithLinkedAnalysisObject1(),
          linkedRegressions: [],
          linkedImpacts: [],
          linkedIncidents: [],
        },
        {
          ...getTestCaseExecutionWithLinkedAnalysisObject2(),
          linkedRegressions: [],
          linkedImpacts: [],
          linkedIncidents: [],
        },
      ]);
    });
  });

  describe("filtered analysis object links by type and test case execution ids", () => {
    it("should filter the binary impact links linked to test case executions", () => {
      const filteredBinaryImpactLinks =
        component.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
          AnalysisObjectType.BINARY_IMPACT
        ];
      expect(filteredBinaryImpactLinks.length).toBe(2);
      expect(filteredBinaryImpactLinks).toEqual([
        {
          ...getAnalysisObjectLink1(binaryImpactType),
          analysisObjectId: binaryImpactId,
        },
        {
          ...getAnalysisObjectLink2(binaryImpactType),
          testCaseExecutionId: testCaseExecutionId2,
          analysisObjectId: binaryImpactId2,
        },
      ]);
    });

    it("should filter the configuration impact links linked to test case executions", () => {
      const filteredConfigurationImpactLinks =
        component.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
          AnalysisObjectType.CONFIGURATION_IMPACT
        ];
      expect(filteredConfigurationImpactLinks.length).toBe(2);
      expect(filteredConfigurationImpactLinks).toEqual([
        {
          ...getAnalysisObjectLink1(configurationImpactType),
          analysisObjectId: configurationImpactId,
        },
        {
          ...getAnalysisObjectLink2(configurationImpactType),
          testCaseExecutionId: testCaseExecutionId2,
          analysisObjectId: configurationImpactId2,
        },
      ]);
    });

    it("should filter the configuration regression links linked to test case executions", () => {
      const filteredConfigurationRegressionLinks =
        component.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
          AnalysisObjectType.CONFIGURATION_REGRESSION
        ];
      expect(filteredConfigurationRegressionLinks.length).toBe(2);
      expect(filteredConfigurationRegressionLinks).toEqual([
        {
          ...getAnalysisObjectLink1(configurationRegressionType),
          analysisObjectId: configurationRegressionId,
        },
        {
          ...getAnalysisObjectLink2(configurationRegressionType),
          testCaseExecutionId: testCaseExecutionId2,
          analysisObjectId: configurationRegressionId2,
        },
      ]);
    });

    it("should filter the binary regression links linked to test case executions", () => {
      const filteredBinaryRegressionLinks =
        component.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
          AnalysisObjectType.BINARY_REGRESSION
        ];
      expect(filteredBinaryRegressionLinks.length).toBe(2);
      expect(filteredBinaryRegressionLinks).toEqual([
        {
          ...getAnalysisObjectLink1(binaryRegressionType),
          analysisObjectId: binaryRegressionId,
        },
        {
          ...getAnalysisObjectLink2(binaryRegressionType),
          testCaseExecutionId: testCaseExecutionId2,
          analysisObjectId: binaryRegressionId2,
        },
      ]);
    });

    it("should filter the incident links linked to test case executions", () => {
      const filteredIncidentLinks =
        component.analysisObjectLinkedToTestCaseExecutionsGroupedByType()[
          AnalysisObjectType.INCIDENT
        ];
      expect(filteredIncidentLinks.length).toBe(2);
      expect(filteredIncidentLinks).toEqual([
        getAnalysisObjectLink1(incidentType),
        {
          ...getAnalysisObjectLink2(incidentType),
          testCaseExecutionId: testCaseExecutionId2,
        },
      ]);
    });
  });

  function getDebugElementByTestId(testId: string) {
    return DomTestUtils.getElementByTestId(fixture, testId).getDebugElement();
  }

  describe("authorization", () => {
    beforeEach(() => {
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      fixture.detectChanges();
    });

    it("linked incidents should be authorized", () => {
      const linkedIncidentsColumn = getDebugElementByTestId(
        "linked-incidents-data"
      );
      const showIncidentElementDirective = ngMocks.findInstance(
        linkedIncidentsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(showIncidentElementDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("linked impacts should be authorized", () => {
      const linkedBinaryImpactsColumn = getDebugElementByTestId(
        "linked-impacts-data"
      );
      const showBinaryImpactElementDirective = ngMocks.findInstance(
        linkedBinaryImpactsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(showBinaryImpactElementDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("linked regressions should be authorized", () => {
      const linkedBinaryRegressionsColumn = getDebugElementByTestId(
        "linked-regressions-data"
      );
      const showBinaryRegressionElementDirective = ngMocks.findInstance(
        linkedBinaryRegressionsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(
        showBinaryRegressionElementDirective.showElementIfAuthorized
      ).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("linked incidents header should be authorized", () => {
      const linkedIncidentsColumn = getDebugElementByTestId(
        "linked-incidents-header"
      );
      const showIncidentElementDirective = ngMocks.findInstance(
        linkedIncidentsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(showIncidentElementDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("analysis status header should be authorized", () => {
      const analysisStatusColumn = getDebugElementByTestId(
        "analysis-status-header"
      );
      const showAnalysisStatusElementDirective = ngMocks.findInstance(
        analysisStatusColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(
        showAnalysisStatusElementDirective.showElementIfAuthorized
      ).toEqual({
        action: "read_analysis_status",
        attributes: {},
        package: "test",
        resource: "scenario_execution",
      });
    });

    it("linked impacts header should be authorized", () => {
      const linkedBinaryImpactsColumn = getDebugElementByTestId(
        "linked-impacts-header"
      );
      const showBinaryImpactElementDirective = ngMocks.findInstance(
        linkedBinaryImpactsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(showBinaryImpactElementDirective.showElementIfAuthorized).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });

    it("linked regressions header should be authorized", () => {
      const linkedBinaryRegressionsColumn = getDebugElementByTestId(
        "linked-regressions-header"
      );
      const showBinaryRegressionElementDirective = ngMocks.findInstance(
        linkedBinaryRegressionsColumn,
        ShowElementIfAuthorizedDirective
      );
      expect(
        showBinaryRegressionElementDirective.showElementIfAuthorized
      ).toEqual({
        action: "view",
        attributes: {},
        package: "web",
        resource: "analysis_object",
      });
    });
  });

  describe("testCaseExecutionsSummaryLinkedIncidentsIds", () => {
    it("should be displayed as a tooltip on the linked incidents column", () => {
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      const linkedIncidentsIds = `${INCIDENT_1.externalIssue.id}`;

      expect(
        getTooltipTextByTestId(fixture, "linked-incident-display")
      ).toEqual(linkedIncidentsIds);
    });
  });

  describe("getLinkedImpactsTitles", () => {
    it("should be displayed as a tooltip on the linked impacts column", () => {
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      const expectedLinkedImpactsTitles = [
        LITE_BINARY_IMPACT_1.title,
        getConfigurationImpact().title,
      ].join(", ");

      expect(getTooltipTextByTestId(fixture, "linked-impacts-display")).toEqual(
        expectedLinkedImpactsTitles
      );
    });
  });

  describe("getLinkedRegressionsTitles", () => {
    it("should be displayed as a tooltip on the linked regressions column", () => {
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      const linkedRegressionsTitles = [
        LITE_BINARY_REGRESSION_1.title,
        LITE_CONFIGURATION_REGRESSION_1.title,
      ].join(", ");

      expect(
        getTooltipTextByTestId(fixture, "linked-regressions-display")
      ).toEqual(linkedRegressionsTitles);
    });
  });

  describe("filter test case executions", () => {
    describe("filter on status", () => {
      it("should initialize the selected status filters to empty", () => {
        expect(component.selectedStatusFilters()).toEqual([]);
      });

      it("should initialize the status filter options correctly", () => {
        expect(component.statusFilterOptions).toEqual([
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.NOT_STARTED
            ],
            value: TestCaseExecutionStatus.NOT_STARTED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.UNDERWAY
            ],
            value: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.PASSED
            ],
            value: TestCaseExecutionStatus.PASSED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.FAILED
            ],
            value: TestCaseExecutionStatus.FAILED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.NA
            ],
            value: TestCaseExecutionStatus.NA,
          },
        ]);
      });

      it("should apply the status checkbox filter and highlight its trigger", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            id: "status-filter-1",
            status: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            ...testCaseExecution2,
            id: "status-filter-2",
            testExecutionId: testExecutionId1,
            status: TestCaseExecutionStatus.FAILED,
          },
        ]);
        fixture.detectChanges();

        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          [TestCaseExecutionStatus.UNDERWAY]
        );

        expect(getTableHarness().getRowsCount()).toBe(1);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "summary-status-filter"
          )
        ).toBe(true);
      });

      it("should clear the status checkbox filter and remove its highlight", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            id: "status-filter-clear-1",
            status: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            ...testCaseExecution2,
            id: "status-filter-clear-2",
            testExecutionId: testExecutionId1,
            status: TestCaseExecutionStatus.FAILED,
          },
        ]);
        fixture.detectChanges();

        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          [TestCaseExecutionStatus.UNDERWAY]
        );
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          []
        );

        expect(getTableHarness().getRowsCount()).toBe(2);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "summary-status-filter"
          )
        ).toBe(false);
      });
    });

    describe("filter on analysis status", () => {
      it("should initialize the analysis status filter options correctly", () => {
        expect(component.analysisStatusFilterOptions).toEqual([
          {
            text: TestCaseExecutionAnalysisStatusDisplayValue[
              TestCaseExecutionAnalysisStatus.NA
            ],
            value: TestCaseExecutionAnalysisStatus.NA,
          },
          {
            text: TestCaseExecutionAnalysisStatusDisplayValue[
              TestCaseExecutionAnalysisStatus.INCIDENT_SENT
            ],
            value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
          },
          {
            text: TestCaseExecutionAnalysisStatusDisplayValue[
              TestCaseExecutionAnalysisStatus.PASSED
            ],
            value: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            text: TestCaseExecutionAnalysisStatusDisplayValue[
              TestCaseExecutionAnalysisStatus.FAILED
            ],
            value: TestCaseExecutionAnalysisStatus.FAILED,
          },
          {
            text: TestCaseExecutionAnalysisStatusDisplayValue[
              TestCaseExecutionAnalysisStatus.CANCELLED
            ],
            value: TestCaseExecutionAnalysisStatus.CANCELLED,
          },
        ]);
      });

      it("should apply the analysis status checkbox filter and highlight its trigger", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            id: "analysis-filter-1",
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution2,
            id: "analysis-filter-2",
            testExecutionId: testExecutionId1,
            analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
          },
        ] as TestCaseExecution[]);
        fixture.detectChanges();
        authMockSetup(fixture);

        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          [TestCaseExecutionAnalysisStatus.INCIDENT_SENT]
        );

        expect(getTableHarness().getRowsCount()).toBe(1);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "summary-analysis-status-filter"
          )
        ).toBe(true);
      });

      it("should clear the analysis status checkbox filter and remove its highlight", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            id: "analysis-filter-clear-1",
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution2,
            id: "analysis-filter-clear-2",
            testExecutionId: testExecutionId1,
            analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
          },
        ] as TestCaseExecution[]);
        fixture.detectChanges();
        authMockSetup(fixture);

        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          [TestCaseExecutionAnalysisStatus.INCIDENT_SENT]
        );
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          []
        );

        expect(getTableHarness().getRowsCount()).toBe(2);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "summary-analysis-status-filter"
          )
        ).toBe(false);
      });
    });

    describe("Test case summary count", () => {
      it("should show full count when no filters are applied", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            status: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            ...testCaseExecution2,
            testExecutionId: testExecutionId1,
            status: TestCaseExecutionStatus.PASSED,
          },
        ]);
        fixture.detectChanges();

        authMockSetup(fixture);
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          []
        );
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          []
        );
        applyTextFilterByTestId(fixture, "title-column-filter", "");
        applyTextFilterByTestId(fixture, "functional-id-column-filter", "");

        const countElementText = getTestCaseExecutionCountElementText(fixture);
        expect(countElementText).toContain(`Showing 2 of 2`);
      });

      it("should update count when filtering by status only", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            status: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            ...testCaseExecution2,
            testExecutionId: testExecutionId1,
            status: TestCaseExecutionStatus.PASSED,
          },
        ]);
        fixture.detectChanges();

        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          [TestCaseExecutionStatus.UNDERWAY]
        );

        const countElementText = getTestCaseExecutionCountElementText(fixture);
        expect(countElementText).toContain(`Showing 1 of 2`);
      });

      it("should update count when filtering by analysis status only", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
          },
          {
            ...testCaseExecution2,
            testExecutionId: testExecutionId1,
            analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
          },
        ]);
        fixture.detectChanges();
        authMockSetup(fixture);
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          [TestCaseExecutionAnalysisStatus.INCIDENT_SENT]
        );

        const countElement = fixture.debugElement.query(
          By.css('[data-testId="test-case-execution-count"]')
        ).nativeElement as HTMLDivElement;
        expect(countElement.textContent?.trim()).toContain(`Showing 1 of 2`);
      });

      it("should update count when filtering by title", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            title: "Test Case Alpha",
          },
          {
            ...testCaseExecution1,
            title: "Test Case B",
          },
        ]);
        fixture.detectChanges();
        applyTextFilterByTestId(
          fixture,
          "title-column-filter",
          "Test Case Alpha"
        );

        const countElementText = getTestCaseExecutionCountElementText(fixture);
        expect(countElementText).toContain(`Showing 1 of 2`);
      });

      it("should update count when filtering on test case ticket", () => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            functionalTestCaseId: "JIRA-Alpha",
          },
          {
            ...testCaseExecution1,
            functionalTestCaseId: "JIRA-B",
          },
        ]);
        fixture.detectChanges();
        applyTextFilterByTestId(
          fixture,
          "functional-id-column-filter",
          "Alpha"
        );

        const countElementText = getTestCaseExecutionCountElementText(fixture);
        expect(countElementText).toContain(`Showing 1 of 2`);
      });

      it("should update count correctly when filtering on all test case criteria", fakeAsync(() => {
        testCaseExecutions.set([
          {
            ...testCaseExecution1,
            title: "Test Case Alpha",
            functionalTestCaseId: "JIRA-1",
            status: TestCaseExecutionStatus.PASSED,
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution1,
            title: "Test Case Beta",
            functionalTestCaseId: "JIRA-1",
            status: TestCaseExecutionStatus.PASSED,
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution1,
            title: "Test Case Alpha",
            functionalTestCaseId: "JIRA-Beta",
            status: TestCaseExecutionStatus.PASSED,
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution1,
            title: "Test Case Alpha",
            functionalTestCaseId: "JIRA-1",
            status: TestCaseExecutionStatus.FAILED,
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
          },
          {
            ...testCaseExecution1,
            title: "Test Case Alpha",
            functionalTestCaseId: "JIRA-1",
            status: TestCaseExecutionStatus.PASSED,
            analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
          },
        ]);
        fixture.detectChanges();
        applyTextFilterByTestId(
          fixture,
          "title-column-filter",
          "Test Case Alpha"
        );
        authMockSetup(fixture);
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-status-filter",
          [TestCaseExecutionStatus.PASSED]
        );
        getTableHarness().applyCheckboxColumnFilterById(
          "summary-analysis-status-filter",
          [TestCaseExecutionAnalysisStatus.PASSED]
        );
        tick(1000);
        applyTextFilterByTestId(fixture, "functional-id-column-filter", "1");
        tick(1000);
        fixture.detectChanges();

        const countElementText = getTestCaseExecutionCountElementText(fixture);
        expect(countElementText).toContain(`Showing 1 of 5`);
      }));
    });

    describe("filter incidents", () => {
      beforeEach(() => {
        authMockSetup(fixture);
      });

      it("should filter incidents column when text filter is applied", fakeAsync(() => {
        applyTextFilterByTestId(
          fixture,
          "linked-incidents-header-filter",
          "ext id 1"
        );
        expect(getTableHarness().getRowsCount()).toBe(1);
      }));

      it("should show all rows when incident filter is cleared", () => {
        expect(getTableHarness().getRowsCount()).toBe(2);
      });
    });

    describe("filter impacts", () => {
      beforeEach(() => {
        authMockSetup(fixture);
      });

      it("should filter impacts column when text filter is applied", fakeAsync(() => {
        applyTextFilterByTestId(
          fixture,
          "linked-impacts-header-filter",
          "title1"
        );
        expect(getTableHarness().getRowsCount()).toBe(1);
      }));

      it("should show all rows when impact filter is cleared", () => {
        expect(getTableHarness().getRowsCount()).toBe(2);
      });
    });

    describe("filter regressions", () => {
      beforeEach(() => {
        authMockSetup(fixture);
      });

      it("should filter regressions column when text filter is applied", fakeAsync(() => {
        applyTextFilterByTestId(
          fixture,
          "linked-regressions-header-filter",
          "Binary Regression 1"
        );
        expect(getTableHarness().getRowsCount()).toBe(1);
      }));

      it("should show all rows when regression filter is cleared", () => {
        expect(getTableHarness().getRowsCount()).toBe(2);
      });
    });
  });

  it("should initialize the test execution id correctly", () => {
    expect(component.testExecutionId()).toEqual(testExecutionId1);
  });

  it("should display the start date correctly if present", () => {
    const startDate = fixture.debugElement.query(
      By.css(`#test-case-execution-start-date-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(startDate).toBeTruthy();

    const emptyStartDate = fixture.debugElement.query(
      By.css(`#test-case-execution-start-date-empty-${testCaseExecutionId1}`)
    );
    expect(emptyStartDate).toBeFalsy();

    expect(startDate).toContain(
      datePipe.transform(testCaseExecution1.startDate, "medium")
    );
  });

  it("should display the start date correctly if missing", () => {
    testCaseExecutions.set([{ ...testCaseExecution1, startDate: undefined }]);
    fixture.detectChanges();
    const startDate = fixture.debugElement.query(
      By.css(`#test-case-execution-start-date-${testCaseExecutionId1}`)
    );
    expect(startDate).toBeFalsy();

    const emptyStartDate = fixture.debugElement.query(
      By.css(`#test-case-execution-start-date-empty-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(emptyStartDate).toBeTruthy();

    expect(emptyStartDate).toContain("-");
  });

  it("should display the end date correctly if present", () => {
    const endDate = fixture.debugElement.query(
      By.css(`#test-case-execution-end-date-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(endDate).toBeTruthy();

    const emptyEndDate = fixture.debugElement.query(
      By.css(`#test-case-execution-end-date-empty-${testCaseExecutionId1}`)
    );
    expect(emptyEndDate).toBeFalsy();

    expect(endDate).toContain(
      datePipe.transform(testCaseExecution1.endDate, "medium")
    );
  });

  it("should display the end date correctly if missing", () => {
    testCaseExecutions.set([{ ...testCaseExecution1, endDate: undefined }]);
    fixture.detectChanges();
    const endDate = fixture.debugElement.query(
      By.css(`#test-case-execution-end-date-${testCaseExecutionId1}`)
    );
    expect(endDate).toBeFalsy();

    const emptyEndDate = fixture.debugElement.query(
      By.css(`#test-case-execution-end-date-empty-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(emptyEndDate).toBeTruthy();

    expect(emptyEndDate).toContain("-");
  });

  it("should display the duration correctly if both start and end dates are present", () => {
    const duration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(duration).toBeTruthy();

    const emptyDuration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-empty-${testCaseExecutionId1}`)
    );
    expect(emptyDuration).toBeFalsy();

    expect(duration).toContain(
      durationPipe.transform(
        testCaseExecution1.startDate,
        testCaseExecution1.endDate
      )
    );
  });

  it("should display the duration correctly if only start date is missing", () => {
    testCaseExecutions.set([{ ...testCaseExecution1, startDate: undefined }]);
    fixture.detectChanges();
    const duration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-${testCaseExecutionId1}`)
    );
    expect(duration).toBeFalsy();

    const emptyDuration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-empty-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(emptyDuration).toBeTruthy();

    expect(emptyDuration).toContain("-");
  });

  it("should display the duration correctly if only the end date is missing", () => {
    testCaseExecutions.set([{ ...testCaseExecution1, endDate: undefined }]);
    fixture.detectChanges();
    const duration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-${testCaseExecutionId1}`)
    );
    expect(duration).toBeFalsy();

    const emptyDuration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-empty-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(emptyDuration).toBeTruthy();

    expect(emptyDuration).toContain("-");
  });

  it("should display the duration correctly if both start and end dates are missing", () => {
    testCaseExecutions.set([
      { ...testCaseExecution1, startDate: undefined, endDate: undefined },
    ]);
    fixture.detectChanges();
    const duration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-${testCaseExecutionId1}`)
    );
    expect(duration).toBeFalsy();

    const emptyDuration = fixture.debugElement.query(
      By.css(`#test-case-execution-duration-empty-${testCaseExecutionId1}`)
    ).nativeElement.textContent;
    expect(emptyDuration).toBeTruthy();

    expect(emptyDuration).toContain("-");
  });

  it("should navigate back correctly when the user clicks the back button", () => {
    getBackButtonHarness().click();
    expect(router.navigate).toHaveBeenCalledWith(
      [`/app/${projectId}/test/execution/details/${scenarioExecutionId}`],
      { replaceUrl: true }
    );
  });

  it("should be loading if the test case execution summary is still loading", () => {
    component.isTestCaseExecutionsLoading.set(true);
    isLoading.set(false);
    fixture.detectChanges();
    expect(component.isLoading()).toBeTruthy();
  });

  it("should be loading if the scenario execution details screen is still loading", () => {
    component.isTestCaseExecutionsLoading.set(false);
    isLoading.set(true);
    fixture.detectChanges();
    expect(component.isLoading()).toBeTruthy();
  });

  it("should not be loading if both are not loading", () => {
    component.isTestCaseExecutionsLoading.set(false);
    isLoading.set(false);
    fixture.detectChanges();
    expect(component.isLoading()).toBeFalsy();
  });

  it("should set the test execution id on init of the test execution currently being viewed in the report", () => {
    component.ngOnInit();
    expect(stateService.setCurrentlyViewedTestExecutionId).toHaveBeenCalledWith(
      testExecutionId1
    );
  });

  it("should set the test execution id to undefined when the test execution report is closed", () => {
    component.ngOnDestroy();
    expect(stateService.setCurrentlyViewedTestExecutionId).toHaveBeenCalledWith(
      undefined
    );
  });
  describe("loading", () => {
    it("should display loading template on loading if user is not authorized to view analysis objects", () => {
      isLoading.set(true);
      fixture.detectChanges();
      const firstRow = fixture.debugElement.query(By.css("tr:nth-of-type(2)"));
      const loadingSkeletons = firstRow.queryAll(By.css("p-skeleton"));
      expect(loadingSkeletons.length).toEqual(7);
    });

    it("should display loading template on loading if user is authorized to view analysis objects", () => {
      isLoading.set(true);
      fixture.detectChanges();
      ngMocks
        .findInstances(ShowElementIfAuthorizedDirective)
        .forEach((authDirective) =>
          ngMocks.render(authDirective, authDirective)
        );
      fixture.detectChanges();
      const firstRow = fixture.debugElement.query(By.css("tr:nth-of-type(2)"));
      const loadingSkeletons = firstRow.queryAll(By.css("p-skeleton"));
      expect(loadingSkeletons.length).toEqual(10);
    });
  });

  it("should display a warning message if some test cases are misconfigured", () => {
    testCaseExecutions.set([testCaseExecution1, testCaseExecution2]);
    jest
      .spyOn(testCaseExecutionAnalyzabilityService, "isUnmapped")
      .mockImplementation(
        (tce: TestCaseExecution) => tce.id == testCaseExecution1.id
      );
    fixture.detectChanges();

    const warningMessage = fixture.debugElement.query(
      By.css('[data-testid="unmapped-test-cases-warning-message"]')
    );
    expect(warningMessage).toBeTruthy();
  });

  it("should not display a warning message if all test cases are configured properly", () => {
    testCaseExecutions.set([
      testCaseExecution1,
      { ...testCaseExecution2, testExecutionId: testExecutionId1 },
    ]);
    fixture.detectChanges();

    const warningMessage = fixture.debugElement.query(
      By.css('[data-testid="unmapped-test-cases-warning-message"]')
    );
    expect(warningMessage).toBeFalsy();
  });

  describe("view test unit links button", () => {
    const LINK: TestUnitAnalysisObjectLink = {
      projectId: "project-1",
      scenarioExecutionId: "se-1",
      testCaseExecution: { id: "tce-1", externalId: "ext-123" },
      analysisObject: {
        id: "ao-1",
        type: AnalysisObjectType.BINARY_REGRESSION,
        title: "Binary Regression Title",
        readableId: "BR-001",
      },
      testUnitId: "tu-1",
    };

    function getViewTestUnitLinksButtonHarness(testCaseExecutionId: string) {
      return DomTestUtils.getButtonByTestId(
        fixture,
        `view-test-unit-links-button-${testCaseExecutionId}`
      );
    }

    it("should be disabled when test case has no analysis object links in test unit", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);
      testCaseExecutions.set([{ ...testCaseExecution1 }]);
      fixture.detectChanges();

      const button = getViewTestUnitLinksButtonHarness(testCaseExecutionId1);
      expect(button.isDisabled()).toBe(true);
    });

    it("should be enabled when test case has analysis object links in test unit", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set(testCaseExecution1.externalId, [
        {} as TestUnitAnalysisObjectLink,
      ]);
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);

      testCaseExecutions.set([{ ...testCaseExecution1 }]);
      fixture.detectChanges();

      const button = getViewTestUnitLinksButtonHarness(testCaseExecutionId1);
      expect(button.isDisabled()).toBe(false);
    });

    it("should open the drawer when clicked", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set(testCaseExecution1.externalId, [LINK]);
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);
      testCaseExecutions.set([{ ...testCaseExecution1 }]);

      fixture.detectChanges();

      const button = getViewTestUnitLinksButtonHarness(testCaseExecutionId1);
      button.click();
      fixture.detectChanges();

      expect(component.drawerVisible).toBe(true);
    });

    it("should set the selected test case execution when clicked", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set(testCaseExecution1.externalId, [LINK]);
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);
      testCaseExecutions.set([{ ...testCaseExecution1 }]);

      fixture.detectChanges();

      const button = getViewTestUnitLinksButtonHarness(testCaseExecutionId1);
      button.click();
      fixture.detectChanges();

      expect(component.selectedTestCaseExecution()).toEqual(testCaseExecution1);
    });

    it("should show 'View test unit links' tooltip when test case has analysis object links in test unit", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      linksMap.set(testCaseExecution1.externalId, [LINK]);
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);
      testCaseExecutions.set([{ ...testCaseExecution1 }]);
      fixture.detectChanges();

      const tooltipText = getTooltipTextByTestId(
        fixture,
        `view-test-unit-links-button-${testCaseExecutionId1}`
      );
      expect(tooltipText).toBe("View test unit links");
    });

    it("should show 'Test Case has no Incidents or Detections linked' tooltip when test case has no analysis object links in test unit", () => {
      const linksMap = new Map<string, TestUnitAnalysisObjectLink[]>();
      testCaseTestUnitAnalysisObjectLinksMapMock.set(linksMap);
      testCaseExecutions.set([{ ...testCaseExecution1 }]);
      fixture.detectChanges();

      const tooltipText = getTooltipTextByTestId(
        fixture,
        `view-test-unit-links-button-${testCaseExecutionId1}`
      );
      expect(tooltipText).toBe(
        "Test Case has no Incidents or Detections linked"
      );
    });
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "test-case-execution-summary-table"
    );
  }

  function getBackButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "summary-report-back-button"
    );
  }
});
