import { Component, Input } from "@angular/core";

import { Tag } from "primeng/tag";
import { TestExecutionStatus } from "../scenario-execution";

@Component({
  standalone: true,
  imports: [Tag],
  selector: "mxevolve-test-execution-status",
  templateUrl: "./test-execution-status.component.html",
})
export class TestExecutionStatusComponent {
  @Input() status: TestExecutionStatus;

  protected readonly TestExecutionStatus = TestExecutionStatus;
}
