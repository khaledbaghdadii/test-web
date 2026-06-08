import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TestCaseExecution } from "../test-case-execution";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { Tooltip } from "primeng/tooltip";
import { TestCaseExecutionDisplayPipe } from "./test-case-execution-display.pipe";

@Component({
  selector: "mxevolve-test-case-execution-display",
  imports: [CommonModule, Tooltip, TestCaseExecutionDisplayPipe],
  templateUrl: "./test-case-execution-display.component.html",
})
export class TestCaseExecutionDisplayComponent {
  private readonly jiraConfig = inject<JiraConfig>(JIRA_CONFIG);
  protected readonly functionalTestCaseBaseUrl: string;

  @Input() testCaseExecutions: TestCaseExecution[] = [];

  constructor() {
    this.functionalTestCaseBaseUrl = this.jiraConfig.functionalTestCaseBaseUrl;
  }
}
