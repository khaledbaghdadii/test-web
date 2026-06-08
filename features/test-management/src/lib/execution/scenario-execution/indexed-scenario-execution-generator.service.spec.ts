import {
  IndexedScenarioExecutionGeneratorService,
  ScenarioExecution,
  ScenarioExecutionSortingService,
  TestExecution,
} from "@mxflow/test-management/execution";
import { TestBed } from "@angular/core/testing";

const getExecution = (id: string) => {
  return {
    id: id,
    startDate: "2023-03-16T08:54:10.949163Z",
    endDate: "",
    status: "Failed",
    terminationMessage: "Environment Failure",
    logFileUrl: "https:log.com",
    environmentId: "environmentId",
    commitId: "commitId",
    branch: "branch",
    testExecutions: [
      {
        testPackageDefinitionName: "DEMO",
        testSelectionNames: ["Child 1"],
        testPackageDefinitionId: "213",
        report: {
          url: "url",
          uploading: true,
        },
        status: "Failed",
        startDate: "2016-06-22 19:10:25-07",
        endDate: "2016-06-22 19:10:25-07",
      } as TestExecution,
    ],
  } as ScenarioExecution;
};

function getSortedScenarioExecutions() {
  return [getExecution("1st"), getExecution("2nd"), getExecution("3rd")];
}

function getScenarioExecutions() {
  return [getExecution("2nd"), getExecution("1st"), getExecution("3rd")];
}

describe("IndexedScenarioExecutionGeneratorService", () => {
  let service: IndexedScenarioExecutionGeneratorService;
  let sortingService: ScenarioExecutionSortingService;

  beforeEach(() => {
    sortingService = {
      sortByStartDate: jest.fn(() => getSortedScenarioExecutions()),
    };

    TestBed.configureTestingModule({
      providers: [IndexedScenarioExecutionGeneratorService],
    }).overrideProvider(ScenarioExecutionSortingService, {
      useValue: sortingService,
    });

    service = TestBed.inject(IndexedScenarioExecutionGeneratorService);
  });

  it("should index the sorted list correctly", () => {
    expect(service.generate(getScenarioExecutions())).toEqual([
      { ...getExecution("1st"), index: 3 },
      { ...getExecution("2nd"), index: 2 },
      { ...getExecution("3rd"), index: 1 },
    ]);
    expect(sortingService.sortByStartDate).toHaveBeenCalledWith(
      getScenarioExecutions()
    );
  });
});
