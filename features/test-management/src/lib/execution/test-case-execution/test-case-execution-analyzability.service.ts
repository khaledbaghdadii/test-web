import { Injectable } from "@angular/core";
import { TestCaseExecution } from "@mxflow/test-management";

@Injectable()
export class TestCaseExecutionAnalyzabilityService {
  isUnmapped(testCaseExecution: TestCaseExecution): boolean {
    return (
      testCaseExecution.testCaseKey.startsWith("Unmapped") &&
      testCaseExecution.functionalTestCaseId.length == 0
    );
  }

  isAnalyzable(testCaseExecution: TestCaseExecution): boolean {
    return !this.isNotAnalyzable(testCaseExecution);
  }

  private isNotAnalyzable(testCaseExecution: TestCaseExecution): boolean {
    return (
      this.isUnmapped(testCaseExecution) ||
      testCaseExecution.status.toString() == "SKIPPED"
    );
  }
}
