import { TestCaseExecutionDisplayPipe } from "./test-case-execution-display.pipe";
import { TestCaseExecution } from "../test-case-execution";

describe("TestCaseExecutionDisplayPipe", () => {
  let pipe: TestCaseExecutionDisplayPipe;

  beforeEach(() => {
    pipe = new TestCaseExecutionDisplayPipe();
  });

  it.each([
    [null as unknown as TestCaseExecution[]],
    [undefined as unknown as TestCaseExecution[]],
    [[]],
  ])(
    "returns a dash if no test case executions exist",
    (testCaseExecutions: TestCaseExecution[]) => {
      expect(pipe.transform(testCaseExecutions)).toEqual("-");
    }
  );

  it("returns the test case title and ftc id in case one test case execution is passed", () => {
    const testCaseExecutions = [
      { title: "Test Case 1", functionalTestCaseId: "TC001" },
    ] as TestCaseExecution[];
    expect(pipe.transform(testCaseExecutions)).toEqual("Test Case 1 (TC001)");
  });

  it("returns comma-separated test case title and ftc ids when multiple test case executions are passed", () => {
    const testCaseExecutions = [
      { title: "Test Case 1", functionalTestCaseId: "TC001" },
      { title: "Test Case 2", functionalTestCaseId: "TC002" },
      { title: "Test Case 3", functionalTestCaseId: "TC003" },
    ] as TestCaseExecution[];
    expect(pipe.transform(testCaseExecutions)).toEqual(
      "Test Case 1 (TC001), Test Case 2 (TC002), Test Case 3 (TC003)"
    );
  });
});
