import { Pipe, PipeTransform } from "@angular/core";
import { TestExecution } from "../../scenario-execution/scenario-execution";

@Pipe({
  name: "testExecutionName",
  standalone: true,
})
export class TestExecutionNamePipe implements PipeTransform {
  transform(testExecution: TestExecution): unknown {
    if (testExecution.testSelectionNames.length > 0) {
      return `${
        testExecution.testPackageDefinitionName
      } (${testExecution.testSelectionNames.join(", ")})`;
    }
    return testExecution.testPackageDefinitionName;
  }
}
