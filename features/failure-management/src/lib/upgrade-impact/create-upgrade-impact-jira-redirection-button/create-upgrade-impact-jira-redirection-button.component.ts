import { Component, OnInit, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { HttpParams } from "@angular/common/http";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";

@Component({
  imports: [ButtonModule],
  selector: "mxevolve-create-upgrade-impact-jira-redirection-button",
  template: `
    <a href="{{ url }}" target="_blank" rel="noopener" class="text-blue-400">
      <p-button label="Create an Upgrade Impact"></p-button>
    </a>
  `,
})
export class CreateUpgradeImpactJiraRedirectionButtonComponent
  implements OnInit
{
  private config = inject<JiraConfig>(JIRA_CONFIG);

  url: string;
  private readonly issueType = 10;

  ngOnInit(): void {
    const params = new HttpParams()
      .set("pid", this.config.upgradeImpact.upgradeImpactProjectId)
      .set("issuetype", this.issueType)
      .set(
        this.config.upgradeImpact.createdFromCustomField,
        this.config.upgradeImpact.createdFromCustomFieldValue
      );

    this.url = `${
      this.config.upgradeImpact.createUpgradeImpactUrl
    }?${params.toString()}`;
  }
}
