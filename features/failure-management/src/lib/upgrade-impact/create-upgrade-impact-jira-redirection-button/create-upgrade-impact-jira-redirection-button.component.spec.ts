import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { CreateUpgradeImpactJiraRedirectionButtonComponent } from "./create-upgrade-impact-jira-redirection-button.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("JiraRedirectionButtonComponent", () => {
  let component: CreateUpgradeImpactJiraRedirectionButtonComponent;
  let fixture: ComponentFixture<CreateUpgradeImpactJiraRedirectionButtonComponent>;
  const jiraConfig: JiraConfig = {
    upgradeImpact: {
      createUpgradeImpactUrl: "jira-url/create",
      upgradeImpactProjectId: "1234",
      createdFromCustomField: "field",
      createdFromCustomFieldValue: "value",
    },
  } as unknown as JiraConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateUpgradeImpactJiraRedirectionButtonComponent],
    }).overrideComponent(CreateUpgradeImpactJiraRedirectionButtonComponent, {
      set: {
        providers: [
          {
            provide: JIRA_CONFIG,
            useValue: jiraConfig,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(
      CreateUpgradeImpactJiraRedirectionButtonComponent
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should navigate to right url", () => {
    component.ngOnInit();

    expect(component.url).toEqual(
      "jira-url/create?pid=1234&issuetype=10&field=value"
    );
  });
});
