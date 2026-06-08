import { KeptExecutionDisabledPipe } from "./kept-execution-disabled.pipe";
import { CheckKeptExecutionDisabledRequest } from "./check-kept-execution-disabled-request";

describe("kept execution disabled pipe", () => {
  let pipe: KeptExecutionDisabledPipe;
  const checkKeptExecutionDisabledRequest: CheckKeptExecutionDisabledRequest = {
    scenarioExecutionCleaningStatus: "NOT_LAUNCHED",
    isScenarioExecutionFailed: true,
    disableKeepExecution: false,
  };

  beforeEach(() => {
    pipe = new KeptExecutionDisabledPipe();
  });

  it("should return false if cleaning status is not launched, execution failed, and disabled keep execution is false", () => {
    expect(pipe.transform(checkKeptExecutionDisabledRequest)).toEqual(false);
  });

  it("should return true if cleaning status is different than not launched", () => {
    expect(
      pipe.transform({
        ...checkKeptExecutionDisabledRequest,
        scenarioExecutionCleaningStatus: "PASSED",
      })
    ).toEqual(true);
  });

  it("should return true if execution did not fail", () => {
    expect(
      pipe.transform({
        ...checkKeptExecutionDisabledRequest,
        isScenarioExecutionFailed: false,
      })
    ).toEqual(true);
  });

  it("should return true if disabled keep execution is true", () => {
    expect(
      pipe.transform({
        ...checkKeptExecutionDisabledRequest,
        disableKeepExecution: true,
      })
    ).toEqual(true);
  });
});
