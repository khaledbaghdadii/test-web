import { ScenarioExecutionSortingService } from "./scenario-execution-sorting.service";
import { ScenarioExecution } from "@mxflow/test-management";

describe("ScenarioExecutionSortingService", () => {
  let service: ScenarioExecutionSortingService;

  beforeEach(() => {
    service = new ScenarioExecutionSortingService();
  });

  it("should sort the scenario executions by descending start date", function () {
    const scenarioExecutions = service.sortByStartDate([
      getSecondScenarioExecution(),
      getScenarioExecution(),
      getThirdScenarioExecution(),
    ]);
    expect(scenarioExecutions[0]).toEqual(getThirdScenarioExecution());
    expect(scenarioExecutions[1]).toEqual(getSecondScenarioExecution());
    expect(scenarioExecutions[2]).toEqual(getScenarioExecution());
  });

  it("should return empty array if array is empty", function () {
    const scenarioExecutions = service.sortByStartDate([]);
    expect(scenarioExecutions.length).toEqual(0);
  });
});

function getScenarioExecution(): ScenarioExecution {
  return {
    id: "1",
    scenarioDefinitionId: "1",
    startDate: "2022-09-20T12:20:47.173874Z",
    endDate: "2022-09-20T13:20:47.173874Z",
    status: "Failed",
  } as ScenarioExecution;
}

function getSecondScenarioExecution() {
  return {
    id: "2",
    scenarioDefinitionId: "1",
    startDate: "2022-09-20T13:20:48.173874Z",
    endDate: "2022-09-20T14:20:48.173874Z",
    status: "Failed",
  } as ScenarioExecution;
}

function getThirdScenarioExecution() {
  return {
    id: "3",
    scenarioDefinitionId: "1",
    startDate: "2022-09-20T15:20:48.173874Z",
    endDate: "2022-09-20T16:20:48.173874Z",
    status: "Passed",
  } as ScenarioExecution;
}
