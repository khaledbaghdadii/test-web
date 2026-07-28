import { KeepExecutionDisabledPipe } from "./keep-execution-disabled.pipe";
import { CheckKeepExecutionDisabledRequest } from "./check-keep-execution-disabled-request";

describe("keep execution disabled pipe", () => {
  let pipe: KeepExecutionDisabledPipe;
  const checkKeepExecutionDisabledRequest: CheckKeepExecutionDisabledRequest = {
    scenarioExecutionCleaningStatus: "NOT_LAUNCHED",
    isScenarioExecutionFailed: true,
    disableKeepExecution: false,
    isTestUnitHead: true,
  };

  beforeEach(() => {
    pipe = new KeepExecutionDisabledPipe();
  });

  it("should return false if cleaning status is not launched, scenario is test unit head, execution failed, and disabled keep execution is false", () => {
    expect(pipe.transform(checkKeepExecutionDisabledRequest)).toEqual(false);
  });

  it("should return true if cleaning status is different than not launched", () => {
    expect(
      pipe.transform({
        ...checkKeepExecutionDisabledRequest,
        scenarioExecutionCleaningStatus: "PASSED",
      })
    ).toEqual(true);
  });

  it("should return true if the scenario is not head of the test unit", () => {
    expect(
      pipe.transform({
        ...checkKeepExecutionDisabledRequest,
        isTestUnitHead: false,
      })
    ).toEqual(true);
  });

  it("should return true if execution did not fail", () => {
    expect(
      pipe.transform({
        ...checkKeepExecutionDisabledRequest,
        isScenarioExecutionFailed: false,
      })
    ).toEqual(true);
  });

  it("should return true if disabled keep execution is true", () => {
    expect(
      pipe.transform({
        ...checkKeepExecutionDisabledRequest,
        disableKeepExecution: true,
      })
    ).toEqual(true);
  });
});
