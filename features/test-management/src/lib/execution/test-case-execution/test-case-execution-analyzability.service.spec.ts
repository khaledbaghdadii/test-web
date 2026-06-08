import { TestCaseExecution } from "@mxflow/test-management";
import { TestCaseExecutionAnalyzabilityService } from "./test-case-execution-analyzability.service";

describe("test case execution analyzability service", () => {
  let service: TestCaseExecutionAnalyzabilityService;

  beforeEach(() => {
    service = new TestCaseExecutionAnalyzabilityService();
  });

  it("should not return as unmapped if test case key does not start with 'Unmapped' and the functional test case id is not empty", () => {
    const testCaseExecution = {
      testCaseKey: "TC001",
      functionalTestCaseId: "FTC-123",
    } as unknown as TestCaseExecution;

    expect(service.isUnmapped(testCaseExecution)).toBe(false);
  });

  it("should return as unmapped if test case key starts with 'Unmapped' and the functional test case id is empty", () => {
    const testCaseExecution = {
      testCaseKey: "Unmapped_2",
      functionalTestCaseId: "",
    } as unknown as TestCaseExecution;

    expect(service.isUnmapped(testCaseExecution)).toBe(true);
  });

  it("should not return as unmapped if test case key does not start with 'Unmapped'", () => {
    const testCaseExecution = {
      testCaseKey: "TC123",
      functionalTestCaseId: "",
    } as unknown as TestCaseExecution;

    expect(service.isUnmapped(testCaseExecution)).toBe(false);
  });

  it("should not return as unmapped if functional test case id is not empty", () => {
    const testCaseExecution = {
      testCaseKey: "Unmapped_3",
      functionalTestCaseId: "FTC-456",
    } as unknown as TestCaseExecution;

    expect(service.isUnmapped(testCaseExecution)).toBe(false);
  });

  it("should return as analyzable if test case execution is mapped and the status is not skipped", () => {
    const testCaseExecution = {
      testCaseKey: "TC001",
      functionalTestCaseId: "FTC-123",
      status: "PASSED",
    } as unknown as TestCaseExecution;

    expect(service.isAnalyzable(testCaseExecution)).toBe(true);
  });

  it("should not return as analyzable if test case execution is unmapped", () => {
    const testCaseExecution = {
      testCaseKey: "Unmapped_4",
      functionalTestCaseId: "",
    } as unknown as TestCaseExecution;

    expect(service.isAnalyzable(testCaseExecution)).toBe(false);
  });

  it("should not return as analyzable if test case execution status is skipped", () => {
    const testCaseExecution = {
      testCaseKey: "TC002",
      functionalTestCaseId: "FTC-456",
      status: "SKIPPED",
    } as unknown as TestCaseExecution;

    expect(service.isAnalyzable(testCaseExecution)).toBe(false);
  });
});
