import { BackportExecutionsSummaryComponent } from "./backport-executions-summary.component";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxflow/features/business-process";
import { lastValueFrom, of, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { CiProcessExecutionsService } from "../../../../ci-process-executions/ci-process-executions.service";
import {
  CiProcessExecutionsQueryResult,
  CiProcessExecutionSummary,
} from "../../../../ci-process-executions/models/ci-process-execution-query-result";

describe("BackportExecutionsSummaryComponent", () => {
  const PROJECT_ID = "project-123";
  const BACKPORT_EXECUTION_IDS = ["exec-1", "exec-2"];
  const FAILED_DEFINITION_IDS = ["def-1", "def-2"];

  const MOCK_EXECUTIONS = [
    { id: "exec-1", name: "Execution 1", status: "PASSED" },
    { id: "exec-2", name: "Execution 2", status: "RUNNING" },
  ] as unknown as CiProcessExecutionSummary[];

  const MOCK_DEFINITIONS = [
    { id: "def-1", name: "Definition 1" },
    { id: "def-2", name: "Definition 2" },
    { id: "def-3", name: "Definition 3" },
  ] as unknown as BusinessProcessDefinition[];

  const MOCK_PAGINATED_RESPONSE = {
    content: MOCK_EXECUTIONS,
    totalElements: 2,
    size: 10,
    number: 0,
  } as CiProcessExecutionsQueryResult;

  let component: BackportExecutionsSummaryComponent;
  let buildAndTestFetcherService: CiProcessExecutionsService;
  let definitionService: BusinessProcessDefinitionService;

  beforeEach(() => {
    const buildAndTestFetcherServiceMock = {
      getCiProcessExecutions: jest.fn(),
    };

    const definitionServiceMock = {
      getBusinessProcessDefinitions: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CiProcessExecutionsService,
          useValue: buildAndTestFetcherServiceMock,
        },
        {
          provide: BusinessProcessDefinitionService,
          useValue: definitionServiceMock,
        },
      ],
    });

    buildAndTestFetcherService = TestBed.inject(CiProcessExecutionsService);
    definitionService = TestBed.inject(BusinessProcessDefinitionService);

    const fixture = TestBed.createComponent(BackportExecutionsSummaryComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.backportExecutionIds = BACKPORT_EXECUTION_IDS;
    component.failedBackportDefinitionIds = FAILED_DEFINITION_IDS;
  });

  it("should fetch the backport executions on init", async () => {
    const mockResponse = of(MOCK_PAGINATED_RESPONSE);
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(mockResponse);
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(of(MOCK_DEFINITIONS));

    component.ngOnInit();

    await lastValueFrom(mockResponse);

    expect(
      buildAndTestFetcherService.getCiProcessExecutions
    ).toHaveBeenCalledWith(PROJECT_ID, { ids: BACKPORT_EXECUTION_IDS });
    expect(component.backportExecutions).toEqual(MOCK_EXECUTIONS);
  });

  it("should fetch the failed backport definitions on init", async () => {
    const mockDefinitionsResponse = of(MOCK_DEFINITIONS);
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(of(MOCK_PAGINATED_RESPONSE));
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(mockDefinitionsResponse);

    component.ngOnInit();

    await lastValueFrom(mockDefinitionsResponse);

    expect(
      definitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
    });
    expect(component.failedBackportDefinitions).toEqual([
      { id: "def-1", name: "Definition 1" },
      { id: "def-2", name: "Definition 2" },
    ]);
  });

  it("should show an error when failing to fetch the backport executions", async () => {
    const errorObservable = throwError(
      () => new Error("Failed to fetch executions")
    );
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(errorObservable);
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(of(MOCK_DEFINITIONS));

    component.ngOnInit();

    await lastValueFrom(errorObservable).catch(() => {});

    expect(component.errorMessage).toBe("Failed to fetch backport executions");
  });

  it("should not fetch executions when backportExecutionIds is empty", () => {
    component.backportExecutionIds = [];
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(of(MOCK_DEFINITIONS));

    component.ngOnInit();

    expect(
      buildAndTestFetcherService.getCiProcessExecutions
    ).not.toHaveBeenCalled();
  });

  it("should not fetch definitions when failedBackportDefinitionIds is empty", () => {
    component.failedBackportDefinitionIds = [];
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(of(MOCK_PAGINATED_RESPONSE));

    component.ngOnInit();

    expect(
      definitionService.getBusinessProcessDefinitions
    ).not.toHaveBeenCalled();
  });

  it("should filter definitions to only include failed backport definitions", async () => {
    const mockDefinitionsResponse = of(MOCK_DEFINITIONS);
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(of(MOCK_PAGINATED_RESPONSE));
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(mockDefinitionsResponse);

    component.ngOnInit();

    await lastValueFrom(mockDefinitionsResponse);

    expect(component.failedBackportDefinitions).toHaveLength(2);
    expect(component.failedBackportDefinitions).toEqual([
      { id: "def-1", name: "Definition 1" },
      { id: "def-2", name: "Definition 2" },
    ]);
    expect(
      component.failedBackportDefinitions.find((def) => def.id === "def-3")
    ).toBeUndefined();
  });

  it("should show the ids of the backport executions that were not returned in the response", async () => {
    const mockResponse = {
      content: [MOCK_EXECUTIONS[0]],
      totalElements: 1,
      size: 10,
      number: 0,
    } as unknown as CiProcessExecutionsQueryResult;
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(of(mockResponse));
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(of(MOCK_DEFINITIONS));

    component.ngOnInit();

    await lastValueFrom(of(mockResponse));

    expect(component.backportExecutions).toEqual([
      MOCK_EXECUTIONS[0],
      { id: MOCK_EXECUTIONS[1].id },
    ]);
  });

  it("should show the definitions that could not be fetched", async () => {
    const mockDefinitionsResponse = of([MOCK_DEFINITIONS[0]]);
    jest
      .spyOn(buildAndTestFetcherService, "getCiProcessExecutions")
      .mockReturnValue(of(MOCK_PAGINATED_RESPONSE));
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(mockDefinitionsResponse);

    component.ngOnInit();

    await lastValueFrom(mockDefinitionsResponse);

    expect(component.failedBackportDefinitions).toEqual([
      { id: "def-1", name: "Definition 1" },
    ]);
    expect(component.missingDefinitions).toEqual(["def-2"]);
  });
});
