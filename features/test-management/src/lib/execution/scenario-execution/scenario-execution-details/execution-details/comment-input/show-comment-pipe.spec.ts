import { ScenarioAnalysisStatus } from "../../../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecution } from "../../../scenario-execution";
import { ShowCommentPipe } from "./show-comment-pipe";

describe("ShowCommentPipe", () => {
  let pipe: ShowCommentPipe;

  beforeEach(() => {
    pipe = new ShowCommentPipe();
  });

  describe("transform", () => {
    it("should return true when execution analysis status is FAILED", () => {
      const scenarioExecution = {
        analysisStatus: ScenarioAnalysisStatus.FAILED,
        isFailed: false,
      } as ScenarioExecution;

      expect(pipe.transform(scenarioExecution)).toBe(true);
    });

    it("should return true when execution analysis status is CANCELLED", () => {
      const scenarioExecution = {
        analysisStatus: ScenarioAnalysisStatus.CANCELLED,
        isFailed: false,
      } as ScenarioExecution;

      expect(pipe.transform(scenarioExecution)).toBe(true);
    });

    it("should return true when execution is a failed one", () => {
      const scenarioExecution = {
        analysisStatus: ScenarioAnalysisStatus.PASSED,
        isFailed: true,
      } as ScenarioExecution;

      expect(pipe.transform(scenarioExecution)).toBe(true);
    });

    it.each([
      ScenarioAnalysisStatus.NA,
      ScenarioAnalysisStatus.ASSIGNED,
      ScenarioAnalysisStatus.UNDER_ANALYSIS,
      ScenarioAnalysisStatus.INCIDENT_SENT,
      ScenarioAnalysisStatus.PASSED,
    ])(
      "should return false when analysis status is %s and execution did not fail",
      (analysisStatus) => {
        const scenarioExecution = {
          analysisStatus,
          isFailed: false,
        } as ScenarioExecution;

        expect(pipe.transform(scenarioExecution)).toBe(false);
      }
    );

    it("should return false when execution did not fail and analysis status is PASSED", () => {
      const scenarioExecution = {
        analysisStatus: ScenarioAnalysisStatus.PASSED,
        isFailed: false,
      } as ScenarioExecution;

      expect(pipe.transform(scenarioExecution)).toBe(false);
    });
  });
});
