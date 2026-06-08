import { TestCaseExecution } from "../test-case-execution";
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "testCaseExecutionDisplay",
  standalone: true,
})
export class TestCaseExecutionDisplayPipe implements PipeTransform {
  transform(testCaseExecutions: TestCaseExecution[]): string {
    if (!testCaseExecutions || testCaseExecutions.length === 0) {
      return "-";
    }
    return testCaseExecutions
      .map(
        (execution) => `${execution.title} (${execution.functionalTestCaseId})`
      )
      .join(", ");
  }
}
