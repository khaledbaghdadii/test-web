import { ScenarioExecution } from "../../../scenario-execution";
import { ShowTerminationMessagePipe } from "./show-termination-message-pipe";

describe("ShowTerminationMessagePipe", () => {
  let pipe: ShowTerminationMessagePipe;

  beforeEach(() => {
    pipe = new ShowTerminationMessagePipe();
  });

  describe("transform", () => {
    it("should return true when execution status is a failed one", () => {
      const scenarioExecution = {
        isFailed: true,
      } as ScenarioExecution;

      expect(pipe.transform(scenarioExecution)).toBe(true);
    });

    it("should return false when execution is not a failed one", () => {
      const scenarioExecution = {
        isFailed: false,
      } as ScenarioExecution;
      expect(pipe.transform(scenarioExecution)).toBe(false);
    });
  });
});
