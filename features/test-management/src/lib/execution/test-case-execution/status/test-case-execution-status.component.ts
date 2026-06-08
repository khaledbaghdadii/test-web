import { Component, Input } from "@angular/core";
import {
  TestCaseExecutionStatus,
  TestCaseExecutionStatusDisplayValue,
} from "./test-case-execution-status";

@Component({
  standalone: true,
  templateUrl: "test-case-execution-status.component.html",
  selector: "mxevolve-test-case-execution-status",
  imports: [],
})
export class TestCaseExecutionStatusComponent {
  @Input({ required: true }) status: TestCaseExecutionStatus;
  protected readonly TestCaseExecutionStatus = TestCaseExecutionStatus;
  protected readonly TestCaseExecutionStatusDisplayValue =
    TestCaseExecutionStatusDisplayValue;
}
