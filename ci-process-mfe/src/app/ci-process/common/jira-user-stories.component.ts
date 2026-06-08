import { Component, Input } from "@angular/core";
import { JiraIssueUrlResolverPipe } from "@mxflow/features/business-process";

@Component({
  selector: "mxevolve-jira-user-stories",
  templateUrl: "./jira-user-stories.component.html",
  styles: [],
  imports: [JiraIssueUrlResolverPipe],
})
export class JiraUserStories {
  @Input() jiraBaseUrl: string | undefined;
  @Input() userStoryIds: string[];
}
