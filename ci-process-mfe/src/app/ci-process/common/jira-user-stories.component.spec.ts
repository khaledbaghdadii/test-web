import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { JiraUserStories } from "./jira-user-stories.component";
import { JiraIssueUrlResolverPipe } from "@mxflow/features/business-process";

describe("JiraUserStoriesComponent", () => {
  beforeEach(() => {
    return MockBuilder(JiraUserStories).keep(JiraIssueUrlResolverPipe);
  });

  it("should display all user stories with correct names and links", () => {
    const baseUrl = "https://jira.example.com";
    const userStoryIds = ["JIRA-123", "JIRA-456"];

    const fixture = MockRender(JiraUserStories, {
      jiraBaseUrl: baseUrl,
      userStoryIds: userStoryIds,
    });

    const links = ngMocks.findAll(fixture, "a");
    expect(links[0].nativeElement.textContent).toBe("JIRA-123");
    expect(links[0].nativeElement.getAttribute("href")).toBe(
      "https://jira.example.com/browse/JIRA-123"
    );
    expect(links[1].nativeElement.textContent).toBe("JIRA-456");
    expect(links[1].nativeElement.getAttribute("href")).toBe(
      "https://jira.example.com/browse/JIRA-456"
    );
  });

  it("should add commas between user stories except after the last one", () => {
    const baseUrl = "https://jira.example.com";
    const userStoryIds = ["JIRA-123", "JIRA-456", "JIRA-789"];

    const fixture = MockRender(JiraUserStories, {
      jiraBaseUrl: baseUrl,
      userStoryIds: userStoryIds,
    });

    const commas = ngMocks.findAll(fixture, "span");
    expect(commas.length).toBe(2);
    expect(commas[0].nativeElement.textContent).toBe(", ");
    expect(commas[1].nativeElement.textContent).toBe(", ");
  });

  it("should not add commas when there is only one user story", () => {
    const baseUrl = "https://jira.example.com";
    const userStoryIds = ["JIRA-123"];

    const fixture = MockRender(JiraUserStories, {
      jiraBaseUrl: baseUrl,
      userStoryIds: userStoryIds,
    });

    const commas = ngMocks.findAll(fixture, "span");
    expect(commas.length).toBe(0);
  });

  it("should display nothing when no user stories are provided", () => {
    const baseUrl = "https://jira.example.com";
    const userStoryIds: string[] = [];

    const fixture = MockRender(JiraUserStories, {
      jiraBaseUrl: baseUrl,
      userStoryIds: userStoryIds,
    });

    const links = ngMocks.findAll(fixture, "a");
    expect(links.length).toBe(0);
  });
});
