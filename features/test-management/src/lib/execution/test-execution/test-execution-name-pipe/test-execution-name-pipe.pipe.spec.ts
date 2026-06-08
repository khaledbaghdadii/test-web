import { TestExecutionNamePipe } from "./test-execution-name-pipe.pipe";
import { TestExecution } from "@mxflow/test-management";

describe("TestExecutionNamePipe", () => {
  it("returns only test definition name if no cases are passed", () => {
    const pipe = new TestExecutionNamePipe();
    const testExecution = {
      testPackageDefinitionName: "Test Definition Name",
      testSelectionNames: [],
    } as unknown as TestExecution;
    expect(pipe.transform(testExecution)).toEqual("Test Definition Name");
  });

  it("returns only test definition name if one case is passed", () => {
    const pipe = new TestExecutionNamePipe();
    const testExecution = {
      testPackageDefinitionName: "Test Definition Name",
      testSelectionNames: ["case"],
    } as unknown as TestExecution;
    expect(pipe.transform(testExecution)).toEqual(
      "Test Definition Name (case)"
    );
  });

  it("returns only test definition name if two cases are passed", () => {
    const pipe = new TestExecutionNamePipe();
    const testExecution = {
      testPackageDefinitionName: "Test Definition Name",
      testSelectionNames: ["case1", "case2"],
    } as unknown as TestExecution;
    expect(pipe.transform(testExecution)).toEqual(
      "Test Definition Name (case1, case2)"
    );
  });
});
