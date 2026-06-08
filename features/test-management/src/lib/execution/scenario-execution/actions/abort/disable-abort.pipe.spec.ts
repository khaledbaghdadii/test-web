import { ScenarioExecutionStatus } from "../../scenario-execution-status/scenario-execution-status";
import { DisableAbortPipe } from "./disable-abort.pipe";

describe("DisableAbortPipe", () => {
  it("create an instance", () => {
    const pipe = new DisableAbortPipe();
    expect(pipe).toBeTruthy();
  });

  describe("transform", () => {
    it.each([
      ScenarioExecutionStatus.PASSED,
      ScenarioExecutionStatus.FAILED,
      ScenarioExecutionStatus.ABORTED,
      ScenarioExecutionStatus.FAILED_TO_ABORT,
      ScenarioExecutionStatus.ABORTING,
      ScenarioExecutionStatus.READY,
      ScenarioExecutionStatus.NA,
    ])(
      "should return true for non-underway status: %s",
      (status: ScenarioExecutionStatus) => {
        const pipe = new DisableAbortPipe();
        expect(pipe.transform(status)).toBe(true);
      }
    );

    it("should return false for UNDERWAY status", () => {
      const pipe = new DisableAbortPipe();
      expect(pipe.transform(ScenarioExecutionStatus.UNDERWAY)).toBe(false);
    });
  });
});
