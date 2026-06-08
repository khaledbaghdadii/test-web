import { JiraIssueUrlResolverPipe } from "./jira-issue-url-resolver.pipe";

describe("JiraIssueUrlResolverPipe", () => {
  let pipe: JiraIssueUrlResolverPipe;

  beforeEach(() => {
    pipe = new JiraIssueUrlResolverPipe();
  });

  it("should construct a valid Jira issue URL with a simple issue ID", () => {
    const issueId = "PROJ-123";
    const baseUrl = "https://jira.example.com";
    const result = pipe.transform(issueId, baseUrl);
    expect(result).toBe("https://jira.example.com/browse/PROJ-123");
  });

  it("should handle base URL with trailing slash", () => {
    const issueId = "PROJ-456";
    const baseUrl = "https://jira.example.com/";
    const result = pipe.transform(issueId, baseUrl);
    expect(result).toBe("https://jira.example.com/browse/PROJ-456");
  });

  it("should encode special characters in issue ID", () => {
    const issueId = "PROJ-123 TEST";
    const baseUrl = "https://jira.example.com";
    const result = pipe.transform(issueId, baseUrl);
    expect(result).toBe("https://jira.example.com/browse/PROJ-123%20TEST");
  });

  it("should handle undefined baseUrl gracefully", () => {
    const issueId = "PROJ-789";
    const baseUrl = undefined;
    const result = pipe.transform(issueId, baseUrl);
    expect(result).toBe("");
  });
});
