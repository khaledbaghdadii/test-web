import { ValidationSummaryComponent } from "./validation-summary.component";
import { ValidationSummaryService } from "./validation-summary.service";
import { of, throwError } from "rxjs";
import { BarColor, StackedBarItem } from "@mxflow/ui/bar";
import { EventEmitter, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { MockComponents, MockDirectives, ngMocks } from "ng-mocks";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { By } from "@angular/platform-browser";
import {
  ScenarioDetections,
  TestUnitModel,
  TestUnitScenarioExecutionModel,
  TestUnitService,
  ValidationDetectionsSummaryComponent,
} from "@mxflow/test-management";
import {
  Incident,
  IncidentService,
  IncidentsSummaryComponent,
  IncidentSummary,
} from "@mxflow/features/incident-management";

describe("ValidationSummaryComponent", () => {
  let fixture: ComponentFixture<ValidationSummaryComponent>;
  let component: ValidationSummaryComponent;
  let validationSummaryService: ValidationSummaryService;
  let testUnitService: TestUnitService;
  let incidentService: IncidentService;

  beforeEach(waitForAsync(() => {
    initServicesMocks();

    TestBed.configureTestingModule({
      imports: [ValidationSummaryComponent],
      declarations: [
        MockComponents(
          IncidentsSummaryComponent,
          ValidationDetectionsSummaryComponent
        ),
        MockDirectives(ShowElementIfAuthorizedDirective),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(ValidationSummaryComponent, {
      set: {
        providers: [
          {
            provide: ValidationSummaryService,
            useValue: validationSummaryService,
          },
          { provide: ActivatedRoute, useValue: {} },
          { provide: TestUnitService, useValue: testUnitService },
          { provide: IncidentService, useValue: incidentService },
        ],
      },
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationSummaryComponent);
    component = fixture.componentInstance;
    component.projectId = "projectId";
    component.contextId = "contextId";
    component.subContextId = "subContextId";
    component.bpExecutionName = "mockBpExecutionName";

    fixture.detectChanges();
    ngMocks
      .findInstances(ShowElementIfAuthorizedDirective)
      .forEach((authDirective) => ngMocks.render(authDirective, authDirective));
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should compute incident summary correctly on init if no test units are found", () => {
    jest
      .spyOn(testUnitService, "fetch")
      .mockReturnValueOnce(of([] as TestUnitModel[]));
    jest
      .spyOn(validationSummaryService, "mergeDistinctDetections")
      .mockReturnValue({
        binaryRegressionIds: [],
        configurationRegressionIds: [],
        binaryImpactIds: [],
        configurationImpactIds: [],
        failureReasonIds: [],
      });
    jest
      .spyOn(validationSummaryService, "groupLinkedIncidentsStatuses")
      .mockReturnValue({ statuses: [] });
    component.ngOnInit();
    expect(component.incidentSummary).toEqual({ statuses: [] });
  });

  it("should compute incident summary correctly if no incidents are linked", () => {
    jest
      .spyOn(testUnitService, "fetch")
      .mockReturnValueOnce(of([getTestUnit3()] as TestUnitModel[]));
    jest
      .spyOn(validationSummaryService, "mergeDistinctDetections")
      .mockReturnValue({
        binaryRegressionIds: [],
        configurationRegressionIds: [],
        binaryImpactIds: [],
        configurationImpactIds: [],
        failureReasonIds: [],
      });
    jest
      .spyOn(validationSummaryService, "groupLinkedIncidentsStatuses")
      .mockReturnValue({ statuses: [] });
    jest
      .spyOn(incidentService, "fetchIncidentsByIds")
      .mockReturnValueOnce(of([] as Incident[]));
    component.ngOnInit();
    expect(component.incidentSummary).toEqual({ statuses: [] });
  });

  it("should compute incident summary of all scenario executions correctly on init", () => {
    expect(component.incidentSummary).toEqual(getIncidentStatusesSummary());
  });

  it("should compute scenario detections of all scenario executions summary correctly on init", () => {
    expect(component.scenarioDetections).toEqual(getMergedDetections());
  });

  it("should compute scenario status summary of head scenario executions correctly on init", () => {
    expect(component.scenarioStatusSummaryStackedBarItems).toEqual(
      getScenarioStatusStackedBarInput()
    );
  });

  it("should compute scenario analysis status of head scenario executions correctly on init", () => {
    expect(component.analysisStatusSummaryStackedBarItems).toEqual(
      getAnalysisStatusStackedBarInput()
    );
  });

  it("should set the loading to false after init", () => {
    expect(component.loading).toBeFalsy();
  });

  it("should handle error correctly if failed to fetch test units", () => {
    component.errorOccurred = {
      emit: jest.fn(),
    } as unknown as EventEmitter<string>;
    jest
      .spyOn(testUnitService, "fetch")
      .mockReturnValueOnce(throwError(() => "errorMessage"));
    component.ngOnInit();
    expect(component.errorOccurred.emit).toHaveBeenCalledWith("errorMessage");
  });

  it("should handle error correctly if failed to fetch incident details to compute the validation summary", () => {
    component.errorOccurred = {
      emit: jest.fn(),
    } as unknown as EventEmitter<string>;
    jest
      .spyOn(incidentService, "fetchIncidentsByIds")
      .mockReturnValue(throwError(() => "errorMessage"));
    component.ngOnInit();
    expect(component.errorOccurred.emit).toHaveBeenCalledWith("errorMessage");
  });

  it("should hide the analysis status correctly if not authorized", () => {
    const analysisStatusSummaryComponent = fixture.debugElement.query(
      By.css("#analysis-status-summary")
    );
    expect(analysisStatusSummaryComponent).toBeTruthy();
    const analysisStatusSummaryWithDirective = ngMocks.findInstance(
      analysisStatusSummaryComponent,
      ShowElementIfAuthorizedDirective
    );
    ngMocks.render(
      analysisStatusSummaryWithDirective,
      analysisStatusSummaryWithDirective
    );
    expect(analysisStatusSummaryWithDirective.showElementIfAuthorized).toEqual({
      action: "read_analysis_status",
      attributes: {},
      package: "test",
      resource: "scenario_execution",
    });
  });

  it("should add the authorization directive with the correct input for the aggregated detections", () => {
    const aggregatedDetectionsComponent = fixture.debugElement.query(
      By.css("#aggregated-detections")
    );
    expect(aggregatedDetectionsComponent).toBeTruthy();

    const aggregatedDetectionsWithDirective = ngMocks.findInstance(
      aggregatedDetectionsComponent,
      ShowElementIfAuthorizedDirective
    );

    ngMocks.render(
      aggregatedDetectionsWithDirective,
      aggregatedDetectionsWithDirective
    );
    expect(aggregatedDetectionsWithDirective.showElementIfAuthorized).toEqual({
      action: "view",
      attributes: {},
      package: "web",
      resource: "analysis_object",
    });
  });

  it("should add the authorization directive with the correct input for the aggregated incidents", () => {
    const aggregatedIncidentView = fixture.debugElement.query(
      By.css("#aggregated-incidents")
    );
    expect(aggregatedIncidentView).toBeTruthy();
    const aggregatedIncidentsViewWithDirective = ngMocks.findInstance(
      aggregatedIncidentView,
      ShowElementIfAuthorizedDirective
    );
    ngMocks.render(
      aggregatedIncidentsViewWithDirective,
      aggregatedIncidentsViewWithDirective
    );
    expect(
      aggregatedIncidentsViewWithDirective.showElementIfAuthorized
    ).toEqual({
      action: "view",
      attributes: {},
      package: "web",
      resource: "analysis_object",
    });
  });

  function initServicesMocks() {
    validationSummaryService = {
      mergeDistinctDetections: jest.fn((scenarioExecutions) => {
        return equalArrays(scenarioExecutions, getAllScenarioExecutions())
          ? getMergedDetections()
          : null;
      }),
      groupLinkedIncidentsStatuses: jest.fn((incidents) => {
        return equalArrays(incidents, getIncidents())
          ? getIncidentStatusesSummary()
          : null;
      }),
      constructScenarioStatusStackedBarInput: jest.fn((scenarioExecutions) => {
        return equalArrays(scenarioExecutions, getHeadScenarioExecutions())
          ? getScenarioStatusStackedBarInput()
          : null;
      }),
      constructAnalysisStatusStackedBarInput: jest.fn((scenarioExecutions) => {
        return equalArrays(scenarioExecutions, getHeadScenarioExecutions())
          ? getAnalysisStatusStackedBarInput()
          : null;
      }),
    } as unknown as jest.Mocked<ValidationSummaryService>;

    testUnitService = {
      fetch: jest.fn(() => of(getTestUnits())),
      getHeadScenarioExecution: jest.fn((testUnit: TestUnitModel) => {
        if (testUnit.id === getTestUnit1().id) {
          return getTestUnit1HeadScenarioExecution();
        } else if (testUnit.id === getTestUnit2().id) {
          return getTestUnit2HeadScenarioExecution();
        } else if (testUnit.id === getTestUnit3().id) {
          return getTestUnit3HeadScenarioExecution();
        } else {
          return null;
        }
      }),
    } as unknown as TestUnitService;

    incidentService = {
      fetchIncidentsByIds: jest.fn((incidentIds) => {
        if (
          equalArrays(incidentIds, [
            "incidentId1",
            "incidentId2",
            "incidentId3",
            "incidentId4",
            "incidentId5",
          ])
        ) {
          return of(getIncidents());
        } else if (incidentIds.length === 0) {
          return of([]);
        } else {
          return null;
        }
      }),
    } as unknown as jest.Mocked<IncidentService>;
  }
});

function getIncidentStatusesSummary(): IncidentSummary {
  return {
    statuses: [
      { name: "status", count: 1 },
      { name: "status1", count: 2 },
    ],
  };
}

function getMergedDetections(): ScenarioDetections {
  return {
    binaryRegressionIds: ["binaryRegressionId1", "binaryRegressionId2"],
    configurationRegressionIds: [
      "configurationRegressionId1",
      "configurationRegressionId2",
    ],
    binaryImpactIds: ["binaryImpactId1", "binaryImpactId2"],
    configurationImpactIds: [
      "configurationImpactId1",
      "configurationImpactId2",
    ],
    failureReasonIds: ["failureReasonId1", "failureReasonId2"],
  };
}

function getScenarioStatusStackedBarInput(): StackedBarItem[] {
  return [
    {
      label: "Passed",
      color: BarColor.Green,
      value: 1,
    },
    {
      label: "Underway",
      color: BarColor.Yellow,
      value: 0,
    },
    {
      label: "Failed",
      color: BarColor.Red,
      value: 1,
    },
  ];
}

function getAnalysisStatusStackedBarInput(): StackedBarItem[] {
  return [
    {
      label: "Passed",
      color: BarColor.Green,
      value: 1,
    },
    {
      label: "Under Analysis",
      color: BarColor.Yellow,
      value: 0,
    },
    {
      label: "Failed",
      color: BarColor.Red,
      value: 0,
    },
    {
      label: "Cancelled",
      color: BarColor.LightGray,
      value: 1,
    },
    {
      label: "N/A",
      color: BarColor.Gray,
      value: 0,
    },
    {
      label: "Assigned",
      color: BarColor.Blue,
      value: 0,
    },
    {
      label: "Incident Sent",
      color: BarColor.Indigo,
      value: 0,
    },
  ];
}

function getTestUnits(): TestUnitModel[] {
  return [getTestUnit1(), getTestUnit2(), getTestUnit3()];
}

function getTestUnit1() {
  return {
    id: "testUnitId1",
    headScenarioExecution: getTestUnit1HeadScenarioExecution(),
    scenarioExecutions: [
      getTestUnit1HeadScenarioExecution(),
      getTestUnitScenarioExecution({ id: "tu1-se2" }),
    ],
  } as TestUnitModel;
}

function getTestUnit2() {
  return {
    id: "testUnitId2",
    headScenarioExecution: getTestUnit2HeadScenarioExecution(),
    scenarioExecutions: [
      getTestUnit2HeadScenarioExecution(),
      getTestUnitScenarioExecution({ id: "tu2-se2" }),
    ],
  } as TestUnitModel;
}

function getTestUnit3() {
  return {
    id: "testUnitId3",
    headScenarioExecution: getTestUnit3HeadScenarioExecution(),
    scenarioExecutions: [
      getTestUnit3HeadScenarioExecution(),
      getTestUnitScenarioExecution({ id: "tu3-se2" }),
    ],
  } as TestUnitModel;
}

function getTestUnit1HeadScenarioExecution(): TestUnitScenarioExecutionModel {
  return {
    id: "scenarioExecutionId1",
    analysisObjects: {
      incidents: ["incidentId1", "incidentId2"],
    },
  } as TestUnitScenarioExecutionModel;
}

function getTestUnit2HeadScenarioExecution(): TestUnitScenarioExecutionModel {
  return {
    id: "scenarioExecutionId2",
    analysisObjects: {
      incidents: ["incidentId2", "incidentId3"],
    },
  } as TestUnitScenarioExecutionModel;
}

function getTestUnit3HeadScenarioExecution(): TestUnitScenarioExecutionModel {
  return {
    id: "scenarioExecutionId3",
    analysisObjects: {
      incidents: [] as string[],
    },
  } as TestUnitScenarioExecutionModel;
}

function getTestUnitScenarioExecution(
  overrides?: Partial<TestUnitScenarioExecutionModel>
): TestUnitScenarioExecutionModel {
  return {
    id: "scenarioExecutionId",
    analysisObjects: {
      incidents: ["incidentId4", "incidentId5"],
    },
    ...overrides,
  } as TestUnitScenarioExecutionModel;
}

function getIncidents(): Incident[] {
  return [
    { id: "incidentId1", status: "status" } as Incident,
    { id: "incidentId2", status: "status1" } as Incident,
    { id: "incidentId3", status: "status1" } as Incident,
    { id: "incidentId4", status: "status2" } as Incident,
    { id: "incidentId5", status: "status3" } as Incident,
  ];
}

function getHeadScenarioExecutions() {
  return [
    getTestUnit1HeadScenarioExecution(),
    getTestUnit2HeadScenarioExecution(),
    getTestUnit3HeadScenarioExecution(),
  ];
}

function getAllScenarioExecutions() {
  return [
    getTestUnit1HeadScenarioExecution(),
    getTestUnit2HeadScenarioExecution(),
    getTestUnit3HeadScenarioExecution(),
    getTestUnitScenarioExecution({ id: "tu1-se2" }),
    getTestUnitScenarioExecution({ id: "tu2-se2" }),
    getTestUnitScenarioExecution({ id: "tu3-se2" }),
  ];
}

function equalArrays(array1: unknown[], array2: unknown[]): boolean {
  return (
    array1.length === array2.length &&
    array1.every((item1) =>
      array2.some((item2) => JSON.stringify(item1) === JSON.stringify(item2))
    )
  );
}
