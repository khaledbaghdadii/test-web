import { Component, Input } from "@angular/core";
import { TagModule } from "primeng/tag";
import {
  TestCaseExecutionAnalysisStatus,
  TestCaseExecutionAnalysisStatusDisplayValue,
} from "./test-case-execution-analysis-status";

@Component({
  imports: [TagModule],
  selector: "mxevolve-test-case-execution-analysis-status",
  templateUrl: "./test-case-execution-analysis-status.component.html",
})
export class TestCaseExecutionAnalysisStatusComponent {
  TestCaseExecutionAnalysisStatus = TestCaseExecutionAnalysisStatus;
  @Input() status: TestCaseExecutionAnalysisStatus;
  protected readonly TestCaseExecutionAnalysisStatusDisplayValue =
    TestCaseExecutionAnalysisStatusDisplayValue;
}
